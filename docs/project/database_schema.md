# Database Schema

<!-- SCOPE: Table definitions, columns, constraints, relationships. No query patterns. -->

## Engine

PostgreSQL 16. ORM: Drizzle ORM. Migrations: `drizzle-kit` in `apps/api/src/db/`.

## ID Convention

All primary keys use **TypeID** — prefixed, time-sortable, URL-safe strings.

| Table | Prefix | Example |
|-------|--------|---------|
| users | `user_` | `user_01j8...` |
| channels | `ch_` | `ch_01j8...` |
| threads | `thr_` | `thr_01j8...` |
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

Pre-defined categories. Not user-created.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `ch_` |
| name | varchar(100) | NOT NULL, UNIQUE | e.g. "general", "code" |
| description | text | | Short description |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

### threads

One thread = one conversation. Created when a user sends the first message.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `thr_` |
| channel_id | varchar(255) | NOT NULL, FK → channels.id | |
| user_id | varchar(255) | NOT NULL, FK → users.id | |
| name | varchar(255) | | Auto-set from first user message |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

### messages

Stores all turns: user input, assistant output, and tool interactions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | varchar(255) | PK | TypeID `msg_` |
| thread_id | varchar(255) | NOT NULL, FK → threads.id | |
| role | varchar(20) | NOT NULL | `user` \| `assistant` \| `tool` |
| content | text | NOT NULL | Text or JSON (tool calls) |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | |

## Relationships

```
users (1) ──< threads (N)
channels (1) ──< threads (N)
threads (1) ──< messages (N)
```

## Indexes (planned)

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| threads | channel_id, user_id | composite | Filter user threads per channel |
| messages | thread_id, created_at | composite | Paginate thread history |

## Seed Data

Channels are seeded on first run. Initial channels:

| name | description |
|------|-------------|
| general | General conversation |
| code | Code help and review |
| research | Web search and research |

## Maintenance

**Update when:** Adding tables, changing column types, adding indexes, modifying relationships.
**Verify:** Schema matches `apps/api/src/db/schema.ts`, migrations exist in `apps/api/drizzle/`.
