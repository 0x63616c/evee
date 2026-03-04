# Evee

Personal AI assistant — chat interface with web search, URL fetching, and conversation history.

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)
- [Tilt](https://tilt.dev)
- [lefthook](https://github.com/evilmartians/lefthook)

### Getting started

```bash
lefthook install            # wire up git hooks (once, after cloning)
bash scripts/decrypt-secrets.sh  # decrypt .env from .env.enc (see Secrets below)
tilt up                     # start Postgres, run migrations, API (4201) + web (4200)
```

Open `http://localhost:4200`.

### Secrets

`.env` at the repo root is encrypted with [SOPS](https://github.com/getsecurity/sops) + [age](https://github.com/FiloSottile/age) and committed as `.env.enc`. The plaintext `.env` is gitignored.

**First-time setup (new machine):**

1. Retrieve the `evee age private key` Secure Note from 1Password
2. Save the full contents to `~/.config/sops/age/keys.txt`
3. Run: `bash scripts/decrypt-secrets.sh`

**Updating a secret:**

Edit the plaintext `.env`, then re-encrypt and commit:

```bash
sops -e .env > .env.enc
git add .env.enc && git commit
```

### Git hooks

Pre-commit runs Biome (lint + format) on staged files automatically via Lefthook.

## Deployment

Hosted on a Hetzner VPS running [Coolify](https://coolify.io). Push to `main` → auto-deploy.

### Provision a new VPS

```bash
ssh root@<IP> 'bash -s' < scripts/setup-vps.sh
```

Installs ufw firewall, fail2ban, SSH hardening, and Coolify. Port 8000 (Coolify UI) is firewalled — access it via SSH tunnel:

```bash
bash scripts/coolify-tunnel.sh        # then open http://localhost:8000
```

### Services

| Service | Domain | Port |
|---------|--------|------|
| Web (React/Vite) | evee.worldwidewebb.co | 80/443 |
| API (Hono/Bun) | api.worldwidewebb.co | 80/443 |
| Postgres | internal | — |
