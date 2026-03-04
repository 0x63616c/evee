# Development Principles

Conventions and principles for the Evee codebase (TypeScript/Bun).

## Code Style

- **TypeScript 5.9+** — strict mode, no `any`, use Zod for runtime validation
- **Imports at top** — never inside functions
- **No global variables** — encapsulate mutable state in Zustand stores or closures
- **No emojis** in code or output unless explicitly requested
- **camelCase** for functions, variables; PascalCase for types/components; kebab-case for files
- **Biome** for linting and formatting — run `bun run lint:fix` before committing

## Architecture Principles

- **Simple MVP first** — layer features incrementally, avoid over-engineering
- **Single responsibility** — each file does one thing
- **Vertical slices** — each feature crosses all layers (API → DB → UI) rather than horizontal layers
- **Live-editable config** — system prompt reads from disk each call, no restart needed
- **Fail gracefully** — tool errors return user-friendly messages, never crash the server
- **No tRPC for streaming** — use plain Hono routes for AI SDK endpoints; use Hono RPC (`hc`) for type-safe CRUD

## Auth Pattern

- **`protectedRouter()`** factory — `new Hono().use('*', authMiddleware)`. Every route added to it gets JWT auth automatically. New endpoints are protected by default; opting out requires explicit effort.
- Never read `.env` directly — always use `src/env.ts` Zod-validated exports.

## Dependencies

- Prefer focused, well-maintained libraries over large frameworks
- Use `bun` / `bunx` — never `npm` / `npx`
- `@openrouter/ai-sdk-provider` for LLM access — do not call OpenRouter directly
- Vercel AI SDK `streamText` for all LLM calls — do not build custom streaming loops

## Testing

- Use Vitest for all tests
- Mock external services (DB, HTTP, LLM) — tests must work offline
- Test file naming: `src/__tests__/*.test.ts`

## Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Small, focused commits — one logical change per commit
- Always push after every commit
- Lefthook runs Biome check + Vitest on pre-commit

## Linting

- Biome for linting and formatting (replaces ESLint + Prettier)
- Config lives at repo root `biome.json`, applies to all packages
- CI enforces `biome check` and `vitest run`
