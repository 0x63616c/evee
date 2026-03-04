# Create Account Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the existing `/signup` shell to `trpc.auth.register` with client-side validation, mirroring the login page's patterns.

**Architecture:** The `/signup` route already exists as a static shell. We add controlled state, a form submit handler with validation, and a tRPC mutation — no backend changes needed. JWT storage is deferred.

**Tech Stack:** React 19, TanStack Router, tRPC v11, Sonner (toasts), Tailwind CSS v4, shadcn/ui

---

### Task 1: Wire up the signup form

**Files:**
- Modify: `apps/web/src/routes/signup.tsx`

**Step 1: Replace the static shell with a fully wired component**

Replace the entire contents of `apps/web/src/routes/signup.tsx` with:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldInput } from '@/components/ui/field';
import { trpc } from '@/lib/trpc';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess(data) {
      console.log('register success', data.token);
    },
    onError(error) {
      if (error.data?.code === 'CONFLICT') {
        toast.error('An account with that email already exists.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
                aria-invalid={submitted && !confirmPassword}
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

**Step 2: Verify the dev server has no type errors**

Run from `apps/web/`:
```bash
bun run build
```
Expected: exits 0, no TypeScript errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/signup.tsx
git commit -m "Web: Wire up signup page to trpc.auth.register"
git push
```

---

### Task 2: Smoke test in the browser

**Step 1: Start services**

```bash
tilt up
```

Wait for API and web to be ready (ports 4201 and 4200).

**Step 2: Test happy path**

- Open `http://localhost:4200/signup`
- Fill in a valid email and matching password (8+ chars)
- Click "Create account"
- Expected: button shows "Creating account…" briefly, then `console.log('register success', ...)` appears in browser console

**Step 3: Test duplicate email**

- Submit the same email again
- Expected: toast "An account with that email already exists."

**Step 4: Test empty fields**

- Click "Create account" with all fields empty
- Expected: all three inputs show red outline, no network request made

**Step 5: Test password mismatch**

- Fill email + password, enter a different confirm password
- Expected: toast "Passwords do not match.", no network request made
