export interface IRateLimitPolicy {
  limit: number;
  windowMs: number;
}

export interface IRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface IRateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, IRateLimitEntry>();

function isRateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "true";
}

function pruneExpiredEntries(now: number): void {
  if (store.size < 5000) {
    return;
  }
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  policy: IRateLimitPolicy,
): IRateLimitResult {
  if (isRateLimitDisabled()) {
    return { allowed: true, remaining: policy.limit, retryAfterMs: 0 };
  }

  const now = Date.now();
  pruneExpiredEntries(now);

  let entry = store.get(key);
  if (!entry || now - entry.windowStart >= policy.windowMs) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > policy.limit) {
    const retryAfterMs = policy.windowMs - (now - entry.windowStart);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, policy.limit - entry.count),
    retryAfterMs: 0,
  };
}
