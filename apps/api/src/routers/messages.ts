import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { messages } from '../db/schema.js';
import { protectedRouter } from '../lib/protected-router.js';

export const messagesRouter = protectedRouter().get('/', async (c) => {
  const threadId = c.req.query('threadId');
  const parsed = z.string().min(1).safeParse(threadId);
  if (!parsed.success) {
    return c.json({ error: 'threadId query param is required' }, 400);
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, parsed.data))
    .orderBy(asc(messages.createdAt));

  return c.json({ messages: rows });
});
