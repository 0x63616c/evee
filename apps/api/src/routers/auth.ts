import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { typeid } from 'typeid-js';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { env } from '../env.js';
import { rateLimiter } from '../middleware/rate-limit.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

const authInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginLimiter = rateLimiter({
  windowMs: 60_000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
});

const signupLimiter = rateLimiter({
  windowMs: 60_000,
  max: 3,
  message: 'Too many signup attempts, please try again later.',
});

export const authRouter = new Hono()
  .post('/signup', signupLimiter, async (c) => {
    if (!env.SIGNUP_ENABLED) {
      return c.json({ error: 'Signup is currently disabled.' }, 403);
    }

    const body = await c.req.json();
    const input = authInput.parse(body);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: 'Email already registered.' }, 409);
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

    return c.json({ token });
  })
  .post('/login', loginLimiter, async (c) => {
    const body = await c.req.json();
    const input = authInput.parse(body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Invalid email or password.' }, 401);
    }

    const valid = await Bun.password.verify(input.password, user.passwordHash);
    if (!valid) {
      return c.json({ error: 'Invalid email or password.' }, 401);
    }

    const token = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(jwtSecret);

    return c.json({ token });
  });
