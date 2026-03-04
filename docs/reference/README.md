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

## Manuals

Location: [manuals/](manuals/)

In-depth reference for specific subsystems.

## Research

Location: [research/](research/)

Investigation notes and findings.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM provider | OpenRouter + DeepSeek V3 | Cost-effective, OpenAI-compatible API |
| Web framework | Hono (API) + React (frontend) | Lightweight, typed RPC via `hc` |
| Auth | JWT via jose + protectedRouter() | Auto-protect all routes by default |
| Chat UI | assistant-ui primitives | Purpose-built for AI chat, works with AI SDK |
| System prompt | Read from disk each call | Live-editable without restart |
| Thread model | New thread per channel message | Clean conversation isolation |
| SSRF protection | URL validation + IP blocking | Prevent prompt injection via fetch_url |
| IDs | TypeID (typeid-js) | Prefixed, time-sortable, URL-safe |
