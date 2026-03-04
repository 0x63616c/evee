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
