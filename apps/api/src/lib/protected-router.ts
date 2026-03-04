import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

type ProtectedEnv = {
  Variables: {
    user: AuthUser;
  };
};

export const protectedRouter = () =>
  new Hono<ProtectedEnv>().use('*', authMiddleware);
