# Backend Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up the SaaS backend skeleton — tRPC API with auth, PostgreSQL + Drizzle, and Tilt dev orchestration.

**Architecture:** A standalone tRPC HTTP server in `apps/api` talks to PostgreSQL via Drizzle ORM. Auth is minimal email/password with JWT. TypeIDs provide prefixed, time-sortable primary keys. Tilt + docker-compose orchestrates everything locally.

**Tech Stack:** Bun, tRPC, Drizzle ORM, PostgreSQL 16, TypeID, jose (JWT), Tilt, docker-compose

---

### Task 1: Scaffold `apps/api` package

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`

**Step 1: Create `apps/api/package.json`**

```json
{
  "name": "api",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "lint": "biome check --config-path=../../ .",
    "lint:fix": "biome check --config-path=../../ --write .",
    "format": "biome format --config-path=../../ --write .",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@trpc/server": "^11",
    "drizzle-orm": "^0.44",
    "jose": "^6",
    "postgres": "^3",
    "typeid-js": "^1",
    "zod": "^3"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.4",
    "@types/node": "^24",
    "drizzle-kit": "^0.31",
    "typescript": "~5.9.3",
    "vitest": "^4"
  }
}
```

**Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Install dependencies**

Run: `cd apps/api && bun install`
Expected: `bun.lock` created, `node_modules` populated.

**Step 4: Commit**

```
API: Scaffold apps/api package

Sets up the API service with tRPC, Drizzle, and auth dependencies.
```

---

### Task 2: Create env config

**Files:**
- Create: `apps/api/.env.example`
- Create: `apps/api/src/env.ts`

**Step 1: Create `.env.example`**

```env
DATABASE_URL=postgres://postgres:postgres@localhost:4210/workflow_engine
JWT_SECRET=dev-secret-change-in-production
```

**Step 2: Create `apps/api/src/env.ts`**

This reads environment variables with validation so the server fails fast if config is missing.

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(4201),
});

export const env = envSchema.parse(process.env);
```

**Step 3: Create `.env` locally (do NOT commit)**

Run: `cp apps/api/.env.example apps/api/.env`

Make sure `apps/api/.env` is in `.gitignore`. Check if `apps/api/.gitignore` exists; if not, create one with:

```
node_modules/
dist/
.env
```

**Step 4: Commit**

```
API: Add env config with validation

Zod schema validates DATABASE_URL and JWT_SECRET at startup so
missing config fails fast instead of causing cryptic runtime errors.
```

---

### Task 3: Database schema and connection

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/drizzle.config.ts`

**Step 1: Create the Drizzle schema**

`apps/api/src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Step 2: Create the DB connection**

`apps/api/src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from './schema.js';

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

**Step 3: Create `drizzle.config.ts`**

`apps/api/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 4: Commit**

```
API: Add Drizzle schema and DB connection

Users table with TypeID primary key, email, password hash, and
created_at. Drizzle config points at the local Postgres instance.
```

---

### Task 4: tRPC init — context and procedures

**Files:**
- Create: `apps/api/src/trpc.ts`

**Step 1: Create the tRPC initialisation file**

`apps/api/src/trpc.ts`:

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { IncomingMessage } from 'node:http';
import { jwtVerify } from 'jose';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { env } from './env.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

export async function createContext({ req }: { req: IncomingMessage }) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return { user: null };
  }

  try {
    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, jwtSecret);
    const userId = payload.sub;
    if (!userId) return { user: null };

    const [user] = await db
      .select({ id: users.id, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return { user: user ?? null };
  } catch {
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in.',
    });
  }
  return opts.next({
    ctx: { user: opts.ctx.user },
  });
});
```

**Step 2: Commit**

```
API: Add tRPC init with auth context and procedures

Context extracts JWT from Authorization header and resolves the user.
publicProcedure and protectedProcedure provide the two auth levels.
```

---

### Task 5: Auth router — register and login

**Files:**
- Create: `apps/api/src/routers/auth.ts`

**Step 1: Create the auth router**

`apps/api/src/routers/auth.ts`:

```typescript
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { typeid } from 'typeid-js';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { env } from '../env.js';
import { publicProcedure, router } from '../trpc.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

const authInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = router({
  register: publicProcedure.input(authInput).mutation(async ({ input }) => {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Email already registered.',
      });
    }

    const id = typeid('user').toString();
    const passwordHash = await Bun.password.hash(input.password);

    await db.insert(users).values({
      id,
      email: input.email,
      passwordHash,
    });

    const token = await new SignJWT({ sub: id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(jwtSecret);

    return { token };
  }),

  login: publicProcedure.input(authInput).mutation(async ({ input }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    const valid = await Bun.password.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    const token = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(jwtSecret);

    return { token };
  }),
});
```

**Step 2: Commit**

```
API: Add auth router with register and login

Email/password registration with argon2 hashing via Bun.password,
JWT tokens via jose. TypeID generates prefixed user IDs.
```

---

### Task 6: User router — `me` query

**Files:**
- Create: `apps/api/src/routers/user.ts`

**Step 1: Create the user router**

`apps/api/src/routers/user.ts`:

```typescript
import { protectedProcedure, router } from '../trpc.js';

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
```

**Step 2: Commit**

```
API: Add user router with protected me query

Demonstrates an authenticated route that returns the current user.
```

---

### Task 7: Root router and server entry point

**Files:**
- Create: `apps/api/src/routers/index.ts`
- Create: `apps/api/src/index.ts`

**Step 1: Create the root router**

`apps/api/src/routers/index.ts`:

```typescript
import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { userRouter } from './user.js';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

**Step 2: Create the server entry point**

`apps/api/src/index.ts`:

```typescript
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers/index.js';
import { createContext } from './trpc.js';
import { env } from './env.js';

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(env.PORT);
console.log(`API server listening on port ${env.PORT}`);
```

**Step 3: Verify it compiles**

Run: `cd apps/api && bunx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```
API: Add root router and server entry point

Merges auth and user routers, exports AppRouter type for the
frontend, and starts the standalone tRPC HTTP server.
```

---

### Task 8: Docker Compose — PostgreSQL

**Files:**
- Create: `docker-compose.yml` (repo root)

**Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "4210:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: workflow_engine
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: Verify it starts**

Run: `docker compose up -d postgres`
Expected: Postgres container starts, listening on port 4210.

Run: `docker compose ps`
Expected: `postgres` service is running.

**Step 3: Tear down**

Run: `docker compose down`

**Step 4: Commit**

```
Infra: Add docker-compose with PostgreSQL

Postgres 16 on port 4210 with a named volume for data persistence.
```

---

### Task 9: Generate and run initial migration

Requires: Postgres running (`docker compose up -d postgres`).

**Step 1: Start Postgres**

Run: `docker compose up -d postgres`

**Step 2: Generate the migration**

Run: `cd apps/api && bunx drizzle-kit generate`
Expected: Migration SQL file created in `apps/api/drizzle/`.

**Step 3: Run the migration**

Run: `cd apps/api && bunx drizzle-kit migrate`
Expected: `users` table created in the database.

**Step 4: Verify the table exists**

Run: `docker compose exec postgres psql -U postgres -d workflow_engine -c '\dt'`
Expected: `users` table listed.

**Step 5: Commit**

```
API: Add initial migration for users table

Generated by drizzle-kit from the schema definition.
```

---

### Task 10: Smoke test the API

Requires: Postgres running.

**Step 1: Start the API**

Run: `cd apps/api && bun run dev`
Expected: `API server listening on port 4201`

**Step 2: Test register**

Run in a separate terminal:
```bash
curl -s -X POST http://localhost:4201/auth.register \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"test@example.com","password":"password123"}}' | jq
```
Expected: JSON response with a `result.data.token` field.

**Step 3: Test login**

```bash
curl -s -X POST http://localhost:4201/auth.login \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"test@example.com","password":"password123"}}' | jq
```
Expected: JSON response with a `result.data.token` field.

**Step 4: Test `user.me`**

Use the token from the previous step:
```bash
curl -s http://localhost:4201/user.me \
  -H 'Authorization: Bearer <TOKEN>' | jq
```
Expected: JSON response with `result.data` containing `id`, `email`, `createdAt`.

**Step 5: Test `user.me` without token**

```bash
curl -s http://localhost:4201/user.me | jq
```
Expected: JSON error response with `UNAUTHORIZED`.

No commit for this task — it's manual verification.

---

### Task 11: Automated tests

Requires: Postgres running.

**Files:**
- Create: `apps/api/src/__tests__/api.test.ts`

**Step 1: Create the test file**

`apps/api/src/__tests__/api.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { appRouter } from '../routers/index.js';
import { createContext } from '../trpc.js';

const caller = appRouter.createCaller({ user: null });

describe('auth', () => {
  it('register returns a token', async () => {
    const result = await caller.auth.register({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    });
    expect(result.token).toBeDefined();
  });

  it('login returns a token', async () => {
    const email = `test-${Date.now()}@example.com`;
    await caller.auth.register({ email, password: 'password123' });
    const result = await caller.auth.login({ email, password: 'password123' });
    expect(result.token).toBeDefined();
  });

  it('login with wrong password returns UNAUTHORIZED', async () => {
    const email = `test-${Date.now()}@example.com`;
    await caller.auth.register({ email, password: 'password123' });
    await expect(
      caller.auth.login({ email, password: 'wrongpassword' }),
    ).rejects.toThrow('Invalid email or password');
  });
});

describe('user.me', () => {
  it('returns the user when authenticated', async () => {
    const email = `test-${Date.now()}@example.com`;
    const { token } = await caller.auth.register({ email, password: 'password123' });

    // Create an authenticated caller by simulating context with a valid JWT
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const ctx = await createContext({ req });
    const authedCaller = appRouter.createCaller(ctx);

    const me = await authedCaller.user.me();
    expect(me.email).toBe(email);
  });

  it('returns UNAUTHORIZED without a token', async () => {
    await expect(caller.user.me()).rejects.toThrow('You must be logged in');
  });
});
```

**Step 2: Run the tests**

Run: `cd apps/api && bun run test`
Expected: All 5 tests pass.

**Step 3: Commit**

```
API: Add integration tests for auth and user.me

Five tests covering register, login, wrong password, authenticated
me query, and unauthenticated me rejection.
```

---

### Task 12: Tiltfile

**Files:**
- Create: `Tiltfile` (repo root)

**Step 1: Create the Tiltfile**

```python
docker_compose('./docker-compose.yml')

local_resource(
  'db-migrate',
  cmd='cd apps/api && bunx drizzle-kit migrate',
  resource_deps=['postgres'],
)

local_resource(
  'db-reset',
  cmd='docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS workflow_engine;" && docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE workflow_engine;" && cd apps/api && bunx drizzle-kit migrate',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  resource_deps=['postgres'],
)

local_resource(
  'api',
  serve_cmd='cd apps/api && bun run dev',
  deps=['apps/api/src'],
  resource_deps=['db-migrate'],
)

local_resource(
  'web',
  serve_cmd='cd apps/web && bun run dev -- --port 4200',
  deps=['apps/web/src'],
)
```

**Step 2: Verify Tilt starts**

Run: `tilt up`
Expected: Tilt dashboard opens at `localhost:10350` (default). Postgres, db-migrate, api, and web resources all show green.

Note: We'll configure Tilt to use port 4220 if Tilt supports `--port` flag, otherwise use the default `10350`.

**Step 3: Verify all services work through Tilt**

- Postgres: port 4210
- API: port 4201
- Web: port 4200
- Tilt dashboard: default port

**Step 4: Commit**

```
Infra: Add Tiltfile for dev orchestration

Orchestrates Postgres, migrations, API, and web dev servers.
db-reset is a manual trigger for wiping and re-migrating the database.
```

---

### Task 13: Update Vite dev server port

**Files:**
- Modify: `apps/web/vite.config.ts`

**Step 1: Add the port to Vite config**

In `apps/web/vite.config.ts`, add `server.port`:

```typescript
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4200,
  },
});
```

**Step 2: Commit**

```
Web: Set dev server port to 4200

Standardises on the 42xx port range used across all services.
```

---

### Task 14: Update `.gitignore` and clean up

**Files:**
- Modify: root `.gitignore` (if it exists) or create it

**Step 1: Ensure root `.gitignore` covers common patterns**

Check the root `.gitignore`. Make sure it includes:
```
node_modules/
dist/
.env
```

If no root `.gitignore` exists, create one. If `apps/api/.gitignore` is needed separately, create that too.

**Step 2: Commit**

```
Meta: Update gitignore for API service

Ensures .env files and build artifacts are excluded.
```

---

### Task 15: Update CLAUDE.md with backend conventions

**Files:**
- Modify: `CLAUDE.md` (repo root)

**Step 1: Add backend conventions to CLAUDE.md**

Add the following to the root `CLAUDE.md`:

```markdown
## Backend (`apps/api`)

- **Runtime:** Bun
- **Framework:** tRPC (standalone HTTP adapter)
- **Database:** PostgreSQL 16 + Drizzle ORM
- **ID system:** TypeID — prefixed, time-sortable IDs (e.g. `user_xxx`). Stored as full string in varchar columns.
- **Auth:** JWT via `jose`, password hashing via `Bun.password` (argon2)
- **Env config:** Validated via Zod in `src/env.ts`. Never read `.env` directly — use `env.ts` exports.

### Ports

| Service    | Port |
| ---------- | ---- |
| web (Vite) | 4200 |
| api (tRPC) | 4201 |
| PostgreSQL | 4210 |

### Dev workflow

```sh
tilt up        # starts everything
tilt down      # stops everything
tilt trigger db-reset  # wipe DB and re-migrate
```
```

**Step 2: Commit**

```
Meta: Document backend conventions in CLAUDE.md

Records the stack, ports, and dev workflow for the API service.
```
