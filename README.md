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

- `.kamal/secrets` — local secrets for manual Kamal deploys (gitignored)
- GitHub repo secrets — used by CI deploy jobs
- Never commit plaintext secrets

### Git hooks

Pre-commit runs Biome (lint + format) on staged files automatically via Lefthook.

## Deployment

Hosted on a Hetzner VPS, deployed with [Kamal](https://kamal-deploy.org). Push to `main` → CI auto-deploys.

```bash
kamal setup -c config/deploy.api.yml    # First-time: install proxy, boot postgres, deploy API
kamal setup -c config/deploy.web.yml    # First-time: deploy web
kamal deploy -c config/deploy.api.yml   # Subsequent deploys (API)
kamal deploy -c config/deploy.web.yml   # Subsequent deploys (Web)
```

### Provision a new VPS

```bash
ssh root@<IP> 'bash -s' < scripts/setup-vps.sh
```

Installs ufw firewall, fail2ban, and SSH hardening.

### Services

| Service | Domain | Port |
|---------|--------|------|
| Web (React/Vite) | evee.worldwidewebb.co | 80/443 |
| API (Hono/Bun) | api.worldwidewebb.co | 80/443 |
| Postgres | internal | — |
