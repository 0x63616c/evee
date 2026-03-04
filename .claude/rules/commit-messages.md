# Commit Messages

## Format

```
Subsystem: Short imperative phrase

Body explaining why.
```

- **Subsystem**: Optional but encouraged. Capitalised noun identifying the area of the codebase (e.g. `Docs`, `Engine`, `Meta`, `Web`, `Build`). Pick whatever fits — these are examples only, use your judgement.
- **Subject**: Short imperative phrase (≤72 chars total including prefix). Describes _what_ changed.
- **Body**: Required unless the change is trivially obvious (typo fix, rename, version bump). Explains _why_.

## Rules

1. The subject line is self-evident — don't restate it in the body.
2. The body explains the _motivation_, not the mechanics.
3. Keep the body short: 1–4 sentences is ideal, rarely more.
4. Write in full sentences with proper capitalisation and punctuation.
5. Pull request descriptions are not git history — they won't appear in `git blame`. The commit is the record.

## Good Examples

```
Auth: Fix crash on logout when session has already expired

The session object was accessed after expiry in the logout handler.
Expired sessions now short-circuit before the null dereference.
```

```
API: Increase HTTP client timeouts

The payments API spikes above 8s at P99 under peak load, causing
silent failures at checkout.
```

```
Auth: Skip MFA prompt for SSO users on re-authentication

SSO providers handle their own MFA, so our check was redundant
and caused SSO logins to fail silently after token refresh.
```

```
DB: Rename getUserById to findUserById

Aligns with the find* convention used elsewhere for nullable lookups.
```

```
Build: Bump SDL3 to 3.2.10

3.2.8 has a use-after-free on window close that crashes on macOS 15.
```

## Bad Examples

```
fix bug
```

_No context. What bug? Why did it exist?_

---

```
Renderer: Refactor render loop

Refactored the render loop to improve the code.
```

_Body restates the subject and adds nothing._

---

```
WIP
```

_Never commit this._

---

```
Auth: Add validation

Added validation to the input handler so that invalid inputs are
now validated and rejected with an error when the input is not valid.
```

_Circular. Why is validation needed? What was happening before?_
