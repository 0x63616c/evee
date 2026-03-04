# Tech Stack

<!-- SCOPE: Technology choices and versions only. No architecture patterns. -->

## Runtime

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Bun | 1.x | JS/TS runtime, package manager, test runner |
| Language | TypeScript | ~5.9.3 | Primary language, strict mode |

## Backend (apps/api)

| Package | Version | Purpose |
|---------|---------|---------|
| hono | ^4.12 | HTTP framework |
| jose | ^6 | JWT sign/verify |
| drizzle-orm | ^0.44 | ORM for PostgreSQL |
| postgres | ^3 | PostgreSQL driver |
| typeid-js | ^1 | Prefixed time-sortable IDs |
| zod | ^3 | Runtime validation, env schema |
| ai | ^6.0 | Vercel AI SDK -- streamText, tool calling |
| @openrouter/ai-sdk-provider | ^2.2 | OpenRouter LLM provider for AI SDK |
| duck-duck-scrape | ^2.2 | DuckDuckGo search (search_web tool) |

## Frontend (apps/web)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2 | UI library |
| react-dom | ^19.2 | DOM renderer |
| vite | ^7.3 | Build tool / dev server |
| @tanstack/react-router | ^1 | File-based routing |
| @tanstack/react-query | ^5 | Server state, cache |
| tailwindcss | ^4.2 | Utility CSS |
| @tailwindcss/vite | ^4.2 | Vite integration |
| radix-ui | ^1 | Headless UI primitives (via shadcn/ui) |
| class-variance-authority | ^0.7 | Component variant utility |
| clsx | ^2 | Class name utility |
| tailwind-merge | ^3 | Merge Tailwind classes |
| lucide-react | ^0.575 | Icons |
| geist | ^1.7 | Geist font |
| next-themes | ^0.4 | Dark/light mode |
| sonner | ^2 | Toast notifications |
| zustand | ^5 | Global client state (auth token, theme) |
| @assistant-ui/react | ^0.12 | AI chat UI primitives (Thread, Composer, Message) |
| @assistant-ui/react-ai-sdk | ^1.3 | AI SDK transport for assistant-ui |
| @assistant-ui/react-markdown | ^0.12 | Markdown rendering in assistant messages |

## Database

| Component | Technology | Version | Config |
|-----------|-----------|---------|--------|
| Database | PostgreSQL | 16 (Alpine) | Docker -- port 4210 |
| ORM | Drizzle ORM | ^0.44 | Schema in `apps/api/src/db/schema.ts` |
| Migrations | drizzle-kit | ^0.31 | `bun run db:migrate` from apps/api |

## Dev Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Biome | ^2.4 | Linting + formatting (replaces ESLint + Prettier) |
| Lefthook | latest | Git hooks (Biome check + Vitest pre-commit) |
| Vitest | ^4 | Unit + integration tests |
| Tilt | latest | Local dev orchestration |
| Docker | latest | PostgreSQL container |
| drizzle-kit | ^0.31 | DB schema management + migrations |

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| OpenRouter | LLM API gateway (OpenAI-compatible) | `OPENROUTER_API_KEY` in root `.env` |
| DeepSeek V3 | Default model via OpenRouter | `deepseek/deepseek-chat` |

## Infrastructure

| Component | Provider | Config |
|-----------|----------|--------|
| VPS | Hetzner CPX42 | Ubuntu, Nuremberg |
| Deploy | Kamal 2 | SSH + Docker, CI auto-deploy |
| Domain | worldwidewebb.co | DNS via Spaceship |
| Frontend | evee.worldwidewebb.co | nginx static build |
| API | api.worldwidewebb.co | Bun + Hono Docker container |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | JWT signing secret |
| OPENROUTER_API_KEY | Yes | OpenRouter API key |

See `.env.example` at repo root for template. All `apps/api` scripts read from `../../.env` via `--env-file` flag.

## Maintenance

**Update when:** Adding/upgrading packages, changing external services, adding env vars.
**Verify:** Package versions match `package.json` files in `apps/api/` and `apps/web/`.
