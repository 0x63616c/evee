# API Specification

<!-- SCOPE: API contracts (routes, inputs, outputs, auth requirements). No implementation details. -->

## Base URL

`http://localhost:4201` (development)
`https://api.worldwidewebb.co` (production)

## Authentication

All protected routes require `Authorization: Bearer <jwt>` header. JWTs are HS256, 7-day expiry, issued by auth endpoints.

## Routes

### Auth (public)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| POST | `/api/auth/signup` | `{ email, password }` | `{ token }` | Creates user, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | `{ token }` | Verifies credentials, returns JWT |

**Input constraints:**
- `email`: valid email format
- `password`: minimum 8 characters

**Error codes:**
- `409` — email already registered (signup)
- `401` — invalid credentials (login)

---

### Chat (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| POST | `/api/chat` | `{ channelId, threadId?, message }` | SSE stream | Vercel AI SDK data stream format |

**Response headers:**
- `X-Thread-Id` — the thread ID (new or existing), used by the client to maintain thread continuity

**Behaviour:**
- Creates new thread if no `threadId` provided (auto-named from first 50 chars of message)
- Saves user message to DB
- Loads thread history (up to 100 messages)
- Loads system prompt from disk (live-editable)
- Calls LLM via streamText (DeepSeek V3 via OpenRouter)
- Executes tool calls as they arrive (max 10 steps)
- Streams final text response
- Persists assistant and tool messages to DB

---

### Channels (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/channels` | — | `{ channels: Channel[] }` | Returns all seeded channels |

**Channel shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `ch_` prefix |
| slug | string | URL-safe identifier (e.g. `general`) |
| name | string | Display name |
| createdAt | string | ISO-8601 |

---

### Threads (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/threads?channelId=x` | query: `channelId` | `{ threads: Thread[] }` | Threads for a channel, sorted by updatedAt desc |

**Thread shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `th_` prefix |
| channelId | string | Parent channel |
| name | string | Auto-set from first message |
| createdAt | string | ISO-8601 |
| updatedAt | string | ISO-8601 |

---

### Messages (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/messages?threadId=x` | query: `threadId` | `{ messages: Message[] }` | Messages for a thread, sorted by createdAt asc |

**Message shape:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | TypeID with `msg_` prefix |
| threadId | string | Parent thread |
| role | enum | `user` \| `assistant` \| `tool` |
| content | string | Message text or tool JSON |
| toolCallId | string? | Tool call ID (for tool messages) |
| createdAt | string | ISO-8601 |

---

### User (protected)

| Method | Path | Input | Output | Notes |
|--------|------|-------|--------|-------|
| GET | `/api/user/me` | — | `{ id, email, createdAt }` | Current authenticated user |

---

### System

| Method | Path | Auth | Output |
|--------|------|------|--------|
| GET | `/healthz` | None | `"ok"` (plain text) |

## RPC Client (Hono hc)

The frontend uses the Hono `hc` typed client. The API exports `AppType`:

```
import type { AppType } from '../../../api/src/index.ts'
const client = hc<AppType>('http://localhost:4201')
```

All endpoint types are inferred — no separate schema file needed.

## Maintenance

**Update when:** Adding routes, changing input/output shapes, modifying auth requirements.
**Verify:** Route paths match `apps/api/src/routers/` and `apps/api/src/routes/` files, shapes match Drizzle schema.
