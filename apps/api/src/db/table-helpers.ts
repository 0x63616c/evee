import { sql } from 'drizzle-orm';
import {
  type PgColumnBuilderBase,
  type PgTableExtraConfigValue,
  pgPolicy,
  pgTable,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './schema.js';

// Re-export pgTable as publicTable — forces conscious opt-out of RLS
export { pgTable as publicTable } from 'drizzle-orm/pg-core';

const userIdColumn = () =>
  varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id)
    .default(sql`current_setting('app.current_user_id')`);

const isolationPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_user_isolation`, {
    for: 'all',
    using: sql`user_id = current_setting('app.current_user_id')`,
    withCheck: sql`user_id = current_setting('app.current_user_id')`,
  });

/**
 * User-scoped table with automatic RLS + userId column.
 *
 * Creates a table with:
 * 1. RLS enabled via .enableRLS()
 * 2. userId column with FK to users + DEFAULT from session variable
 * 3. Policy: user can only see/modify their own rows
 */
export function userTable<T extends Record<string, PgColumnBuilderBase>>(
  name: string,
  columns: T,
) {
  return pgTable(
    name,
    { ...columns, userId: userIdColumn() },
    () => [isolationPolicy(name)] as PgTableExtraConfigValue[],
  ).enableRLS();
}
