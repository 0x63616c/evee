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
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set JWT_SECRET and OPENROUTER_API_KEY
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

File: `apps/api/.env`

| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | `postgres://postgres:postgres@localhost:4210/evee` | Yes |
| JWT_SECRET | `<random 32+ char string>` | Yes |
| OPENROUTER_API_KEY | `sk-or-...` | Yes |
| PORT | `4201` | No (default: 4201) |

Generate JWT secret: `openssl rand -base64 32`

## Database

```bash
# Run pending migrations
cd apps/api && bunx drizzle-kit migrate

# Generate migration from schema changes
cd apps/api && bunx drizzle-kit generate

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

Edit `apps/api/prompts/SYSTEM.md` — takes effect on next LLM call, no restart needed.

### Add a new LLM tool

Create `apps/api/src/tools/<verb>_<noun>.ts` using the tool registry pattern. Register in `apps/api/src/tools/index.ts`.

## Logs

| Source | Location |
|--------|----------|
| API (dev) | stdout (Tilt terminal) |
| Web (dev) | stdout (Tilt terminal) |
| Bot logs (legacy) | `~/.local/log/evee.log` |

## CI

GitHub Actions runs on push/PR to `main`:
- `biome check` (lint + format)
- `vitest run` (unit tests)

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Web UI | 4200 | Vite dev server |
| API | 4201 | Hono server |
| PostgreSQL | 4210 | Docker (maps to internal 5432) |

## Maintenance

**Update when:** Adding new setup steps, changing ports, adding env vars, changing CI steps.
**Verify:** Commands work from fresh clone; ports match docker-compose.yml and Tiltfile.
