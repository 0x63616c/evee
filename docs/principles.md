# Development Principles

Conventions and principles for the evee codebase.

## Code Style

- **Python 3.12+** — use modern syntax (type unions with `|`, `match`, etc.)
- **Imports at top** — never inside functions
- **No global variables** — encapsulate mutable state in classes or closures
- **No emojis** in code or output unless explicitly requested
- **snake_case** for functions, variables, modules; PascalCase for classes
- **Line length** — 120 characters max (configured in ruff)

## Tool Naming Convention

Tools use `verb_noun` snake_case: `search_web`, `fetch_url`, `get_weather`.

Each tool lives in its own file under `tools/` and is auto-discovered via the registry decorator.

## Architecture Principles

- **Simple MVP first** — layer features incrementally, avoid over-engineering
- **Single responsibility** — each file does one thing
- **Async-correct** — wrap blocking calls with `asyncio.to_thread()`, never block the event loop
- **Live-editable config** — system prompt reads from disk each call, no restart needed
- **Fail gracefully** — tool errors return user-friendly messages, never crash the bot

## Dependencies

- Prefer well-maintained, focused libraries over large frameworks
- Use `uv` for package management (never pip/npm directly)
- Pin minimum versions in `pyproject.toml` with `>=`

## Testing

- Use pytest for all tests
- Mock external services (DNS, HTTP) — tests must work offline
- Test file naming: `tests/test_<module>.py`

## Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Small, focused commits — one logical change per commit
- Always push after every commit

## Linting

- ruff for linting and formatting
- Rules: E, F, W, I (isort), UP (pyupgrade), B (bugbear), SIM (simplify), S (bandit security)
- CI enforces `ruff check` and `ruff format --check`
