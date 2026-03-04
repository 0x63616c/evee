# Web App Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold `apps/web` with Vite + React + TypeScript + TanStack Router + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + Vitest + Biome.

**Architecture:** Single-page app (SPA) living in `apps/web/`. All config files stay inside the app directory except `biome.json` which goes at the repo root for monorepo-wide consistency. Bun is the package manager. TanStack Router provides file-based routing.

**Tech Stack:** Vite, React 19, TypeScript, TanStack Router, TanStack Query, Zustand, Tailwind CSS v4, shadcn/ui, Vitest, Biome

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `apps/web/` (via `bun create vite`)

**Step 1: Create the Vite project**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
bun create vite apps/web --template react-ts
```

**Step 2: Install dependencies**

```bash
cd apps/web
bun install
```

**Step 3: Verify it works**

```bash
bun run dev
```

Expected: Dev server starts on localhost. Kill it after confirming.

**Step 4: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Scaffold Vite + React + TypeScript app

Bootstrapped with bun create vite using the react-ts template."
```

---

### Task 2: Set up Biome at repo root

**Files:**
- Create: `biome.json` (repo root)

**Step 1: Install Biome as a dev dependency in apps/web**

```bash
cd apps/web
bun add -d @biomejs/biome
```

**Step 2: Create `biome.json` at repo root**

Write the following to `/Users/calum/code/github.com/0x63616c/the-workflow-engine/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.2/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "json": {
    "formatter": {
      "indentStyle": "space",
      "indentWidth": 2
    }
  }
}
```

**Step 3: Add format and lint scripts to `apps/web/package.json`**

Add to `scripts`:

```json
"lint": "biome check --config-path=../../ .",
"lint:fix": "biome check --config-path=../../ --write .",
"format": "biome format --config-path=../../ --write ."
```

**Step 4: Run Biome to verify and auto-fix the scaffolded code**

```bash
cd apps/web
bun run lint:fix
```

Expected: Biome reformats the scaffolded files to match our config (single quotes, etc.).

**Step 5: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add biome.json apps/web/package.json apps/web/src apps/web/index.html
git commit -m "Build: Add Biome for linting and formatting

Single config at repo root for monorepo-wide consistency.
Scripts in apps/web reference it via --config-path."
```

---

### Task 3: Set up Tailwind CSS v4

**Files:**
- Modify: `apps/web/package.json` (new deps)
- Modify: `apps/web/vite.config.ts` (add tailwind plugin)
- Modify: `apps/web/src/index.css` (replace with tailwind import)

**Step 1: Install Tailwind CSS and Vite plugin**

```bash
cd apps/web
bun add tailwindcss @tailwindcss/vite
```

**Step 2: Update `apps/web/vite.config.ts`**

```typescript
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Replace `apps/web/src/index.css` contents**

```css
@import "tailwindcss";
```

**Step 4: Remove `apps/web/src/App.css`**

Delete it — we won't use CSS modules.

**Step 5: Update `apps/web/src/App.tsx` to use Tailwind classes**

```tsx
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">The Workflow Engine</h1>
    </div>
  );
}

export default App;
```

**Step 6: Verify Tailwind works**

```bash
bun run dev
```

Expected: "The Workflow Engine" centered on screen in bold text.

**Step 7: Run lint fix**

```bash
bun run lint:fix
```

**Step 8: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Add Tailwind CSS v4

Using the @tailwindcss/vite plugin. Path alias @ configured
for clean imports."
```

---

### Task 4: Set up TypeScript path aliases

**Files:**
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/tsconfig.app.json`

**Step 1: Add path aliases to `apps/web/tsconfig.json`**

Add `compilerOptions` with `baseUrl` and `paths`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 2: Add path aliases to `apps/web/tsconfig.app.json`**

Add to `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

**Step 3: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web/tsconfig.json apps/web/tsconfig.app.json
git commit -m "Web: Configure TypeScript path aliases

Adds @/* alias pointing to src/* for cleaner imports."
```

---

### Task 5: Set up shadcn/ui

**Files:**
- Create: `apps/web/components.json`
- Modify: `apps/web/src/index.css` (shadcn theme variables)
- Create: `apps/web/src/lib/utils.ts`

**Step 1: Run shadcn init inside apps/web**

```bash
cd apps/web
bunx shadcn@latest init
```

When prompted, select defaults. This creates `components.json` and adds the `cn` utility.

**Step 2: Verify `components.json` was created**

Check that `apps/web/components.json` exists and has `rsc: false` (since we're not using server components).

**Step 3: Add a test component to verify it works**

```bash
cd apps/web
bunx shadcn@latest add button
```

**Step 4: Update `apps/web/src/App.tsx` to use the Button**

```tsx
import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">The Workflow Engine</h1>
      <Button>Get Started</Button>
    </div>
  );
}

export default App;
```

**Step 5: Verify it works**

```bash
bun run dev
```

Expected: Page shows heading + styled button.

**Step 6: Run lint fix**

```bash
bun run lint:fix
```

**Step 7: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Add shadcn/ui with Button component

Initialized shadcn/ui with Tailwind CSS styling. Added Button
as a smoke test for the component library."
```

---

### Task 6: Set up TanStack Router (file-based routing)

**Files:**
- Modify: `apps/web/package.json` (new deps)
- Modify: `apps/web/vite.config.ts` (add router plugin)
- Modify: `apps/web/src/main.tsx` (router provider)
- Create: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Delete: `apps/web/src/App.tsx` (replaced by routes)

**Step 1: Install TanStack Router**

```bash
cd apps/web
bun add @tanstack/react-router
bun add -d @tanstack/router-plugin
```

**Step 2: Update `apps/web/vite.config.ts`**

```typescript
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Create `apps/web/src/routes/__root.tsx`**

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => <Outlet />,
});
```

**Step 4: Create `apps/web/src/routes/index.tsx`**

Move the App content here:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">The Workflow Engine</h1>
      <Button>Get Started</Button>
    </div>
  );
}
```

**Step 5: Update `apps/web/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
```

**Step 6: Delete `apps/web/src/App.tsx`**

No longer needed — routes replace it.

**Step 7: Verify routing works**

```bash
bun run dev
```

Expected: Same page as before, but now powered by TanStack Router.

**Step 8: Run lint fix**

```bash
bun run lint:fix
```

**Step 9: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Add TanStack Router with file-based routing

Using the Vite plugin for automatic route generation with
code splitting enabled."
```

---

### Task 7: Set up TanStack Query + Zustand

**Files:**
- Modify: `apps/web/package.json` (new deps)
- Modify: `apps/web/src/main.tsx` (wrap in QueryClientProvider)

**Step 1: Install TanStack Query and Zustand**

```bash
cd apps/web
bun add @tanstack/react-query zustand
```

**Step 2: Update `apps/web/src/main.tsx`**

Wrap the app in `QueryClientProvider`:

```tsx
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';

const queryClient = new QueryClient();
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
```

**Step 3: Run lint fix**

```bash
bun run lint:fix
```

**Step 4: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Add TanStack Query and Zustand

Query client provider wraps the app. Zustand installed and
ready for client-side state when needed."
```

---

### Task 8: Set up Vitest

**Files:**
- Modify: `apps/web/package.json` (new deps + test script)
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/__tests__/smoke.test.tsx`

**Step 1: Install Vitest and testing utilities**

```bash
cd apps/web
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Create `apps/web/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Add test script to `apps/web/package.json`**

Add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Write a smoke test**

Create `apps/web/src/__tests__/smoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';

describe('smoke test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

**Step 5: Run tests**

```bash
cd apps/web
bun run test
```

Expected: 1 test passes.

**Step 6: Run lint fix**

```bash
bun run lint:fix
```

**Step 7: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Add Vitest for testing

Configured with jsdom environment and path aliases.
Smoke test verifies the setup works."
```

---

### Task 9: Clean up scaffolded files

**Files:**
- Delete: `apps/web/src/assets/react.svg`
- Delete: `apps/web/public/vite.svg`
- Modify: `apps/web/index.html` (update title)

**Step 1: Remove unused assets**

Delete `apps/web/src/assets/react.svg` and `apps/web/public/vite.svg`.

**Step 2: Update `apps/web/index.html`**

Change `<title>` to "The Workflow Engine".
Remove the Vite favicon link.

**Step 3: Run lint fix**

```bash
cd apps/web
bun run lint:fix
```

**Step 4: Verify everything still works**

```bash
bun run dev
bun run test
```

**Step 5: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add apps/web
git commit -m "Web: Clean up scaffolded boilerplate

Remove Vite/React default assets and update page title."
```

---

### Task 10: Update CLAUDE.md with project conventions

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add web app conventions to CLAUDE.md**

Add the tech stack, directory structure, and common commands so future sessions know how to work with this project.

**Step 2: Commit**

```bash
cd /Users/calum/code/github.com/0x63616c/the-workflow-engine
git add CLAUDE.md
git commit -m "Meta: Add project conventions to CLAUDE.md

Documents the tech stack, directory structure, and common
commands for the web app."
```
