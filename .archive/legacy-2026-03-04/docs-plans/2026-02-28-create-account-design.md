# Create Account Page — Design

**Date:** 2026-02-28
**Route:** `/signup`
**Status:** Approved

## Summary

Wire up the existing `/signup` shell to `trpc.auth.register`. No backend changes required — the `auth.register` procedure is already fully implemented. The page mirrors the login page's patterns exactly.

## Fields

- Email address (`type="text"`, not `type="email"` — no browser validation)
- Password (`type="password"`)
- Confirm password (`type="password"`)

## Behaviour

### State

- `email`, `password`, `confirmPassword` — controlled inputs
- `submitted` — boolean, set on form submit; gates `aria-invalid` display

### Validation (client-side only)

1. Empty field check — if any field is empty after submit, set `submitted = true` and return early; inputs show red outline via `aria-invalid`
2. Password match check — if `password !== confirmPassword`, show toast error ("Passwords do not match.") and return early

### tRPC

- `trpc.auth.register.useMutation()`
- **onSuccess**: `console.log` the token (JWT storage deferred)
- **onError**: toast "An account with that email already exists." for `CONFLICT` code; generic "Something went wrong." fallback for other errors
- Button disabled + label "Creating account…" while `isPending`

## Fixes to existing shell

- `type="email"` → `type="text"` on email field
- Add `onSubmit` handler to `<form>`
- Wire all inputs to controlled state
- Add `aria-invalid` to each field

## Out of scope

- Name field (email + password only)
- JWT storage / post-signup redirect (handled in a later session)
- Backend changes
