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
  max: 10,
  message: 'Too many login attempts, please try again later.',
});

const signupLimiter = rateLimiter({
  windowMs: 60_000,
  max: 3,
  message: 'Too many signup attempts, please try again later.',
});

// Per-email rate limiting to prevent brute-forcing a specific account from many IPs.
// Separate from IP-based limiting because attackers can rotate IPs but not target emails.
const EMAIL_WINDOW_MS = 300_000; // 5 minutes
const EMAIL_MAX_ATTEMPTS = 5;
const emailAttempts = new Map<string, number[]>();

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const timestamps = emailAttempts.get(email) ?? [];
  const recent = timestamps.filter((t) => now - t < EMAIL_WINDOW_MS);

  if (recent.length >= EMAIL_MAX_ATTEMPTS) {
    emailAttempts.set(email, recent);
    return false;
  }

  recent.push(now);
  emailAttempts.set(email, recent);
  return true;
}

// Clean up expired email entries periodically
const emailCleanup = setInterval(() => {
  const now = Date.now();
  for (const [email, timestamps] of emailAttempts) {
    const recent = timestamps.filter((t) => now - t < EMAIL_WINDOW_MS);
    if (recent.length === 0) {
      emailAttempts.delete(email);
    } else {
      emailAttempts.set(email, recent);
    }
  }
}, EMAIL_WINDOW_MS);
if (emailCleanup.unref) emailCleanup.unref();

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

    if (!checkEmailRateLimit(input.email)) {
      return c.json(
        {
          error:
            'Too many login attempts for this account, please try again later.',
        },
        429,
      );
    }

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
