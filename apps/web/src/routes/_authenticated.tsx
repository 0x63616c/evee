import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppShell,
});

function AppShell() {
  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <header className="h-16 shrink-0 bg-card border-b border-border flex items-center px-4">
        <span className="font-bold text-lg tracking-tight select-none">
          The Workflow Engine
        </span>
      </header>

      {/* Middle row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-[200px] shrink-0 bg-card border-r border-border" />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-[2304px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottombar */}
      <footer className="h-8 shrink-0 bg-card border-t border-border" />
    </div>
  );
}
