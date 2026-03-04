# Backend Skeleton Design

Date: 2026-02-28

## Overview

SaaS platform backend for The Workflow Engine — the API and database powering the web dashboard. Covers auth, user management, and the dev orchestration to run everything locally. The workflow execution engine itself is out of scope.

## Stack

- **API:** Bun + tRPC (standalone HTTP adapter)
- **Database:** PostgreSQL 16 + Drizzle ORM
- **ID system:** TypeID (prefixed, time-sortable IDs stored as full strings)
- **Auth:** Custom minimal — email/password, JWT sessions
- **Dev orchestration:** Tilt + docker-compose (no Kubernetes)

## API Service (`apps/api`)

### Entry point

`src/index.ts` — starts a standalone tRPC HTTP server on port `4201`.

### tRPC setup (`src/trpc.ts`)

- Context created per-request: parses `Authorization: Bearer <token>` header, resolves user from DB if valid.
- `publicProcedure` — no auth required.
- `protectedProcedure` — middleware that throws `UNAUTHORIZED` if no user in context.

### Routers

**`auth` router** (public):

- `auth.register` — mutation. Takes `{ email, password }`. Hashes password with `Bun.password.hash()` (argon2). Inserts user. Returns JWT.
- `auth.login` — mutation. Takes `{ email, password }`. Verifies with `Bun.password.verify()`. Returns JWT.

**`user` router** (protected):

- `user.me` — query. Requires valid JWT. Returns the current user's profile.

### Dependencies

- `@trpc/server` — tRPC core
- `zod` — input validation (already in web's node_modules)
- `jose` — JWT signing/verification
- `drizzle-orm` + `postgres` — DB access
- `typeid-js` — TypeID generation

### Password hashing

Uses Bun's built-in `Bun.password.hash()` and `Bun.password.verify()` — argon2 by default, no extra dependency.

### JWT

Uses `jose` library. Tokens contain `{ sub: userId }` and expire after a configurable duration.

## Database

### Engine

PostgreSQL 16, running in Docker via docker-compose.

### ORM

Drizzle with `postgres` driver (`drizzle-orm/postgres-js`).

### ID system

TypeID — prefixed, time-sortable IDs. Stored as the full prefixed string in the database (e.g. `user_2x4y6z8a0b1c2d3e4f5g6h7j8k`).

- Prefix per entity type: `user`, and more as we add tables.
- UUIDv7 under the hood — monotonically increasing, B-tree friendly.
- Full string stored in `varchar(255)` column — what you see in the API = what you see in the DB.

### Schema

**`users` table:**

| Column          | Type           | Notes                          |
| --------------- | -------------- | ------------------------------ |
| `id`            | `varchar(255)` | PK, TypeID with `user` prefix  |
| `email`         | `varchar(255)` | unique, not null                |
| `password_hash` | `text`         | not null                       |
| `created_at`    | `timestamp`    | default `now()`                |

### Migrations

`drizzle-kit` generates SQL migrations from schema diffs. Stored in `apps/api/drizzle/`.

## Type Sharing (API → Web)

- Export the `AppRouter` type from `apps/api/src/routers/index.ts`.
- Import it in `apps/web` via workspace reference or TypeScript path.
- tRPC client in the frontend gets full end-to-end type inference with zero codegen.

## Dev Orchestration

### Ports

| Service          | Port   |
| ---------------- | ------ |
| web (Vite dev)   | `4200` |
| api (tRPC)       | `4201` |
| PostgreSQL       | `4210` |
| Tilt dashboard   | `4220` |

All ports in the `4200–4300` range to avoid conflicts.

### `docker-compose.yml` (repo root)

Runs stateful services:

- **PostgreSQL 16** container with named volume for data persistence, exposed on port `4210`.

### `Tiltfile` (repo root)

Orchestrates everything without Kubernetes:

- `docker_compose('./docker-compose.yml')` — picks up Postgres.
- `local_resource('api')` — runs `bun run dev` in `apps/api/`, file watching, auto-restart.
- `local_resource('web')` — runs `bun run dev` in `apps/web/`, file watching.
- `local_resource('db-migrate')` — runs Drizzle migrations on startup, depends on Postgres.
- `local_resource('db-reset')` — manual trigger only. Drops and recreates the database, then runs migrations. Activated via Tilt dashboard button or `tilt trigger db-reset`.

### Dev workflow

```sh
tilt up        # starts postgres, api, web, runs migrations
tilt down      # stops everything
```

Tilt dashboard at `localhost:4220` shows all services, logs, and manual action buttons.

## Directory Structure

```
apps/
  api/
    src/
      db/
        schema.ts          # Drizzle schema (users table)
        index.ts           # DB connection
      routers/
        auth.ts            # register + login procedures
        user.ts            # me query (protected)
        index.ts           # root appRouter (merges sub-routers)
      trpc.ts              # tRPC init, context, middleware
      index.ts             # server entry point
    drizzle/               # generated SQL migrations
    drizzle.config.ts
    tsconfig.json
    package.json
  web/                     # existing frontend (imports AppRouter type)
docker-compose.yml
Tiltfile
```
