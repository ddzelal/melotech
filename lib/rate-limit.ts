/**
 * Sliding-window rate limiter: max 3 generations per minute, keyed by client.
 *
 * In-memory by design — fine for an MVP / single instance. For multi-instance
 * deploys this would move to Redis/Upstash, but the interface stays the same.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Seconds until the window frees up (only meaningful when `ok` is false). */
  retryAfter: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, remaining: MAX_REQUESTS - recent.length, retryAfter: 0 };
}

export { MAX_REQUESTS, WINDOW_MS };
