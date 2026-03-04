import { asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { channels } from '../db/schema.js';
import { protectedRouter } from '../lib/protected-router.js';

export const channelsRouter = protectedRouter().get('/', async (c) => {
  const rows = await db
    .select()
    .from(channels)
    .orderBy(asc(channels.createdAt));

  return c.json({ channels: rows });
});
