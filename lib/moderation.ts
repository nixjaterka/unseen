// Photo moderation via Sightengine.
//
// Server-side only — the API credentials must never reach the client. If
// SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET are not set in .env, the
// function logs a loud warning and allows uploads through (so dev still
// works). Production must have credentials set.
//
// Decision matrix
// ───────────────
// AUTO-BLOCK (clean: false)
//   • Nudity / gore / weapon / offensive
//   • Not a real photograph (illustration, animated, drawing)
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

const MODELS = "nudity-2.1,weapon,offensive,gore,face,type,ai-generated";

// ── Thresholds ────────────────────────────────────────────────────────────────

// Content moderation
const NUDITY_RAW_THRESHOLD      = 0.5;
const NUDITY_PARTIAL_THRESHOLD  = 0.8;
const WEAPON_THRESHOLD          = 0.7;
const OFFENSIVE_THRESHOLD       = 0.6;
const GORE_THRESHOLD            = 0.5;

// Real photo check — if the image is mostly illustration/animated, block it.
const REAL_PHOTO_MIN            = 0.40;

// Face count — 0 faces → block; >2 faces → review (group photo).
const MULTI_FACE_THRESHOLD      = 2;

// AI-generated — above this probability, send to review.
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

  // Use POST so credentials go in the request body, not in the URL.
  // GET would expose api_user + api_secret in Vercel/Cloudflare/Sightengine
  // access logs as plaintext query parameters.
  const formBody = new URLSearchParams({
    url:        imageUrl,
    models:     MODELS,
    api_user:   apiUser,
    api_secret: apiSecret,
  });

  try {
    const res  = await fetch("https://api.sightengine.com/1.0/check.json", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    formBody.toString(),
    });
    const data = await res.json();

    if (data?.status !== "success") {
      console.warn("[moderation] Sightengine non-success:", data);
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
  nudity?:        { raw?: number; partial?: number };
  weapon?:        number;
  offensive?:     { prob?: number };
  gore?:          { prob?: number };
  faces?:         unknown[];
  type?:          { photo?: number; illustration?: number; animated?: number };
  ai_generated?:  { ai?: number };
};

function evaluate(data: SightengineResponse): ModerationResult {
  // 1. Hard blocks — content policy violations.
  const contentFlag = checkContent(data);
  if (contentFlag) {
    console.log("[moderation] auto-blocked:", contentFlag);
    return { clean: false, reason: contentFlag };
  }

  // 2. Hard block — not a real photograph.
  const photoScore = data?.type?.photo ?? 1;
  if (photoScore < REAL_PHOTO_MIN) {
    const detail = `photo_score=${photoScore.toFixed(2)}`;
    console.log("[moderation] auto-blocked: not_real_photo", detail);
    return { clean: false, reason: "not_real_photo" };
  }

  // 3. Hard block — no face detected.
  const faceCount = Array.isArray(data?.faces) ? data.faces.length : 0;
  if (faceCount === 0) {
    console.log("[moderation] auto-blocked: no_face");
    return { clean: false, reason: "no_face" };
  }

  // 4. Soft flag — group photo (review queue).
  if (faceCount > MULTI_FACE_THRESHOLD) {
    console.log("[moderation] pending review: group_photo, faces=" + faceCount);
    return { clean: true, pending: true, reason: "group_photo" };
  }

  // 5. Soft flag — likely AI-generated (review queue).
  const aiScore = data?.ai_generated?.ai ?? 0;
  if (aiScore > AI_GENERATED_THRESHOLD) {
    console.log("[moderation] pending review: ai_generated, score=" + aiScore.toFixed(2));
    return { clean: true, pending: true, reason: "ai_generated" };
  }

  return { clean: true };
}

function checkContent(data: SightengineResponse): string | null {
  const nudity = data?.nudity;
  if (typeof nudity?.raw === "number" && nudity.raw > NUDITY_RAW_THRESHOLD) {
    return "nudity_raw";
  }
  if (
    typeof nudity?.partial === "number" &&
    nudity.partial > NUDITY_PARTIAL_THRESHOLD
  ) {
    return "nudity_partial";
  }
  if (typeof data?.weapon === "number" && data.weapon > WEAPON_THRESHOLD) {
    return "weapon";
  }
  const offensive = data?.offensive;
  if (
    typeof offensive?.prob === "number" &&
    offensive.prob > OFFENSIVE_THRESHOLD
  ) {
    return "offensive";
  }
  const gore = data?.gore;
  if (typeof gore?.prob === "number" && gore.prob > GORE_THRESHOLD) {
    return "gore";
  }
  return null;
}
