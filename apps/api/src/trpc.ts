import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { env } from './env.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

export async function createContext({ req }: { req: Request }) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { user: null };
  }

  try {
    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, jwtSecret);
    const userId = payload.sub;
    if (!userId) return { user: null };

    const [user] = await db
      .select({ id: users.id, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return { user: user ?? null };
  } catch {
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in.',
    });
  }
  return opts.next({
    ctx: { user: opts.ctx.user },
  });
});
