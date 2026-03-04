import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';
import { Chat } from '@/components/chat';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { channelId, threadId } = Route.useSearch();
  const queryClient = useQueryClient();

  if (!channelId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <MessageSquare size={32} className="mx-auto" />
          <p className="text-sm">Select a channel to get started</p>
        </div>
      </div>
    );
  }

  // Look up thread name from the cached threads query
  const threadsData = queryClient.getQueryData<{
    threads: Array<{ id: string; name: string }>;
  }>(['threads', channelId]);
  const threadName = threadsData?.threads.find((t) => t.id === threadId)?.name;

  return (
    <Chat channelId={channelId} threadId={threadId} threadName={threadName} />
  );
}
