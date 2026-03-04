import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import { useAuthStore } from '@/stores/auth';
import type { AppRouter } from '../../../api/src/routers/index.ts';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL as string,
      headers() {
        const token = useAuthStore.getState().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
