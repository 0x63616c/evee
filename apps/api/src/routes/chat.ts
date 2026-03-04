import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText } from 'ai';
import { asc, eq } from 'drizzle-orm';
import { typeid } from 'typeid-js';
import { z } from 'zod';
import { messages, threads } from '../db/schema.js';
import { withUserScope } from '../db/with-user-scope.js';
import { env } from '../env.js';
import { protectedRouter } from '../lib/protected-router.js';
import { fetchUrl } from '../tools/fetch-url.js';
import { searchWeb } from '../tools/search-web.js';

const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
const systemPromptPath = resolve(
  import.meta.dirname,
  '../../../../prompts/SYSTEM.md',
);
const chatInput = z.object({
  channelId: z.string().min(1),
  threadId: z.string().optional(),
  message: z.string().min(1),
});

type ScopedDb = Parameters<Parameters<typeof withUserScope>[1]>[0];

function saveMessage(
  db: ScopedDb,
  msg: { threadId: string; role: string; content: string; toolCallId?: string },
) {
  return db.insert(messages).values({ id: typeid('msg').toString(), ...msg });
}

async function prepareChat(db: ScopedDb, input: z.infer<typeof chatInput>) {
  const threadId = input.threadId ?? typeid('th').toString();
  const isNewThread = !input.threadId;
  if (isNewThread) {
    await db.insert(threads).values({
      id: threadId,
      channelId: input.channelId,
      name: input.message.slice(0, 50),
    });
  }
  await saveMessage(db, { threadId, role: 'user', content: input.message });
  await db
    .update(threads)
    .set({ updatedAt: new Date() })
    .where(eq(threads.id, threadId));
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt))
    .limit(100);
  const aiMessages = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  return { threadId, aiMessages };
}

export const chatRouter = protectedRouter().post('/', async (c) => {
  const input = chatInput.parse(await c.req.json());
  const userId = c.get('user').id;
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  const { threadId, aiMessages } = await withUserScope(userId, (db) =>
    prepareChat(db, input),
  );

  const result = streamText({
    model: openrouter('deepseek/deepseek-chat'),
    system: systemPrompt,
    messages: aiMessages,
    tools: { search_web: searchWeb, fetch_url: fetchUrl },
    stopWhen: stepCountIs(10),
    onStepFinish: async ({ toolCalls, toolResults }) => {
      if (!toolCalls || toolCalls.length === 0) return;
      await withUserScope(userId, async (db) => {
        for (let i = 0; i < toolCalls.length; i++) {
          const call = toolCalls[i];
          const content = JSON.stringify({
            type: 'tool_call',
            name: call.toolName,
            input: call.input,
            output: toolResults[i]?.output,
          });
          await saveMessage(db, {
            threadId,
            role: 'tool',
            content,
            toolCallId: call.toolCallId,
          });
        }
      });
    },
    onFinish: async ({ text }) => {
      if (!text) return;
      await withUserScope(userId, (db) =>
        saveMessage(db, { threadId, role: 'assistant', content: text }),
      );
    },
  });

  const response = result.toUIMessageStreamResponse();
  const headers = new Headers(response.headers);
  headers.set('X-Thread-Id', threadId);
  return new Response(response.body, { status: response.status, headers });
});
