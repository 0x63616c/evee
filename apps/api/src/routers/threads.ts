import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { threads } from '../db/schema.js';
import { protectedRouter } from '../lib/protected-router.js';

export const threadsRouter = protectedRouter().get('/', async (c) => {
  const channelId = c.req.query('channelId');
  const parsed = z.string().min(1).safeParse(channelId);
  if (!parsed.success) {
    return c.json({ error: 'channelId query param is required' }, 400);
  }

  const rows = await db
    .select()
    .from(threads)
    .where(eq(threads.channelId, parsed.data))
    .orderBy(desc(threads.updatedAt));

  return c.json({ threads: rows });
});
