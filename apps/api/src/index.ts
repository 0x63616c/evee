import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './env.js';
import { appRouter } from './routers/index.js';
import { createContext } from './trpc.js';

const app = new Hono();

app.use(logger());
app.use(cors());

app.get('/healthz', (c) => c.text('ok'));

app.use('/trpc/*', trpcServer({ router: appRouter, createContext }));

export default { port: env.PORT, fetch: app.fetch };
