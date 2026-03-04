# Database Schema

<!-- SCOPE: Table definitions, columns, constraints, relationships. No query patterns. -->

## Engine

PostgreSQL 16. ORM: Drizzle ORM. Migrations: `drizzle-kit` in `apps/api/drizzle/`.

## ID Convention

All primary keys use **TypeID** — prefixed, time-sortable, URL-safe strings.

| Table | Prefix | Example |
|-------|--------|---------|
| users | `user_` | `user_01j8...` |
| channels | `ch_` | `ch_01j8...` |
| threads | `th_` | `th_01j8...` |
| messages | `msg_` | `msg_01j8...` |

## Tables

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `user_` |
| email | varchar(255) | NOT NULL, UNIQUE | |
| password_hash | text | NOT NULL | argon2 via Bun.password |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

### channels

Pre-defined categories seeded on first run. Not user-created.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `ch_` |
| slug | text | NOT NULL, UNIQUE | URL-safe identifier (e.g. `general`) |
| name | text | NOT NULL | Display name |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

### threads

One thread = one conversation. Created when a user sends the first message via `/api/chat`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `th_` |
| channel_id | varchar(255) | NOT NULL, FK -> channels.id | |
| name | text | NOT NULL | Auto-set from first 50 chars of user message |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Bumped on each new message |

### messages

Stores all turns: user input, assistant output, and tool interactions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `msg_` |
| thread_id | varchar(255) | NOT NULL, FK -> threads.id | |
| role | text | NOT NULL | `user` \| `assistant` \| `tool` |
| content | text | NOT NULL | Text or JSON (tool calls) |
| tool_call_id | text | nullable | Links tool result to its call |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

## Relationships

```
channels (1) --< threads (N)
threads (1) --< messages (N)
```

Note: threads have no user_id FK — this is a single-user app.

## Seed Data

Channels are seeded via `apps/api/src/db/seed.ts`. Default channels:

| slug | name |
|------|------|
| general | General |
| code | Code |
| research | Research |

## Maintenance

**Update when:** Adding tables, changing column types, adding indexes, modifying relationships.
**Verify:** Schema matches `apps/api/src/db/schema.ts`, migrations exist in `apps/api/drizzle/`.
