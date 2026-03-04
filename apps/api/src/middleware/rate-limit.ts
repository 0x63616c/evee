import type { Context, MiddlewareHandler } from 'hono';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
  /** Optional function to produce a custom rate limit key from the request.
   *  When provided, this key is used INSTEAD of the client IP. To combine
   *  IP with another value (e.g. email), include the IP in the returned string. */
  keyFn?: (c: Context) => string | undefined;
};

type RequestRecord = {
  timestamps: number[];
};

/**
 * Extract the real client IP from a request behind kamal-proxy.
 *
 * kamal-proxy (with forward_headers disabled — the default when ssl: true)
 * strips any client-supplied X-Forwarded-For and writes a fresh header
 * containing exactly the real TCP peer IP via Go's SetXForwarded().
 *
 * We intentionally do NOT fall back to X-Real-IP because kamal-proxy does
 * not set it, so it would only ever contain a client-spoofed value.
 */
function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/**
 * In-memory sliding window rate limiter keyed by client IP (or custom key).
 * Suitable for single-instance deployments (no Redis needed).
 */
export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyFn,
  } = options;
  const store = new Map<string, RequestRecord>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Allow the process to exit without waiting for the interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return async (c, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = keyFn?.(c) ?? getClientIp(c);

    const now = Date.now();
    const record = store.get(key) ?? { timestamps: [] };

    // Remove timestamps outside the current window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= max) {
      return c.json({ error: message }, 429);
    }

    record.timestamps.push(now);
    store.set(key, record);

    await next();
  };
}
