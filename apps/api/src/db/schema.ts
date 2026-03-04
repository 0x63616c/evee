import { sql } from 'drizzle-orm';
import {
  type PgColumnBuilderBase,
  type PgTableExtraConfigValue,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Re-export pgTable as publicTable — forces conscious opt-out of RLS
export const publicTable = pgTable;

export const users = publicTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const channels = publicTable('channels', {
  id: varchar('id', { length: 255 }).primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const isolationPolicy = (name: string) =>
  pgPolicy(`${name}_user_isolation`, {
    for: 'all',
    using: sql`user_id = current_setting('app.current_user_id')`,
    withCheck: sql`user_id = current_setting('app.current_user_id')`,
  });

/** User-scoped table: automatic RLS + userId column + isolation policy. */
export function userTable<T extends Record<string, PgColumnBuilderBase>>(
  name: string,
  columns: T,
) {
  return pgTable(
    name,
    {
      ...columns,
      userId: varchar('user_id', { length: 255 })
        .notNull()
        .references(() => users.id)
        .default(sql`current_setting('app.current_user_id')`),
    },
    () => [isolationPolicy(name)] as PgTableExtraConfigValue[],
  ).enableRLS();
}

export const threads = userTable('threads', {
  id: varchar('id', { length: 255 }).primaryKey(),
  channelId: varchar('channel_id', { length: 255 })
    .notNull()
    .references(() => channels.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = userTable('messages', {
  id: varchar('id', { length: 255 }).primaryKey(),
  threadId: varchar('thread_id', { length: 255 })
    .notNull()
    .references(() => threads.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  toolCallId: text('tool_call_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
