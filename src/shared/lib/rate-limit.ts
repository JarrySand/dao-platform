interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically (every 60s)
const CLEANUP_INTERVAL_MS = 60_000;
const MAX_ENTRIES = 10_000;
let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Enforce max size — evict oldest entries if still over limit
  if (rateLimitStore.size > MAX_ENTRIES) {
    const excess = rateLimitStore.size - MAX_ENTRIES;
    const iterator = rateLimitStore.keys();
    for (let i = 0; i < excess; i++) {
      const key = iterator.next().value;
      if (key) rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request from the given IP is within the rate limit.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  cleanupStaleEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
