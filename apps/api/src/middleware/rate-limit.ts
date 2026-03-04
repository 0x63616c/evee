import type { MiddlewareHandler } from 'hono';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

type RequestRecord = {
  timestamps: number[];
};

/**
 * In-memory sliding window rate limiter keyed by client IP.
 * Suitable for single-instance deployments (no Redis needed).
 */
export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
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

    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown';

    const now = Date.now();
    const record = store.get(ip) ?? { timestamps: [] };

    // Remove timestamps outside the current window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= max) {
      return c.json({ error: message }, 429);
    }

    record.timestamps.push(now);
    store.set(ip, record);

    await next();
  };
}
