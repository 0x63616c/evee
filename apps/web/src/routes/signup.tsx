import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { FieldInput } from '@/components/ui/field';
import { api } from '@/lib/api';
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

  const register = useMutation({
    async mutationFn(input: { email: string; password: string }) {
      const res = await api.api.auth.signup.$post({ json: input });
      if (!res.ok) {
        throw new Error('Something went wrong. Please try again.');
      }
      return await res.json();
    },
    onSuccess(data) {
      setToken(data.token);
      navigate({ to: '/dashboard' });
    },
    onError(error) {
      toast.error(error.message);
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
