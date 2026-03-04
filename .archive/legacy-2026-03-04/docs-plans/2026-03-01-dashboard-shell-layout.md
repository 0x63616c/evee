# Dashboard Shell Layout

## Summary

Add a full-screen shell layout to `_authenticated.tsx` that wraps all authenticated routes.

## Structure

```
┌─────────────────────────────────┐  topbar    h-12 (48px)
├──────────┬──────────────────────┤
│ sidebar  │ main content         │
│ 200px    │ flex-1               │
├──────────┴──────────────────────┤  bottombar h-8 (32px)
└─────────────────────────────────┘
```

## Implementation

- `_authenticated.tsx` wraps `<Outlet />` in the shell
- Outer: `flex flex-col h-screen`
- Topbar: `h-12`
- Middle row: `flex flex-1 overflow-hidden`
  - Sidebar: `w-[200px] shrink-0`
  - Content: `flex-1 overflow-y-auto`
- Bottombar: `h-8`

Placeholder colors used initially to verify layout visually.
