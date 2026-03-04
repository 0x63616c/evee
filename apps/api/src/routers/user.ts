import { protectedRouter } from '../lib/protected-router.js';

export const userRouter = protectedRouter().get('/me', (c) => {
  const user = c.get('user');
  return c.json({ user });
});
