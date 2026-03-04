import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './env.js';
import { metricsMiddleware, registry } from './middleware/metrics.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { apiRouter } from './routers/index.js';
import { chatRouter } from './routes/chat.js';

// General rate limiter for all API endpoints (100 req/min per IP)
const globalLimiter = rateLimiter({
  windowMs: 60_000,
  max: 100,
});

export const app = new Hono()
  .use(logger())
  .use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? 'https://evee.worldwidewebb.co'
          : 'http://localhost:4200',
      exposeHeaders: ['X-Thread-Id'],
    }),
  )
  .use(metricsMiddleware())
  .get('/healthz', (c) => c.text('ok'))
  .get('/metrics', async (c) => {
    const metrics = await registry.metrics();
    return c.text(metrics, 200, {
      'Content-Type': registry.contentType,
    });
  })
  .use('/api/*', globalLimiter)
  .route('/api', apiRouter)
  .route('/api/chat', chatRouter);

export type AppType = typeof app;

export default { port: env.PORT, fetch: app.fetch };
