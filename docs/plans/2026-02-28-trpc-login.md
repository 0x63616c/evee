# tRPC Login Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the login page form up to `auth.login` via `@trpc/react-query` so clicking Sign in fires a real API request.

**Architecture:** Install `@trpc/client` + `@trpc/react-query` in `apps/web`. Create a tRPC React client typed against `AppRouter` (imported via relative path from `apps/api` — type-only, erased at build time). Wrap the app in a `trpc.Provider` alongside the existing `QueryClientProvider`. The login form uses `trpc.auth.login.useMutation()`.

**Tech Stack:** `@trpc/client ^11`, `@trpc/react-query ^11`, React 19, TanStack Query v5, Vite, TypeScript strict mode.

---

### Task 1: Install tRPC client packages

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install dependencies**

```bash
cd apps/web && bun add @trpc/client @trpc/react-query
```

Expected output: packages added to `dependencies` in `apps/web/package.json`.

**Step 2: Verify versions match the API's `@trpc/server`**

The API uses `@trpc/server ^11`. Check installed versions:

```bash
cd apps/web && bun pm ls | grep trpc
```

Expected: both `@trpc/client` and `@trpc/react-query` at v11.x.

**Step 3: Commit**

```bash
cd apps/web && git add package.json bun.lock
git commit -m "Web: Add @trpc/client and @trpc/react-query dependencies"
```

---

### Task 2: Add API URL environment variable

**Files:**
- Create: `apps/web/.env`
- Create: `apps/web/.env.example`

**Step 1: Create `.env.example`**

```
VITE_API_URL=http://localhost:4201/trpc
```

**Step 2: Create `.env`**

```
VITE_API_URL=http://localhost:4201/trpc
```

**Step 3: Verify `.env` is gitignored**

```bash
cat /Users/calum/code/github.com/0x63616c/the-workflow-engine/.gitignore | grep env
```

If `.env` is not covered, add `apps/web/.env` to the root `.gitignore`.

**Step 4: Commit**

```bash
git add apps/web/.env.example
git commit -m "Web: Add VITE_API_URL env var config"
```

---

### Task 3: Create the tRPC client

**Files:**
- Create: `apps/web/src/lib/trpc.ts`

**Step 1: Create `apps/web/src/lib/trpc.ts`**

```ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/routers/index.ts';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL,
    }),
  ],
});
```

Key notes:
- `import type` — this is erased at build time, no runtime dependency on the API source
- `import.meta.env.VITE_API_URL` — Vite inlines this at build time
- `httpBatchLink` — standard tRPC HTTP transport, batches multiple calls into one request

**Step 2: Check TypeScript resolves the import**

```bash
cd apps/web && bun run build 2>&1 | head -40
```

Expected: no errors related to `AppRouter` import. If TypeScript complains about the relative path being outside `include`, add `"../../api/src"` to the `include` array in `apps/web/tsconfig.app.json`.

**Step 3: Commit**

```bash
git add apps/web/src/lib/trpc.ts
git commit -m "Web: Set up tRPC React client"
```

---

### Task 4: Wrap the app in the tRPC provider

**Files:**
- Modify: `apps/web/src/main.tsx`

**Step 1: Update `main.tsx`**

Current structure:
```tsx
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

Updated structure:
```tsx
import { trpc, trpcClient } from './lib/trpc';

// queryClient stays as-is

root.render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
```

`trpc.Provider` must wrap `QueryClientProvider` and receive the same `queryClient` instance.

**Step 2: Verify it compiles**

```bash
cd apps/web && bun run build 2>&1 | head -40
```

Expected: clean build.

**Step 3: Commit**

```bash
git add apps/web/src/main.tsx
git commit -m "Web: Add tRPC provider to app root"
```

---

### Task 5: Wire up the login form

**Files:**
- Modify: `apps/web/src/routes/login.tsx`

**Step 1: Add controlled state and mutation**

The login page needs:
1. Controlled `email` + `password` state
2. `trpc.auth.login.useMutation()` — fires the API call
3. A `handleSubmit` that calls `mutate({ email, password })`

```tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

// inside LoginPage:
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const loginMutation = trpc.auth.login.useMutation();

function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  loginMutation.mutate({ email, password });
}
```

**Step 2: Wire the form**

- Wrap the form body in `<form onSubmit={handleSubmit}>`
- Add `value={email} onChange={e => setEmail(e.target.value)}` to the email input
- Add `value={password} onChange={e => setPassword(e.target.value)}` to the password input
- Change the Sign in button to `type="submit"`

**Step 3: Verify it compiles**

```bash
cd apps/web && bun run build 2>&1 | head -40
```

Expected: clean build with no type errors.

**Step 4: Commit**

```bash
git add apps/web/src/routes/login.tsx
git commit -m "Web: Wire login form to auth.login tRPC mutation"
```

---

### Task 6: Smoke test

With `tilt up` running (or `bun run dev` in both apps):

1. Open `http://localhost:4200/login`
2. Enter a valid email + password
3. Click Sign in
4. Open browser DevTools → Network tab
5. Confirm a POST to `http://localhost:4201/trpc/auth.login` fires
6. Confirm the response contains `{ result: { data: { token: "..." } } }`
