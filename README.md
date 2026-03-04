# The Workflow Engine

Coming Soon, find out more at [theworkflowengine.com](https://theworkflowengine.com)

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)
- [Tilt](https://tilt.dev)
- [lefthook](https://github.com/evilmartians/lefthook)

### Getting started

```bash
lefthook install   # wire up git hooks (once, after cloning)
tilt up            # start Postgres, run migrations, API (4201) + web (4200)
```

### Git hooks

Pre-commit runs Biome (lint + format) on staged files automatically. No extra steps needed after `lefthook install`.
