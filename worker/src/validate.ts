/**
 * Input validation utilities for the Early Thunder API.
 * All functions enforce strict bounds and return explicit results.
 */

const MAX_EMAIL_LENGTH = 254;
const MIN_EMAIL_LENGTH = 5;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_KEY_PREFIX = "ratelimit:";

/**
 * Strict email format regex — covers standard addr-spec without
 * edge-case quoted-string local parts (intentional for a signup form).
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates an email address string.
 * Checks type, length bounds, and format via regex.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") {
    return false;
  }

  if (email.length < MIN_EMAIL_LENGTH || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return EMAIL_REGEX.test(email);
}

interface RateLimitRecord {
  readonly timestamps: readonly number[];
}

/**
 * Checks whether a given IP has exceeded the rate limit window.
 * Returns true if the caller IS rate-limited (should be blocked).
 */
export async function isRateLimited(
  ip: string,
  kv: KVNamespace,
): Promise<boolean> {
  if (typeof ip !== "string" || ip.length === 0) {
    return true; // Block unknown callers
  }

  const key = `${RATE_LIMIT_KEY_PREFIX}${ip}`;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = nowSeconds - RATE_LIMIT_WINDOW_SECONDS;

  const raw = await kv.get(key, "text");
  let record: RateLimitRecord = { timestamps: [] };

  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "timestamps" in parsed &&
        Array.isArray((parsed as RateLimitRecord).timestamps)
      ) {
        record = parsed as RateLimitRecord;
      }
    } catch {
      // Corrupted record — treat as empty, will be overwritten
      record = { timestamps: [] };
    }
  }

  // Filter to only timestamps within the current window (fixed upper bound: RATE_LIMIT_MAX_REQUESTS + slack)
  const recentTimestamps: number[] = [];
  const maxIterations = Math.min(record.timestamps.length, RATE_LIMIT_MAX_REQUESTS + 10);
  for (let i = 0; i < maxIterations; i++) {
    const ts = record.timestamps[i];
    if (typeof ts === "number" && ts > windowStart) {
      recentTimestamps.push(ts);
    }
  }

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Record this request
  recentTimestamps.push(nowSeconds);
  const updated: RateLimitRecord = { timestamps: recentTimestamps };
  await kv.put(key, JSON.stringify(updated), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });

  return false;
}
