import { text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { publicTable, userTable } from './table-helpers.js';

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
