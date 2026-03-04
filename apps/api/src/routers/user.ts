import { protectedProcedure, router } from '../trpc.js';

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
