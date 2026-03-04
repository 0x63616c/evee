# API Specification

<!-- SCOPE: API contracts (routes, inputs, outputs, auth requirements). No implementation details. -->

## Base URL

`http://localhost:4201` (development)

## Authentication

All protected routes require `Authorization: Bearer <jwt>` header. JWTs are HS256, 7-day expiry, issued by auth endpoints.

## Routes

### Auth (public)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| POST | `/api/auth/register` | `{ email, password }` | `{ token }` | Creates user, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | `{ token }` | Verifies credentials, returns JWT |

**Input constraints:**
- `email`: valid email format
- `password`: minimum 8 characters

**Error codes:**
- `409` — email already registered (register)
- `401` — invalid credentials (login)

---

### Chat (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| POST | `/api/chat` | `{ threadId, message }` | SSE stream | Vercel AI SDK data stream format |

**Stream format:** Vercel AI SDK protocol (compatible with `useChat` hook).

**Behaviour:**
- Loads thread history from DB (up to 100 messages)
- Appends user message to DB
- Calls LLM via streamText (DeepSeek V3 via OpenRouter)
- Executes tool calls as they arrive
- Streams final text response
- Persists assistant message to DB

---

### Channels (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/channels` | — | `{ channels: Channel[] }` | Returns all seeded channels |
| GET | `/api/channels/:id` | — | `{ channel: Channel }` | Single channel by ID |

**Channel shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `ch_` prefix |
| name | string | Display name |
| description | string | Short description |
| createdAt | string | ISO-8601 |

---

### Threads (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/channels/:channelId/threads` | — | `{ threads: Thread[] }` | User's threads in channel |
| POST | `/api/channels/:channelId/threads` | `{ name? }` | `{ thread: Thread }` | Create new thread |
| GET | `/api/threads/:id` | — | `{ thread: Thread }` | Single thread |
| GET | `/api/threads/:id/messages` | — | `{ messages: Message[] }` | Thread message history |

**Thread shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `thr_` prefix |
| channelId | string | Parent channel |
| userId | string | Owner |
| name | string | Auto-set from first message |
| createdAt | string | ISO-8601 |

**Message shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `msg_` prefix |
| threadId | string | Parent thread |
| role | enum | `user` \| `assistant` \| `tool` |
| content | string | Message text or tool JSON |
| createdAt | string | ISO-8601 |

---

### System

| Method | Path | Auth | Output |
|--------|------|------|--------|
| GET | `/healthz` | None | `"ok"` (plain text) |

## RPC Client (Hono hc)

The frontend uses the Hono `hc` typed client. The API exports `AppType`:

```
import type { AppType } from '@evee/api'
const client = hc<AppType>('http://localhost:4201')
```

All endpoint types are inferred — no separate schema file needed.

## Maintenance

**Update when:** Adding routes, changing input/output shapes, modifying auth requirements.
**Verify:** Route paths match `apps/api/src/routers/` files, shapes match Drizzle schema.
