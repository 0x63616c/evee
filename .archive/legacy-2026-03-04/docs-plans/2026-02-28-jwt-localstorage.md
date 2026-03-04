# JWT localStorage Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Store the JWT from login/signup in localStorage via Zustand, attach it to every tRPC request, and guard authenticated routes with a redirect to `/login`.

**Architecture:** A Zustand `persist` store holds `token`. The tRPC client reads it via `getState()` in the `headers` function. TanStack Router's `beforeLoad` guards a `_authenticated` layout route — any unauthenticated visit redirects to `/login`. Login and signup navigate to `/dashboard` on success.

**Tech Stack:** Zustand + `persist` middleware, tRPC `httpBatchLink`, TanStack Router file-based routing

---

### Task 1: Auth store

**Files:**
- Create: `apps/web/src/stores/auth.ts`

**Step 1: Create the store**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    { name: 'twe-auth' },
  ),
);
```

**Step 2: Verify the build**

Run from `apps/web/`:
```bash
bun run build
```
Expected: exits 0, no TypeScript errors.

**Step 3: Commit**

```bash
git add apps/web/src/stores/auth.ts
git commit -m "Web: Add Zustand auth store with localStorage persistence"
git push
```

---

### Task 2: Attach token to tRPC requests

**Files:**
- Modify: `apps/web/src/lib/trpc.ts`

**Step 1: Add `headers` to `httpBatchLink`**

Replace the entire file with:

```ts
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '../../../api/src/routers/index.ts';
import { useAuthStore } from '@/stores/auth';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL as string,
      headers() {
        const token = useAuthStore.getState().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

Note: `useAuthStore.getState()` reads Zustand state outside React — this is the correct pattern for non-component contexts.

**Step 2: Verify the build**

```bash
bun run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add apps/web/src/lib/trpc.ts
git commit -m "Web: Attach JWT to tRPC requests via Authorization header"
git push
```

---

### Task 3: Store token and redirect after login

**Files:**
- Modify: `apps/web/src/routes/login.tsx`

**Step 1: Update login page**

Replace the entire file with:

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldInput } from '@/components/ui/field';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const login = trpc.auth.login.useMutation({
    onSuccess(data) {
      setToken(data.token);
      navigate({ to: '/dashboard' });
    },
    onError(error) {
      if (error instanceof Error && !('data' in error)) {
        toast.error('Connection error. Please check your network and try again.');
      } else {
        toast.error('Invalid email or password.');
      }
    },
  });

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!email || !password) return;
    login.mutate({ email, password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            The Workflow Engine
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Bottom card */}
        <div className="rounded-lg ring-1 ring-border bg-muted shadow-sm pb-4">
          {/* Top card (form) */}
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border-b border-border bg-card px-6 py-5"
          >
            <div className="space-y-4">
              <FieldInput
                label="Email address"
                id="email"
                type="text"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={submitted && !email}
              />

              <FieldInput
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={submitted && !password}
                action={
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                }
              />

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {login.isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Footer text on bottom card */}
          <p className="text-xs text-muted-foreground px-6 pt-3">
            Need an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-foreground hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify the build**

```bash
bun run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add apps/web/src/routes/login.tsx
git commit -m "Web: Store JWT and redirect to dashboard after login"
git push
```

---

### Task 4: Store token and redirect after signup

**Files:**
- Modify: `apps/web/src/routes/signup.tsx`

**Step 1: Update signup page**

Replace the entire file with:

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldInput } from '@/components/ui/field';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const register = trpc.auth.register.useMutation({
    onSuccess(data) {
      setToken(data.token);
      navigate({ to: '/dashboard' });
    },
    onError() {
      toast.error('Something went wrong. Please try again.');
    },
  });

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    register.mutate({ email, password });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            The Workflow Engine
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Create your account
          </p>
        </div>

        <div className="rounded-lg ring-1 ring-border bg-muted shadow-sm pb-4">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border-b border-border bg-card px-6 py-5"
          >
            <div className="space-y-4">
              <FieldInput
                label="Email address"
                id="email"
                type="text"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={submitted && !email}
              />

              <FieldInput
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={submitted && !password}
              />

              <FieldInput
                label="Confirm password"
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={
                  submitted &&
                  (!confirmPassword || password !== confirmPassword)
                }
              />

              <button
                type="submit"
                disabled={register.isPending}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {register.isPending ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground px-6 pt-3">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify the build**

```bash
bun run build
```
Expected: exits 0.

**Step 3: Commit**

```bash
git add apps/web/src/routes/signup.tsx
git commit -m "Web: Store JWT and redirect to dashboard after signup"
git push
```

---

### Task 5: Protected layout route + dashboard stub

**Files:**
- Create: `apps/web/src/routes/_authenticated.tsx`
- Create: `apps/web/src/routes/_authenticated/dashboard.tsx`

**Step 1: Create the authenticated layout route**

TanStack Router treats files prefixed with `_` as pathless layout routes — the `_authenticated` prefix is stripped from the URL. Any route nested under `_authenticated/` is protected.

Create `apps/web/src/routes/_authenticated.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => <Outlet />,
});
```

**Step 2: Create the dashboard stub**

Create `apps/web/src/routes/_authenticated/dashboard.tsx`:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { clearToken } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate({ to: '/login' });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Verify the build**

The TanStack Router Vite plugin will pick up the new files and regenerate `routeTree.gen.ts` automatically during `bun run build`.

```bash
bun run build
```
Expected: exits 0. `routeTree.gen.ts` will be updated — commit it.

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated.tsx apps/web/src/routes/_authenticated/dashboard.tsx apps/web/src/routeTree.gen.ts
git commit -m "Web: Add protected layout route and dashboard stub"
git push
```

---

### Task 6: Smoke test in the browser

Tilt should already be running. If not: `tilt up` from the repo root.

**Test 1: Login → dashboard**
- Open `http://localhost:4200/login`
- Sign in with valid credentials
- Expected: redirected to `/dashboard`, "Dashboard" heading visible

**Test 2: Dashboard → logout**
- Click "Sign out"
- Expected: redirected to `/login`

**Test 3: Auth guard**
- Visit `http://localhost:4200/dashboard` while logged out (after logout or in a fresh incognito window)
- Expected: immediately redirected to `/login`

**Test 4: Token in localStorage**
- Log in, open DevTools → Application → Local Storage → `http://localhost:4200`
- Expected: `twe-auth` key present with `{"state":{"token":"eyJ..."},"version":0}`

**Test 5: Signup → dashboard**
- Visit `http://localhost:4200/signup`
- Create a new account
- Expected: redirected to `/dashboard`
