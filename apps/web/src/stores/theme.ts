import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function applyTheme(theme: Theme) {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      resolvedTheme: () => {
        const { theme } = get();
        return theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      },
    }),
    { name: 'twe-theme' },
  ),
);

// Apply theme on load (before first render flash)
export function initTheme() {
  const stored = localStorage.getItem('twe-theme');
  let theme: Theme = 'system';
  try {
    theme = JSON.parse(stored ?? '{}')?.state?.theme ?? 'system';
  } catch {}
  applyTheme(theme);
}
