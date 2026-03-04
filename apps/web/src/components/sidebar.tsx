import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Hash, LogOut, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface SidebarProps {
  channelId: string | undefined;
  threadId: string | undefined;
}

function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export function Sidebar({ channelId, threadId }: SidebarProps) {
  const navigate = useNavigate();
  const { clearToken } = useAuthStore();

  const channelsQuery = useQuery({
    queryKey: ['channels'],
    async queryFn() {
      const res = await api.api.channels.$get();
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
  });

  const threadsQuery = useQuery({
    queryKey: ['threads', channelId],
    enabled: !!channelId,
    async queryFn() {
      const res = await api.api.threads.$get({
        query: { channelId: channelId as string },
      });
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
  });

  function selectChannel(id: string) {
    navigate({
      to: '/dashboard',
      search: { channelId: id },
    });
  }

  function selectThread(id: string) {
    navigate({
      to: '/dashboard',
      search: { channelId: channelId as string, threadId: id },
    });
  }

  function handleLogout() {
    clearToken();
    navigate({ to: '/login' });
  }

  return (
    <div className="flex h-full">
      {/* Channel list */}
      <div className="w-14 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-border">
        {channelsQuery.data?.channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => selectChannel(channel.id)}
            title={channel.name}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
              channel.id === channelId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Hash size={16} />
          </button>
        ))}

        <div className="mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Thread list */}
      <div className="w-[186px] flex flex-col">
        {channelId ? (
          <>
            <div className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {channelsQuery.data?.channels.find((c) => c.id === channelId)
                ?.name ?? 'Threads'}
            </div>
            <ScrollArea className="flex-1">
              {threadsQuery.data?.threads.length === 0 && (
                <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                  No threads yet
                </p>
              )}
              {threadsQuery.data?.threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    thread.id === threadId ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="text-sm truncate">{thread.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 block pl-[22px]">
                    {formatRelativeTime(thread.updatedAt)}
                  </span>
                </button>
              ))}
            </ScrollArea>
          </>
        ) : (
          <p className="px-3 py-6 text-sm text-muted-foreground text-center">
            Select a channel
          </p>
        )}
      </div>
    </div>
  );
}
