# ── Infrastructure ────────────────────────────────────────────────────────────

docker_compose('./docker-compose.yml')

# ── Database ──────────────────────────────────────────────────────────────────

local_resource(
  'db-migrate',
  cmd='cd apps/api && bunx drizzle-kit migrate',
  resource_deps=['postgres'],
  labels=['infra'],
)

db_reset_cmd = ' && '.join([
  'docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS evee WITH (FORCE);"',
  'docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE evee;"',
  'cd apps/api && bunx drizzle-kit migrate',
])

local_resource(
  'db-reset',
  cmd=db_reset_cmd,
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  resource_deps=['postgres'],
  labels=['infra'],
)

# ── Backend ───────────────────────────────────────────────────────────────────

local_resource(
  'api',
  serve_cmd='cd apps/api && bun run dev',
  deps=['apps/api/src', 'apps/api/package.json'],
  resource_deps=['db-migrate'],
  readiness_probe=probe(
    http_get=http_get_action(port=4201, path='/healthz'),
    period_secs=5,
    failure_threshold=10,
  ),
  labels=['backend'],
  links=[link('http://localhost:4201', 'API')],
)

# ── Frontend ──────────────────────────────────────────────────────────────────

local_resource(
  'web',
  serve_cmd='cd apps/web && bun run dev -- --port 4200',
  deps=['apps/web/src', 'apps/web/package.json'],
  resource_deps=['api'],
  readiness_probe=probe(
    tcp_socket=tcp_socket_action(port=4200),
    period_secs=5,
    failure_threshold=10,
  ),
  labels=['frontend'],
  links=[link('http://localhost:4200', 'Web')],
)
