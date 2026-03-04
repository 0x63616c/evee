import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { TRPCClientError } from '@trpc/client';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from './components/ui/sonner';
import { trpc, trpcClient } from './lib/trpc';
import { routeTree } from './routeTree.gen';
import { initTheme } from './stores/theme';
import './index.css';

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        // Only retry true network failures — when error.data is absent the
        // request never reached the server (no tRPC error shape returned).
        return error instanceof TRPCClientError && !error.data;
      },
    },
  },
});
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// biome-ignore lint/style/noNonNullAssertion: root element is guaranteed by index.html
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </QueryClientProvider>
      </trpc.Provider>
    </StrictMode>,
  );
}
