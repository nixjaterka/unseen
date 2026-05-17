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
