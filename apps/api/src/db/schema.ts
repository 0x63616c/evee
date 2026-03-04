import { sql } from 'drizzle-orm';
import {
  pgPolicy,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// ── Table helpers ───────────────────────────────────────────────────────
// publicTable  = shared data, no RLS (channels, users)
// userIdColumn + isolationPolicy + .enableRLS() = user-scoped data
//
// Lefthook pre-commit guard ensures every pgTable call in this file
// either uses publicTable or has .enableRLS().

/** Alias for pgTable — signals "this table is intentionally public". */
export const publicTable = pgTable;

/** Column: user_id FK with DEFAULT from the RLS session variable. */
const userIdColumn = () =>
  varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id)
    .default(sql`current_setting('app.current_user_id')`);

/** RLS policy: rows filtered by current_setting('app.current_user_id'). */
const isolationPolicy = (name: string) =>
  pgPolicy(`${name}_user_isolation`, {
    for: 'all',
    using: sql`user_id = current_setting('app.current_user_id')`,
    withCheck: sql`user_id = current_setting('app.current_user_id')`,
  });

// ── Public tables ───────────────────────────────────────────────────────

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

// ── User-scoped tables (RLS-protected) ──────────────────────────────────

export const threads = pgTable(
  'threads',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    channelId: varchar('channel_id', { length: 255 })
      .notNull()
      .references(() => channels.id),
    name: text('name').notNull(),
    userId: userIdColumn(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => [isolationPolicy('threads')],
).enableRLS();

export const messages = pgTable(
  'messages',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    threadId: varchar('thread_id', { length: 255 })
      .notNull()
      .references(() => threads.id),
    role: text('role').notNull(),
    content: text('content').notNull(),
    userId: userIdColumn(),
    toolCallId: text('tool_call_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => [isolationPolicy('messages')],
).enableRLS();
