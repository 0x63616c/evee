import type { ErrorComponentProps } from '@tanstack/react-router';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRandomSelectionColour } from '@/lib/use-random-selection-colour';
import { useThemeStore } from '@/stores/theme';

function RootLayout() {
  const { resolvedTheme, setTheme } = useThemeStore();
  useRandomSelectionColour();
  const isDark = resolvedTheme() === 'dark';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 right-0 z-50 p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </header>
      <Outlet />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-base text-muted-foreground">
          This page doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorPage(_: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-base text-muted-foreground">
          An unexpected error occurred.
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});
