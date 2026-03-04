import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import {
  AssistantChatTransport,
  useChatRuntime,
} from '@assistant-ui/react-ai-sdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { useRef } from 'react';
import { FetchUrlUI, SearchWebUI } from '@/components/tool-ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface ChatProps {
  channelId: string;
  threadId?: string;
  threadName?: string;
}

export function Chat({ channelId, threadId, threadName }: ChatProps) {
  const queryClient = useQueryClient();
  const channelIdRef = useRef(channelId);
  const threadIdRef = useRef(threadId);
  channelIdRef.current = channelId;
  threadIdRef.current = threadId;

  const historyQuery = useQuery({
    queryKey: ['messages', threadId],
    enabled: !!threadId,
    async queryFn() {
      const res = await api.api.messages.$get({
        query: { threadId: threadId as string },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const initialMessages: UIMessage[] =
    historyQuery.data?.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
        createdAt: new Date(m.createdAt),
      })) ?? [];

  // Wait for history to load before rendering chat for existing threads
  if (threadId && historyQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Loading conversation...</p>
      </div>
    );
  }

  return (
    <ChatRuntime
      key={threadId ?? 'new'}
      channelId={channelId}
      threadId={threadId}
      threadName={threadName}
      initialMessages={initialMessages}
      onFinish={() => {
        queryClient.invalidateQueries({ queryKey: ['threads'] });
      }}
    />
  );
}

interface ChatRuntimeProps {
  channelId: string;
  threadId?: string;
  threadName?: string;
  initialMessages: UIMessage[];
  onFinish: () => void;
}

function ChatRuntime({
  channelId,
  threadId,
  threadName,
  initialMessages,
  onFinish,
}: ChatRuntimeProps) {
  const channelIdRef = useRef(channelId);
  const threadIdRef = useRef(threadId);
  channelIdRef.current = channelId;
  threadIdRef.current = threadId;

  const runtime = useChatRuntime({
    messages: initialMessages,
    transport: new AssistantChatTransport({
      api: 'http://localhost:4201/api/chat',
      headers: (): Record<string, string> => {
        const token = useAuthStore.getState().token;
        if (token) return { Authorization: `Bearer ${token}` };
        return {};
      },
      prepareSendMessagesRequest: async (options) => {
        const lastMessage = options.messages[options.messages.length - 1];
        const textPart = lastMessage?.parts?.find((p) => p.type === 'text');
        const messageText = textPart && 'text' in textPart ? textPart.text : '';

        return {
          ...options,
          body: {
            channelId: channelIdRef.current,
            threadId: threadIdRef.current,
            message: messageText,
          },
        };
      },
    }),
    onFinish,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SearchWebUI />
      <FetchUrlUI />
      <div className="flex h-full flex-col">
        {threadName && (
          <div className="shrink-0 border-b border-border px-4 py-2">
            <h2 className="text-sm font-medium truncate">{threadName}</h2>
          </div>
        )}
        <ThreadPrimitive.Root className="flex flex-1 flex-col">
          <ThreadPrimitive.Viewport className="flex flex-1 flex-col items-center overflow-y-auto scroll-smooth px-4 pt-8">
            <div className="w-full max-w-2xl">
              <ThreadPrimitive.Messages
                components={{
                  UserMessage,
                  AssistantMessage,
                }}
              />
            </div>
          </ThreadPrimitive.Viewport>

          <div className="sticky bottom-0 w-full bg-background px-4 pb-4">
            <div className="mx-auto max-w-2xl">
              <ComposerPrimitive.Root className="flex items-end gap-2 rounded-lg border border-border bg-card p-3">
                <ComposerPrimitive.Input
                  placeholder="Message evee..."
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <ComposerPrimitive.Send className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                  Send
                </ComposerPrimitive.Send>
              </ComposerPrimitive.Root>
            </div>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

function UserMessage() {
  return (
    <div className="flex justify-end py-2">
      <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        <MessagePrimitive.Content />
      </div>
    </div>
  );
}

function AssistantMessage() {
  return (
    <div className="flex justify-start py-2">
      <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm">
        <MessagePrimitive.Content />
      </div>
    </div>
  );
}
