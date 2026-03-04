import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';
import { Chat } from '@/components/chat';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { channelId, threadId } = Route.useSearch();

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

  return <Chat channelId={channelId} threadId={threadId} />;
}
