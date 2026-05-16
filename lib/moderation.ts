// Photo moderation via Sightengine.
//
// Server-side only — the API credentials must never reach the client. If
// SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET are not set in .env, the
// function logs a loud warning and allows uploads through (so dev still
// works). Production must have credentials set.
//
// When credentials ARE set and Sightengine errors or is unreachable, we
// fail closed: the upload is rejected. Better to occasionally annoy a
// real user than to let a bad photo through.

export type ModerationResult = {
  clean: boolean;
  /** Internal reason for logging. Never surfaced to the user. */
  reason?: string;
};

const MODELS = "nudity-2.1,weapon,offensive,gore";

// Thresholds — tuned conservatively for a dating app. Adjust based on
// false-positive feedback in production.
const NUDITY_RAW_THRESHOLD = 0.5;
const NUDITY_PARTIAL_THRESHOLD = 0.8;
const WEAPON_THRESHOLD = 0.7;
const OFFENSIVE_THRESHOLD = 0.6;
const GORE_THRESHOLD = 0.5;

export async function moderatePhotoUrl(
  imageUrl: string
): Promise<ModerationResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    console.warn(
      "[moderation] SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET not set — " +
        "photo moderation is OFF. Uploads will be allowed without checking. " +
        "Set these in .env.local (or your hosting env) before launch."
    );
    return { clean: true, reason: "moderation_disabled" };
  }

  const url = new URL("https://api.sightengine.com/1.0/check.json");
  url.searchParams.set("url", imageUrl);
  url.searchParams.set("models", MODELS);
  url.searchParams.set("api_user", apiUser);
  url.searchParams.set("api_secret", apiSecret);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data?.status !== "success") {
      console.warn("[moderation] Sightengine non-success:", data);
      return { clean: false, reason: "moderation_error" };
    }

    const flag = checkFlags(data);
    if (flag) {
      console.log("[moderation] rejected:", flag);
      return { clean: false, reason: flag };
    }

    return { clean: true };
  } catch (err) {
    console.error("[moderation] fetch failed:", err);
    return { clean: false, reason: "moderation_unavailable" };
  }
}

function checkFlags(data: {
  nudity?: { raw?: number; partial?: number };
  weapon?: number;
  offensive?: { prob?: number };
  gore?: { prob?: number };
}): string | null {
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
