import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { typeid } from 'typeid-js';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { env } from '../env.js';
import { publicProcedure, router } from '../trpc.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

const authInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = router({
  register: publicProcedure.input(authInput).mutation(async ({ input }) => {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Email already registered.',
      });
    }

    const id = typeid('user').toString();
    const passwordHash = await Bun.password.hash(input.password);

    await db.insert(users).values({
      id,
      email: input.email,
      passwordHash,
    });

    const token = await new SignJWT({ sub: id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(jwtSecret);

    return { token };
  }),

  login: publicProcedure.input(authInput).mutation(async ({ input }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    const valid = await Bun.password.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    const token = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(jwtSecret);

    return { token };
  }),
});
