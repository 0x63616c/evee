import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { threads } from '../db/schema.js';
import { withUserScope } from '../db/with-user-scope.js';
import { protectedRouter } from '../lib/protected-router.js';

export const threadsRouter = protectedRouter().get('/', async (c) => {
  const parsed = z.string().min(1).safeParse(c.req.query('channelId'));
  if (!parsed.success) {
    return c.json({ error: 'channelId query param is required' }, 400);
  }

  const userId = c.get('user').id;
  const rows = await withUserScope(userId, (db) =>
    db
      .select()
      .from(threads)
      .where(eq(threads.channelId, parsed.data))
      .orderBy(desc(threads.updatedAt)),
  );

  return c.json({ threads: rows });
});
