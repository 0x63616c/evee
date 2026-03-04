import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

// Token is stored in localStorage. This is intentional — httpOnly cookies
// would be more XSS-resistant but require server-side cookie handling.
// Upgrade path: move to httpOnly cookie + email verification flow later.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: 'twe-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
