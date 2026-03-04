# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Evee is a personal AI assistant web app. TypeScript/Bun monorepo with a Hono API and React frontend.

## Tech Stack (apps/web)

- **Bundler / Dev server**: Vite 7
- **UI**: React 19, TypeScript 5.9
- **Routing**: TanStack Router (file-based, Vite plugin)
- **Server state**: TanStack Query
- **Client state**: Zustand
- **Styling**: Tailwind CSS v4, shadcn/ui (style: new-york, base: neutral)
- **Chat UI**: assistant-ui
- **Icons**: `lucide-react`
- **Fonts**: Geist (`geist` package)
- **Testing**: Vitest
- **Linting / formatting**: Biome

## Tech Stack (apps/api)

- **Runtime**: Bun
- **Framework**: Hono 4 with `hc` typed RPC client (no tRPC)
- **Auth pattern**: `protectedRouter()` factory — `new Hono().use('*', authMiddleware)`. Every route added to a protected router gets JWT auth automatically. New endpoints cannot accidentally be unprotected.
- **AI**: Vercel AI SDK + `@openrouter/ai-sdk-provider` (DeepSeek V3 default via OpenRouter)
- **Chat endpoint**: `POST /api/chat` — plain Hono route, AI SDK `streamText`, NOT tRPC
- **Database**: PostgreSQL 16 via Drizzle ORM (schema: `src/db/schema.ts`)
- **ID system**: TypeID — prefixed, time-sortable IDs (e.g. `user_xxx`). Stored as full string in varchar columns.
- **Auth**: JWT via `jose`, password hashing via `Bun.password` (argon2)
- **Validation**: Zod
- **Env config**: Validated via Zod in `src/env.ts`. Never read `.env` directly — use `env.ts` exports.

## Architecture

### Two Router Families

The API has two distinct routing patterns mounted at `/api`:

- **RPC routers** (`src/routers/`) — standard Hono RPC routes consumed by the typed `hc` client on the frontend. All CRUD (channels, threads, messages, user). These produce the `AppType` used for end-to-end type safety.
- **Chat route** (`src/routes/chat.ts`) — plain Hono route for AI streaming. Uses Vercel AI SDK `streamText`, returns SSE via `toUIMessageStreamResponse()`. Mounted separately because streaming responses don't fit the RPC pattern.

Both use `protectedRouter()` except `authRouter` (login/signup are public).

### Cross-Package Type Import

The web app imports `AppType` directly from the API source (`../../../api/src/index.ts`) — a relative TypeScript path, not a workspace package. This gives full end-to-end type safety with zero codegen, but breaks if directory structure changes.

### Chat Streaming Flow

1. Frontend sends `{ channelId, threadId?, message }` (just the latest message, not the full history).
2. API creates thread if new, saves user message to DB, loads last 100 messages as history.
3. System prompt read from `prompts/SYSTEM.md` on every call (live-editable without restart).
4. `streamText` with tools, `onStepFinish` persists tool calls, `onFinish` persists assistant text.
5. Response includes `X-Thread-Id` header — the frontend reads this to learn the server-assigned thread ID for new conversations.

### Data Model

Channels (pre-defined, seeded) → Threads (one per conversation) → Messages (user | assistant | tool)

All IDs use TypeID (prefixed, time-sortable strings: `user_xxx`, `th_xxx`, `msg_xxx`).

## Ports

| Service    | Port |
| ---------- | ---- |
| web (Vite) | 4200 |
| api (Hono) | 4201 |
| PostgreSQL | 4210 |

## Directory Structure

```
apps/api/     # Hono API server
apps/web/     # React + Vite frontend
docs/         # Project documentation
prompts/      # System prompt (loaded from disk each LLM call)
infra/        # Infrastructure config
libs/         # Shared libraries (empty — future use)
sdks/         # Client SDKs (empty — future use)
tools/        # Internal tooling (empty — future use)
```

## Local Development (Tilt)

```bash
tilt up                  # Start Postgres, run migrations, start API (4201) + web (4200)
tilt down                # Stop all services
tilt trigger db-reset    # Wipe DB and re-migrate
```

Manual:

```bash
docker compose up -d                      # Start Postgres on port 4210
cd apps/api && bun run db:migrate         # Apply pending migrations
cd apps/api && bun run dev                # API on port 4201
cd apps/web && bun run dev                # Web on port 4200
```

## Environment Variables

Copy `.env.example` to `.env` at the repo root:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `SIGNUP_ENABLED` | `"true"` or `"false"` — disables registration (default: `true`) |

All scripts in `apps/api/package.json` read from the root `.env` via `--env-file=../../.env`.

## Deployment (Kamal)

Kamal deploys via SSH + Docker to the Hetzner VPS. Config lives in `config/`.

```bash
kamal setup -c config/deploy.api.yml    # First-time: install proxy, boot postgres, deploy API
kamal setup -c config/deploy.web.yml    # First-time: deploy web (uses existing proxy)
kamal deploy -c config/deploy.api.yml   # Subsequent deploys (API)
kamal deploy -c config/deploy.web.yml   # Subsequent deploys (Web)
kamal app logs -c config/deploy.api.yml # View API logs
kamal rollback -c config/deploy.api.yml # Rollback to previous version
```

CI auto-deploys on push to main after lint + tests pass.

## Common Commands (apps/api)

```bash
bun run dev                          # Start API server (port 4201, hot-reload)
bun run db:generate                  # Generate Drizzle migration files
bun run db:migrate                   # Apply pending migrations
bun run db:push                      # Push schema directly (dev only)
bun run db:studio                    # Open Drizzle Studio (DB browser)
bun run test                         # Run Vitest test suite
bun run test -- src/__tests__/foo    # Run a single test file
bun run lint:fix                     # Run Biome lint and auto-fix
```

## Common Commands (apps/web)

```bash
bun run dev                         # Start dev server (port 4200)
bun run build                       # Type-check and build for production
bun run test                        # Run Vitest test suite
bun run test -- src/foo.test.tsx    # Run a single test file
bun run lint:fix                    # Run Biome lint and auto-fix
```

## Testing Caveats

- **API tests require a running Postgres** on port 4210 — they hit a real database, not mocks.
- **API tests run under Node, not Bun** — Vitest doesn't use the Bun runtime. A setup file polyfills `Bun.password` with `crypto.scrypt`, so test password hashes differ from production (argon2).
- **Web tests** use jsdom. No setup files currently.

## Secrets Management

- `.kamal/secrets` — local secrets for manual Kamal deploys (gitignored)
- GitHub repo secrets — used by CI deploy jobs (VPS_SSH_KEY, GHCR_TOKEN, DATABASE_URL, JWT_SECRET, OPENROUTER_API_KEY, POSTGRES_PASSWORD)
- Never commit plaintext secrets.

## Key Conventions

- `biome.json` lives at the **repo root** and applies to all packages.
- `routeTree.gen.ts` is **committed** — auto-generated by TanStack Router Vite plugin. Do not hand-edit.
- All app-level config (tsconfig, vite.config.ts, vitest.config.ts, components.json) lives inside the app directory.
- Use `bun` / `bunx` — never `npm` / `npx`.
- Use `agent-browser` directly (not via bun/npx) for browser testing.
- Never read `.env` files — use `src/env.ts` exports instead.
- Imports always at the top of the file — never inside functions.
- No global variables.
- Commit message format is defined in `.claude/rules/commit-messages.md` — follow that format.
- Small, focused commits — one logical change per commit. Always push after every commit.
- **Lefthook** runs Biome on staged files pre-commit (auto-fixes and re-stages).
- **Row-Level Security**: User-scoped tables use `pgTable()` with `userIdColumn()` + `isolationPolicy()` + `.enableRLS()`. Shared tables use `publicTable()`. Lefthook checks that every `pgTable()` call has a matching `.enableRLS()`. All DB queries on user-scoped tables must be wrapped in `withUserScope(userId, (db) => ...)`.

## System Prompt

Evee's personality is in `prompts/SYSTEM.md`, loaded from disk on each LLM call (so edits take effect without restart).

## Documentation

See [docs/README.md](docs/README.md) for the full documentation hub.
