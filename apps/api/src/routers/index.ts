import { Hono } from 'hono';
import { authRouter } from './auth.js';
import { userRouter } from './user.js';

export const apiRouter = new Hono()
  .route('/auth', authRouter)
  .route('/user', userRouter);
