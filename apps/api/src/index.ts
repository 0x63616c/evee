import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './env.js';
import { apiRouter } from './routers/index.js';
import { chatRouter } from './routes/chat.js';

export const app = new Hono()
  .use(logger())
  .use(cors())
  .get('/healthz', (c) => c.text('ok'))
  .route('/api', apiRouter)
  .route('/api/chat', chatRouter);

export type AppType = typeof app;

export default { port: env.PORT, fetch: app.fetch };
