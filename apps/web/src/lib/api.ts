import { hc } from 'hono/client';
import { useAuthStore } from '@/stores/auth';
import type { AppType } from '../../../api/src/index.ts';

function getHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4201';

export const api = hc<AppType>(API_URL, {
  headers: getHeaders,
});
