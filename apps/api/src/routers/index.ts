import { Hono } from 'hono';
import { authRouter } from './auth.js';
import { channelsRouter } from './channels.js';
import { messagesRouter } from './messages.js';
import { threadsRouter } from './threads.js';
import { userRouter } from './user.js';

export const apiRouter = new Hono()
  .route('/auth', authRouter)
  .route('/user', userRouter)
  .route('/channels', channelsRouter)
  .route('/threads', threadsRouter)
  .route('/messages', messagesRouter);
