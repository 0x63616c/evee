import { eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { env } from '../env.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

export type AuthUser = {
  id: string;
  email: string;
  createdAt: Date;
};

type AuthEnv = {
  Variables: {
    user: AuthUser;
  };
};

export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, jwtSecret);
    const userId = payload.sub;
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', user);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
