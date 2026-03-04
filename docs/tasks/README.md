# Task Management

Tasks are tracked in [Linear](https://linear.app/evee). See [kanban_board.md](kanban_board.md) for the full registry.

## Workflow

```
Backlog -> Todo -> In Progress -> Done
                               -> Canceled
```

## Definition of Done

A task is complete when:
- Code passes `bun run lint:fix` (Biome)
- Tests pass (`bun run test`)
- Changes committed with conventional commit message
- Pushed to main
- Linear issue marked Done

## Current Focus

1. **Epic 5** -- Hetzner VPS + Coolify deployment (DNS, deploy, security hardening)
2. **EVE-23** -- Re-setup SOPS + age secrets encryption
3. **Epic 1** -- Temporal Workflow Rewrite (future)
