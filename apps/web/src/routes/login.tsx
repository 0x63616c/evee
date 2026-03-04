import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { TRPCClientError } from '@trpc/client';
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
      if (error instanceof TRPCClientError && !error.data) {
        toast.error(
          'Connection error. Please check your network and try again.',
        );
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
