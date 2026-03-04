# Architecture

<!-- SCOPE: System structure, component responsibilities, and data flow. No implementation details. -->

## Overview

Evee is a personal AI assistant web app. Single-user, monorepo with two apps: a Hono API server and a React web UI. The user chats via the web UI; the API handles auth, data persistence, and LLM streaming. Conversations are organised as Channels → Threads → Messages (Discord-like).

```
Browser (React + Vite)
    |
    +-- Auth (login/register) → POST /api/auth/*
    +-- Chat UI (channels/threads) → Hono RPC hc client
    +-- Streaming AI responses → POST /api/chat (SSE)
    |
    v
Hono API (apps/api — port 4201)
    |
    +-- authMiddleware (JWT via jose)
    +-- protectedRouter() factory — all routes auto-protected
    +-- /api/chat → Vercel AI SDK streamText → OpenRouter → DeepSeek V3
    +-- tools: search_web, fetch_url
    |
    v
PostgreSQL 16 (Docker — port 4210)
    Drizzle ORM
    Tables: users, channels, threads, messages
```

## Components

### apps/web (React + Vite — port 4200)

| Module | Path | Purpose |
|--------|------|---------|
| Routing | `src/routes/` | TanStack Router (file-based) |
| Auth pages | `_authenticated/` route group | Login/signup, redirect if unauthenticated |
| Chat UI | `_authenticated/` | Channel list, thread view, message stream |
| API client | `src/lib/api.ts` | Hono `hc` typed RPC client |
| State | `src/stores/` | Zustand stores (auth token, theme) |
| Components | `src/components/` | shadcn/ui + assistant-ui chat components |

### apps/api (Hono — port 4201)

| Module | Path | Purpose |
|--------|------|---------|
| Entry | `src/index.ts` | Hono app, CORS, logger, route mount |
| Auth | `src/routers/auth.ts` | register, login (public) |
| Channels | `src/routers/channels.ts` | list channels, get threads (protected) |
| Threads | `src/routers/threads.ts` | create thread, list messages (protected) |
| Chat | `src/routers/chat.ts` | POST /api/chat — AI SDK streamText (protected) |
| Tools | `src/tools/` | search_web, fetch_url (SSRF-protected) |
| Auth middleware | `src/middleware/auth.ts` | JWT verify via jose |
| protectedRouter | `src/lib/router.ts` | `new Hono().use('*', authMiddleware)` factory |
| DB | `src/db/` | Drizzle ORM client + schema |
| Env | `src/env.ts` | Zod-validated environment variables |

## Auth Pattern

```
protectedRouter() → new Hono().use('*', authMiddleware)
    └── every route added inherits JWT protection
    └── opting out requires explicit effort (use plain Hono())
```

JWT tokens are HS256, 7-day expiry. `Bun.password.hash/verify` (argon2) for passwords.

## Data Model

```
channels (seeded, not user-created)
    └── threads (one per conversation start)
            └── messages (user | assistant | tool)
```

| Entity | Key Fields |
|--------|-----------|
| channels | id, name, description, created_at |
| threads | id, channel_id, user_id, name, created_at |
| messages | id, thread_id, role (user/assistant/tool), content, created_at |

## AI/LLM Flow

```
POST /api/chat
    ├── Authenticate (JWT)
    ├── Load thread history from DB (capped at 100 messages)
    ├── Load system prompt from disk (live-editable)
    ├── Inject current date/time
    ├── streamText(model, messages, tools, maxSteps: 10)
    │       ├── Tool call → execute → append result → loop
    │       └── Final text → stream SSE to client
    └── Persist messages to DB
```

Tools available to the LLM:

| Tool | Purpose | Protection |
|------|---------|-----------|
| search_web | DuckDuckGo web search | Rate-limited |
| fetch_url | Fetch and extract page content | SSRF block list |

## Local Dev Orchestration (Tilt)

```
tilt up
    ├── postgres (Docker, port 4210)
    ├── db-migrate (drizzle-kit migrate, auto on schema change)
    ├── api (bun run dev, port 4201, health: GET /healthz)
    └── web (bun run dev, port 4200)
```

## Key Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Thread history | 100 messages | Token overflow prevention |
| Tool iterations | 10 (maxSteps) | Prevent infinite loops |
| System prompt | Loaded from disk each call | Live-editable without restart |
| Channels | Pre-defined (seeded) | Single-user, curated topics |
| Auth | Single user, JWT | Personal tool for Cal |

## Maintenance

**Update when:** Adding new routes, changing DB schema, modifying AI flow, adding tools.
**Verify:** Component paths exist in codebase, port numbers match Tilt/docker-compose.
