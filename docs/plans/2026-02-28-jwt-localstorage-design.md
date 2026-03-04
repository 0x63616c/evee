# JWT localStorage Auth — Design

**Date:** 2026-02-28
**Status:** Approved

## Summary

Store the JWT in localStorage via a Zustand `persist` store. Attach it to every tRPC request via `httpBatchLink` headers. Redirect to `/dashboard` after login/signup. Guard authenticated routes with a TanStack Router `beforeLoad` check.

## Components

### Auth store (`apps/web/src/stores/auth.ts`)
Zustand + `persist` middleware (same pattern as `theme.ts`). localStorage key: `twe-auth`.
- `token: string | null`
- `setToken(token: string): void`
- `clearToken(): void`

### tRPC client (`apps/web/src/lib/trpc.ts`)
Add `headers` function to `httpBatchLink` that reads the token from the auth store and sends `Authorization: Bearer <token>` on every request if present.

### Login + Signup
In `onSuccess`: call `setToken(data.token)` then navigate to `/dashboard`.

### Protected layout route (`apps/web/src/routes/_authenticated.tsx`)
TanStack Router layout route. `beforeLoad` checks for token — redirects to `/login` if absent. All authenticated routes are children of this layout.

### Dashboard stub (`apps/web/src/routes/_authenticated/dashboard.tsx`)
Minimal page: heading + logout button. Logout calls `clearToken()` + navigates to `/login`.

### Root redirect (`apps/web/src/routes/index.tsx`)
Already redirects `/` → `/login`. No change needed.

## Out of scope
- Token expiry / refresh
- Server-side logout / token invalidation
- Any real dashboard content
