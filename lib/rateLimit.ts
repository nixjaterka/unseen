// Rate limiting via Upstash Redis.
//
// If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set (local dev),
// all checks pass silently so development is unaffected.
//
// Usage in a route handler:
//   const limited = await rateLimit("photos:moderate", userId, { requests: 5, window: "1 m" });
//   if (limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily initialised so missing env vars don't crash the import.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[rateLimit] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limiting disabled.");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Cache limiter instances so we don't recreate them per request.
const limiters = new Map<string, Ratelimit>();

function getLimiter(key: string, requests: number, window: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${key}:${requests}:${window}`;
  if (!limiters.has(cacheKey)) {
    limiters.set(
      cacheKey,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
        prefix: `unseen:rl:${key}`,
      })
    );
  }
  return limiters.get(cacheKey)!;
}

/**
 * Returns true if the request should be blocked (limit exceeded).
 *
 * @param bucket  Logical bucket name, e.g. "photos:moderate"
 * @param userId  Identifier to rate-limit by (user ID or IP)
 * @param opts    { requests: number, window: string } e.g. { requests: 5, window: "1 m" }
 */
export async function rateLimit(
  bucket: string,
  userId: string,
  opts: { requests: number; window: string }
): Promise<boolean> {
  const limiter = getLimiter(bucket, opts.requests, opts.window);
  if (!limiter) return false; // Redis not configured — allow through

  const { success } = await limiter.limit(userId);
  return !success;
}

// ── Recent-refusal marker (contact filter) ───────────────────────────────────
//
// When the contact filter refuses a message we remember it briefly, per person
// per conversation. While the marker is set, the filter applies its strict
// bare-handle rule to that person's next messages.
//
// This is what closes the obvious retry: "moje ig je nixjaterka" gets refused,
// so the sender just types "nixjaterka" on its own. The server can't see that
// from message history, because a refused message is never inserted — hence
// the marker. Someone who has never been refused never trips the strict rule,
// which is what keeps the false-positive cost near zero.

const REFUSAL_TTL_SECONDS = 10 * 60;

function refusalKey(userId: string, matchId: number) {
  return `unseen:cf:refused:${matchId}:${userId}`;
}

/** Remember that this person's message was just refused in this conversation. */
export async function markContactRefusal(userId: string, matchId: number): Promise<void> {
  const r = getRedis();
  if (!r) return; // Redis not configured — strict mode simply never engages
  try {
    await r.set(refusalKey(userId, matchId), "1", { ex: REFUSAL_TTL_SECONDS });
  } catch {
    // Non-fatal: the filter still works, just without the strict follow-up.
  }
}

/** True if this person was refused in this conversation in the last few minutes. */
export async function hasRecentContactRefusal(userId: string, matchId: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    return (await r.get(refusalKey(userId, matchId))) !== null;
  } catch {
    return false;
  }
}
