# Task Management

## Workflow

Tasks are tracked in [Linear](https://linear.app) using the Linear MCP integration.

## Priority Queue

Based on the [requirements](../project/requirements.md#planned):

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | SQLite logging of messages and tool calls | Medium |
| 2 | Thread auto-rename after 3 messages | Low |
| 3 | Multi-model routing | Medium |

## Definition of Done

A task is complete when:
- Code passes `ruff check` and `ruff format --check`
- Tests pass (`uv run pytest`)
- Changes committed with conventional commit message
- Pushed to main
