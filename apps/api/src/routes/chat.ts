import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText } from 'ai';
import { eq } from 'drizzle-orm';
import { typeid } from 'typeid-js';
import { z } from 'zod';
import { db } from '../db/index.js';
import { messages, threads } from '../db/schema.js';
import { env } from '../env.js';
import { protectedRouter } from '../lib/protected-router.js';
import { fetchUrl } from '../tools/fetch-url.js';
import { searchWeb } from '../tools/search-web.js';

const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

const chatInput = z.object({
  channelId: z.string().min(1),
  threadId: z.string().optional(),
  message: z.string().min(1),
});

const systemPromptPath = resolve(
  import.meta.dirname,
  '../../../prompts/SYSTEM.md',
);

export const chatRouter = protectedRouter().post('/', async (c) => {
  const body = await c.req.json();
  const input = chatInput.parse(body);

  // Load system prompt from disk on each call (live-editable)
  const systemPrompt = await readFile(systemPromptPath, 'utf-8');

  // Create thread if none provided
  let threadId = input.threadId;
  if (!threadId) {
    threadId = typeid('th').toString();
    const threadName = input.message.slice(0, 50);
    await db.insert(threads).values({
      id: threadId,
      channelId: input.channelId,
      name: threadName,
    });
  }

  // Save user message
  const userMsgId = typeid('msg').toString();
  await db.insert(messages).values({
    id: userMsgId,
    threadId,
    role: 'user',
    content: input.message,
  });

  // Bump thread updatedAt
  await db
    .update(threads)
    .set({ updatedAt: new Date() })
    .where(eq(threads.id, threadId));

  // Capture threadId for use in callbacks
  const resolvedThreadId = threadId;

  // Stream AI response with tool calling
  const result = streamText({
    model: openrouter('deepseek/deepseek-chat'),
    system: systemPrompt,
    messages: [{ role: 'user', content: input.message }],
    tools: { search_web: searchWeb, fetch_url: fetchUrl },
    stopWhen: stepCountIs(10),
    onStepFinish: async ({ toolCalls, toolResults }) => {
      // Persist tool call and result messages
      if (toolCalls && toolCalls.length > 0) {
        for (let i = 0; i < toolCalls.length; i++) {
          const call = toolCalls[i];
          const result = toolResults[i];

          // Save tool call as a message
          await db.insert(messages).values({
            id: typeid('msg').toString(),
            threadId: resolvedThreadId,
            role: 'tool',
            content: JSON.stringify({
              type: 'tool_call',
              name: call.toolName,
              input: call.input,
              output: result?.output,
            }),
            toolCallId: call.toolCallId,
          });
        }
      }
    },
    onFinish: async ({ text }) => {
      // Save final assistant message after streaming completes
      if (text) {
        const assistantMsgId = typeid('msg').toString();
        await db.insert(messages).values({
          id: assistantMsgId,
          threadId: resolvedThreadId,
          role: 'assistant',
          content: text,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
});
