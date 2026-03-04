# The Workflow Engine

Coming Soon, find out more at [theworkflowengine.com](https://theworkflowengine.com)

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)
- [Tilt](https://tilt.dev)
- [lefthook](https://github.com/evilmartians/lefthook)

### Getting started

```bash
lefthook install   # wire up git hooks (once, after cloning)
tilt up            # start Postgres, run migrations, API (4201) + web (4200)
```

### Git hooks

Pre-commit runs Biome (lint + format) on staged files automatically. No extra steps needed after `lefthook install`.

### Secrets

`.env` files are encrypted with [SOPS](https://github.com/getsecurity/sops) + [age](https://github.com/FiloSottile/age) and committed as `.env.enc`. The plaintext `.env` files are gitignored.

**First-time setup (new machine):**

1. Retrieve the `evee age private key` Secure Note from 1Password
2. Save the full contents to `~/.config/sops/age/keys.txt`
3. Decrypt:

```bash
bash scripts/decrypt-secrets.sh
```

**Updating a secret:**

Edit the plaintext `.env`, then re-encrypt:

```bash
sops -e .env > .env.enc
sops -e apps/api/.env > apps/api/.env.enc
```

Commit the updated `.env.enc` file.

**What to save in 1Password:**

Save the full contents of `~/.config/sops/age/keys.txt` as a Secure Note titled `evee age private key`. It contains the private key (`AGE-SECRET-KEY-1...`) needed to decrypt all secrets. Without it, the `.env.enc` files are unrecoverable.
