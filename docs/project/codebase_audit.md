# Codebase Audit Report

**Project:** Evee - Personal AI Assistant Discord Bot
**Date:** 2026-03-03
**Overall Score:** 7.8/10
**Project Type:** Long-running bot/worker

---

## Executive Summary

Evee is a well-structured MVP Discord bot (~425 LOC across 4 Python files) with clean separation between bot logic, LLM client, and tool system. The codebase is concise and readable. Main areas for improvement: no type checking config and potential SSRF in the URL fetcher tool.

---

## Compliance Score

| # | Category | Score | Issues | Severity |
|---|----------|-------|--------|----------|
| 1 | Security | 8.3/10 | 2 | C:0 H:1 M:0 L:1 |
| 2 | Build | 7.0/10 | 3 | C:0 H:0 M:3 L:0 |
| 3 | Code Principles | 9.0/10 | 2 | C:0 H:0 M:1 L:1 |
| 4 | Code Quality | 9.6/10 | 2 | C:0 H:0 M:0 L:2 |
| 5 | Dependencies | 10.0/10 | 0 | - |
| 6 | Dead Code | 10.0/10 | 0 | - |
| 7 | Observability | 8.8/10 | 3 | C:0 H:0 M:2 L:1 |
| 8 | Concurrency | 9.5/10 | 1 | C:0 H:0 M:0 L:1 |
| 9 | Lifecycle | 10.0/10 | 0 | - |

**Severity Summary:** Critical: 0 | High: 1 | Medium: 3 | Low: 5

---

## Strengths

1. **Clean tool registry pattern** — `tools/__init__.py` auto-discovers tools via `pkgutil.iter_modules`, making it trivial to add new tools by dropping a file in the directory
2. **Async-correct LLM calls** — `asyncio.to_thread()` properly wraps synchronous OpenAI client to avoid blocking the Discord event loop
3. **Intentional system prompt reloading** — reading `SYSTEM.md` from disk each call allows live editing without restarts
4. **Good message splitting** — `split_message()` tries newlines first, then spaces, then hard-splits, respecting Discord's 2000-char limit cleanly
5. **Focused files** — each file has a single responsibility; nothing is over 300 lines

---

## Findings

### 1. Security

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| S1 | HIGH | No URL validation in `fetch_url` — accepts any URL including internal IPs (`http://169.254.169.254`, `file://`, `http://localhost`), enabling SSRF if LLM is prompt-injected | `tools/fetch_url.py:32` | Validate URL scheme (https/http only) and reject private/internal IP ranges before fetching |
| S2 | LOW | Broad exception handler in `execute_tool` could mask security-relevant errors | `tools/__init__.py:36` | Log at WARNING level minimum; currently uses `log.exception` which is adequate |

### 2. Build

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| B1 | MEDIUM | No linter or formatter configured (ruff, flake8, black, etc.) | `pyproject.toml` | Add `[tool.ruff]` section to `pyproject.toml` |
| B2 | MEDIUM | No type checker configured (mypy, pyright) | `pyproject.toml` | Add mypy or pyright with at least basic config |
| B3 | MEDIUM | No test framework or tests present | Project root | Add pytest + at least unit tests for `split_message`, `format_thread_name`, tool registry |

### 3. Code Principles

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| P1 | MEDIUM | Module-level side effects: `_discover_tools()` runs at import time (`tools/__init__.py:60`), `load_dotenv()` runs at module level (`evee.py:20`) | `tools/__init__.py:60`, `evee.py:20` | Move side effects into explicit init functions or `main()` |
| P2 | LOW | Magic numbers: `100` (history limit), `2000` (Discord limit) used inline | Various | Extract to named constants at module level |

### 4. Code Quality

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| Q1 | LOW | `split_message` has a subtle edge case: `lstrip("\n")` after splitting could join lines unexpectedly when content starts with newlines | `evee.py:197` | Minor; current behavior is acceptable for Discord messages |
| Q2 | LOW | `handle_thread_message` includes bot's own status messages (tool call notifications) in conversation history sent to LLM, potentially polluting context | `evee.py:256-262` | Filter out status messages or tag them so they can be excluded from history |

### 5. Dependencies

No issues found. All dependencies are actively maintained and appropriate for the use case.

### 6. Dead Code

No dead code, unused imports, or commented-out code found. Codebase is clean.

### 7. Observability

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| O1 | MEDIUM | No structured logging — using basic `format="%(asctime)s %(levelname)s %(message)s"` | `evee.py:25-31` | Consider `structlog` or at minimum add `%(name)s` to format |
| O2 | MEDIUM | LLM calls lack instrumentation — no logging of token usage, latency, model, or tool calls made | `evee.py:112-170` | Log request/response metadata (model, tokens, duration, tool names) |
| O3 | LOW | No log rotation configured for `~/.local/log/evee.log` — will grow unbounded | `evee.py:22-31` | Use `RotatingFileHandler` with a size limit |

### 8. Concurrency

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
| C1 | LOW | No message deduplication — rapid messages can trigger concurrent `chat()` calls with overlapping tool execution | `evee.py:226-268` | Documented as intentional MVP trade-off; add queue/lock when it becomes a problem |

### 9. Lifecycle

| # | Severity | Finding | Location | Recommendation |
|---|----------|---------|----------|----------------|
No proxy-related lifecycle issues remain after migration to OpenRouter.

---

## Recommended Actions (Priority Order)

1. **[HIGH] Fix SSRF in fetch_url** — Add URL scheme validation and block private IP ranges before `httpx.get()`
2. **[MEDIUM] Add LLM call logging** — Log token usage, latency, and tool calls for observability
3. **[LOW] Add log rotation** — Switch to `RotatingFileHandler` for `evee.log`
4. **[LOW] Extract magic numbers** — Define `HISTORY_LIMIT`, `DISCORD_MSG_LIMIT`, etc. as module constants

---

## Audit Metadata

- **Audited files:** `evee.py` (287 LOC), `tools/__init__.py` (60 LOC), `tools/search_web.py` (31 LOC), `tools/fetch_url.py` (46 LOC)
- **Total LOC:** ~424
- **Python version:** 3.12
- **Dependencies:** discord.py, openai, duckduckgo-search, httpx, trafilatura, python-dotenv
