# Testing

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^4 | Test runner (unit + integration) |
| @testing-library/react | ^16 | React component testing (web) |
| @testing-library/jest-dom | ^6 | DOM assertion matchers (web) |
| jsdom | ^28 | Browser environment simulation (web) |

## Running Tests

```bash
# All tests
cd apps/api && bun run test
cd apps/web && bun run test

# Watch mode
cd apps/api && bun run test:watch
cd apps/web && bun run test:watch
```

## Test Location

| App | Pattern | Example |
|-----|---------|---------|
| api | `src/__tests__/*.test.ts` | `src/__tests__/api.test.ts` |
| web | `src/__tests__/*.test.tsx` | `src/__tests__/smoke.test.tsx` |

## Conventions

- Mock external services (DB, HTTP, LLM) -- tests must work offline
- Use `vitest` imports (`describe`, `it`, `expect`) not jest globals
- Name test files `<subject>.test.ts` or `<subject>.test.tsx`
- Keep tests fast -- avoid unnecessary setup/teardown

## CI

GitHub Actions runs `vitest run` for both apps on push/PR to `main`.
