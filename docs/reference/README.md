# Reference Documentation

Architectural decisions, guides, and research for evee.

## ADRs (Architecture Decision Records)

Location: [adrs/](adrs/)

Record significant architectural decisions using the format:

```
# ADR-NNN: Title

## Status
Accepted | Superseded | Deprecated

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Consequences
What becomes easier or more difficult because of this change?
```

## Guides

Location: [guides/](guides/)

How-to guides for common development tasks.

## Existing Decisions (Documented in CLAUDE.md)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM provider | OpenRouter + DeepSeek V3 | Cost-effective, OpenAI-compatible API |
| Bot framework | discord.py | Mature, well-documented, async-native |
| Tool discovery | Decorator + pkgutil auto-import | Zero-config tool registration |
| System prompt | Read from disk each call | Live-editable without restart |
| Thread model | New thread per channel message | Clean conversation isolation |
| SSRF protection | URL validation + IP blocking | Prevent prompt injection attacks via fetch_url |
