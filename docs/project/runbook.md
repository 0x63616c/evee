# Runbook

<!-- SCOPE: Setup, development, and operational procedures. No architecture context. -->

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | 1.x | `curl -fsSL https://bun.sh/install \| bash` |
| Docker | 24+ | Docker Desktop or OrbStack |
| Tilt | latest | `brew install tilt` |

## Initial Setup

```bash
# 1. Clone
ghq get 0x63616c/evee
cd ~/code/github.com/0x63616c/evee

# 2. Install dependencies
bun install --cwd apps/api
bun install --cwd apps/web

# 3. Create env file
cp .env.example .env
# Edit .env -- set DATABASE_URL, JWT_SECRET, and OPENROUTER_API_KEY
```

## Development

```bash
# Start everything (postgres + migrations + api + web)
tilt up

# Open in browser
open http://localhost:4200   # Web UI
open http://localhost:4201   # API
```

Tilt hot-reloads `apps/api/src` and `apps/web/src` automatically.

## Environment Variables

File: `.env` (repo root)

| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | `postgres://postgres:postgres@localhost:4210/evee` | Yes |
| JWT_SECRET | `<random 32+ char string>` | Yes |
| OPENROUTER_API_KEY | `sk-or-...` | Yes |

Generate JWT secret: `openssl rand -base64 32`

All `apps/api` scripts read from root `.env` via `--env-file=../../.env`.

## Database

```bash
# Run pending migrations
cd apps/api && bun run db:migrate

# Generate migration from schema changes
cd apps/api && bun run db:generate

# Seed default channels
cd apps/api && bun run db:seed

# Reset database (via Tilt manual trigger)
tilt trigger db-reset

# Connect to DB directly
docker compose exec postgres psql -U postgres -d evee
```

## Common Tasks

### Add a new API route

1. Create `apps/api/src/routers/<name>.ts`
2. Use `protectedRouter()` for authenticated routes
3. Mount in `apps/api/src/routers/index.ts`
4. Export `AppType` update propagates to frontend automatically

### Update system prompt

Edit `prompts/SYSTEM.md` -- takes effect on next LLM call, no restart needed.

### Add a new LLM tool

1. Create `apps/api/src/tools/<name>.ts` using Vercel AI SDK `tool()` helper
2. Register in `apps/api/src/routes/chat.ts` tools object

## Logs

| Source | Location |
|--------|----------|
| API (dev) | stdout (Tilt terminal) |
| Web (dev) | stdout (Tilt terminal) |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`.

**Pipeline structure:**

| Job | Depends on | What it does |
|-----|-----------|--------------|
| `check` | -- | Lint (Biome) + web tests in one runner |
| `test-api` | -- | API tests against Postgres service container |
| `deploy-api` | check, test-api | Build Docker image, push to GHCR, `kamal deploy -P` |
| `deploy-web` | check | Build Docker image, push to GHCR, `kamal deploy -P` |

Deploy jobs only run on pushes to `main` (not PRs).

**Caching:**

- `actions/cache` on `node_modules` keyed by lockfile hash -- skips `bun install` on cache hit
- `docker/build-push-action` with GHA cache backend (`cache-from: type=gha`) -- subsequent builds with unchanged deps/layers take ~5-10s

**Concurrency:** Pushes to the same branch cancel in-progress runs (only the latest matters).

**Secrets (GitHub repo settings):** `VPS_SSH_KEY`, `GHCR_TOKEN`, `DATABASE_URL`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `POSTGRES_PASSWORD`

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Web UI | 4200 | Vite dev server |
| API | 4201 | Hono server |
| PostgreSQL | 4210 | Docker (maps to internal 5432) |

## Maintenance

**Update when:** Adding new setup steps, changing ports, adding env vars, changing CI steps.
**Verify:** Commands work from fresh clone; ports match docker-compose.yml and Tiltfile.
