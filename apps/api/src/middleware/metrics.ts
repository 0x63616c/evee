import type { MiddlewareHandler } from 'hono';
import { Counter, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

// Business metrics
export const messagesTotal = new Counter({
  name: 'evee_messages_total',
  help: 'Total messages processed',
  labelNames: ['role'] as const,
  registers: [registry],
});

export const threadsCreatedTotal = new Counter({
  name: 'evee_threads_created_total',
  help: 'Total threads created',
  registers: [registry],
});

export const toolCallsTotal = new Counter({
  name: 'evee_tool_calls_total',
  help: 'Total tool calls made',
  labelNames: ['tool_name'] as const,
  registers: [registry],
});

export const aiResponseDuration = new Histogram({
  name: 'evee_ai_response_duration_seconds',
  help: 'AI response duration in seconds',
  buckets: [0.5, 1, 2.5, 5, 10, 15, 30, 60],
  registers: [registry],
});

export function metricsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const duration = (performance.now() - start) / 1000;

    const route = c.req.path;
    const method = c.req.method;
    const status = String(c.res.status);

    httpRequestsTotal.inc({ method, route, status });
    httpRequestDuration.observe({ method, route, status }, duration);
  };
}
