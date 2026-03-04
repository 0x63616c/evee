# Task Management

Tasks are tracked in [Linear](https://linear.app/evee). See [kanban_board.md](kanban_board.md) for the full registry.

## Workflow

```
Backlog → Todo → In Progress → Done
                             → Canceled
```

## Definition of Done

A task is complete when:
- Code passes `bun run lint:fix` (Biome)
- Tests pass (`bun run test`)
- Changes committed with conventional commit message
- Pushed to main
- Linear issue marked Done

## Priority Order (current)

1. **EVE-9** — Replace tRPC with Hono RPC (unblocks all other Epic 4 stories)
2. **EVE-10** — Channels/threads/messages data model + sidebar
3. **EVE-11** — Core chat streaming
4. **EVE-12** — Tool calling
5. **EVE-13** — Thread continuity
