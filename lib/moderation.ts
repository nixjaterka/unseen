// Photo moderation via Sightengine.
//
// Server-side only — the API credentials must never reach the client. If
// SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET are not set in .env, the
// function logs a loud warning and allows uploads through (so dev still
// works). Production must have credentials set.
//
// Security: credentials are sent as POST body fields (multipart/form-data),
// never as URL query params. The image is fetched server-side and forwarded
// as binary — Sightengine never receives the signed storage URL.
//
// Decision matrix
// ───────────────
// AUTO-BLOCK (clean: false)
//   • Nudity / offensive content
//   • No human face detected
//
// PENDING REVIEW (clean: true, pending: true)
//   • Multiple faces (group photo — likely not a solo shot)
//   • High probability of AI-generated image
//
// APPROVED (clean: true, pending: false)
//   • Everything else

export type ModerationResult = {
  clean: boolean;
  /** true = upload stored but needs human review before going live */
  pending?: boolean;
  /** Internal reason for logging. Never surfaced to the user. */
  reason?: string;
};

// Model names must match exactly what's configured in the Sightengine account.
// Using any model not on the plan causes a non-success response, which our
// fail-closed logic treats as a block and rejects every photo.
//   nudity-2.1   — raw/partial nudity detection
//   offensive-2.0 — offensive / hate content
//   face-age     — face detection (also returns age, but we only need faces[])
//   genai        — AI-generated image probability
const MODELS = "nudity-2.1,offensive-2.0,face-age,genai";

// ── Thresholds ────────────────────────────────────────────────────────────────

const NUDITY_RAW_THRESHOLD      = 0.5;
const NUDITY_PARTIAL_THRESHOLD  = 0.8;
const OFFENSIVE_THRESHOLD       = 0.6;

// Face count — 0 faces → block; >2 faces → review (group photo).
const MULTI_FACE_THRESHOLD      = 2;

// AI-generated — above this probability, send to review.
// genai model returns data.type.ai_generated (0–1).
const AI_GENERATED_THRESHOLD    = 0.75;

// ── Main export ───────────────────────────────────────────────────────────────

export async function moderatePhotoUrl(
  imageUrl: string
): Promise<ModerationResult> {
  const apiUser   = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    console.warn(
      "[moderation] SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET not set — " +
        "photo moderation is OFF. Uploads will be allowed without checking. " +
        "Set these in .env.local (and Vercel env vars) before launch."
    );
    return { clean: true, reason: "moderation_disabled" };
  }

  // Fetch the image server-side, then forward it to Sightengine as a
  // multipart POST. This keeps credentials out of URL-based access logs
  // (both ours and Sightengine's) and prevents the signed storage URL
  // from leaking to a third party.
  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error("[moderation] failed to fetch image for moderation:", imgRes.status);
      return { clean: false, reason: "moderation_unavailable" };
    }
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  } catch (err) {
    console.error("[moderation] image fetch error:", err);
    return { clean: false, reason: "moderation_unavailable" };
  }

  // Since we compress everything to JPEG client-side before upload, we can
  // always send image/jpeg here. sniffMime is kept as a safety fallback.
  const contentType = sniffMime(imageBuffer);

  const form = new FormData();
  form.append("models",     MODELS);
  form.append("api_user",   apiUser);
  form.append("api_secret", apiSecret);
  form.append(
    "media",
    new Blob([new Uint8Array(imageBuffer)], { type: contentType }),
    "photo.jpg"
  );

  try {
    const res  = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body:   form,
    });
    const data = await res.json();

    if (data?.status !== "success") {
      console.warn("[moderation] Sightengine non-success:", JSON.stringify(data));
      return { clean: false, reason: "moderation_error" };
    }

    return evaluate(data);
  } catch (err) {
    console.error("[moderation] fetch failed:", err);
    return { clean: false, reason: "moderation_unavailable" };
  }
}

// ── Evaluation logic ─────────────────────────────────────────────────────────

type SightengineResponse = {
  nudity?:    { raw?: number; partial?: number };
  offensive?: { prob?: number };
  faces?:     unknown[];
  // genai model puts its score inside data.type.ai_generated
  type?:      { ai_generated?: number; photo?: number };
};

function evaluate(data: SightengineResponse): ModerationResult {
  // 1. Hard blocks — content policy violations.
  const contentFlag = checkContent(data);
  if (contentFlag) {
    console.log("[moderation] auto-blocked:", contentFlag);
    return { clean: false, reason: contentFlag };
  }

  // 2. Hard block — no face detected.
  const faceCount = Array.isArray(data?.faces) ? data.faces.length : 0;
  if (faceCount === 0) {
    console.log("[moderation] auto-blocked: no_face");
    return { clean: false, reason: "no_face" };
  }

  // 3. Soft flag — group photo (review queue).
  if (faceCount > MULTI_FACE_THRESHOLD) {
    console.log("[moderation] pending review: group_photo, faces=" + faceCount);
    return { clean: true, pending: true, reason: "group_photo" };
  }

  // 4. Soft flag — likely AI-generated (review queue).
  const aiScore = data?.type?.ai_generated ?? 0;
  if (aiScore > AI_GENERATED_THRESHOLD) {
    console.log("[moderation] pending review: ai_generated, score=" + aiScore.toFixed(2));
    return { clean: true, pending: true, reason: "ai_generated" };
  }

  return { clean: true };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Detect MIME type from buffer magic bytes — good enough for JPEG/PNG/WebP. */
function sniffMime(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return "application/octet-stream";
}

function checkContent(data: SightengineResponse): string | null {
  const nudity = data?.nudity;
  if (typeof nudity?.raw === "number" && nudity.raw > NUDITY_RAW_THRESHOLD) {
    return "nudity_raw";
  }
  if (typeof nudity?.partial === "number" && nudity.partial > NUDITY_PARTIAL_THRESHOLD) {
    return "nudity_partial";
  }
  const offensive = data?.offensive;
  if (typeof offensive?.prob === "number" && offensive.prob > OFFENSIVE_THRESHOLD) {
    return "offensive";
  }
  return null;
}
