import { sql } from 'drizzle-orm';
import { db } from './index.js';

/**
 * Execute a function within a transaction scoped to a specific user.
 * Sets the Postgres session variable `app.current_user_id` so RLS
 * policies filter rows to only those belonging to this user.
 */
export async function withUserScope<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx as unknown as typeof db);
  });
}
