import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar } from '@/components/sidebar';
import { useAuthStore } from '@/stores/auth';

interface SearchParams {
  channelId?: string;
  threadId?: string;
}

export const Route = createFileRoute('/_authenticated')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    channelId:
      typeof search.channelId === 'string' ? search.channelId : undefined,
    threadId: typeof search.threadId === 'string' ? search.threadId : undefined,
  }),
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppShell,
});

function AppShell() {
  const { channelId, threadId } = Route.useSearch();

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <header className="h-12 shrink-0 bg-card border-b border-border flex items-center px-4">
        <span className="font-bold text-lg tracking-tight select-none">
          evee
        </span>
      </header>

      {/* Middle row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-[200px] shrink-0 bg-card border-r border-border">
          <Sidebar channelId={channelId} threadId={threadId} />
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-[2304px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
