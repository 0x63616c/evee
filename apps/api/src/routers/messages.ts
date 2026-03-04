import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { messages } from '../db/schema.js';
import { withUserScope } from '../db/with-user-scope.js';
import { protectedRouter } from '../lib/protected-router.js';

export const messagesRouter = protectedRouter().get('/', async (c) => {
  const parsed = z.string().min(1).safeParse(c.req.query('threadId'));
  if (!parsed.success) {
    return c.json({ error: 'threadId query param is required' }, 400);
  }

  const userId = c.get('user').id;
  const rows = await withUserScope(userId, (db) =>
    db
      .select()
      .from(messages)
      .where(eq(messages.threadId, parsed.data))
      .orderBy(asc(messages.createdAt)),
  );

  return c.json({ messages: rows });
});
