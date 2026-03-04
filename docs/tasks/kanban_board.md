# Kanban Board

## Linear Configuration

| Setting | Value |
|---------|-------|
| Team | Evee |
| Team ID | `e06f3241-8116-4a33-ad74-1773a49d754d` |
| Team Key | `EVE` |

## Epics Overview

### Active

| Epic | Linear Project | Status | Priority |
|------|---------------|--------|----------|
| [Epic 5: Hetzner VPS + Kamal Infrastructure](https://linear.app/evee/project/epic-5-hetzner-vps-coolify-infrastructure) | 6f591198 | In Progress | High |
| [Epic 4: Custom Web Chat UI](https://linear.app/evee/project/epic-4-custom-web-chat-ui-047c175b8da1) | 6bcfe217 | Done | High |
| [Epic 1: Evee Core Improvements](https://linear.app/evee/project/epic-1-temporal-workflow-rewrite-388461faf1cd) | 539b3e48 | Planned | High |
| [Epic 2: SQLite Logging](https://linear.app/evee/project/epic-2-sqlite-logging-62a5c8041277) | 1064daed | Planned | High |

> **Note:** Epic 3 (Discord Log Streaming) is superseded -- Discord is retired. Should be archived.

## Backlog

### Epic 5: Hetzner VPS + Kamal Infrastructure

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| [EVE-17](https://linear.app/evee/issue/EVE-17) | Configure DNS for worldwidewebb.co subdomains | Urgent | Backlog |
| [EVE-20](https://linear.app/evee/issue/EVE-20) | Deploy evee with Kamal | Urgent | Backlog |
| [EVE-21](https://linear.app/evee/issue/EVE-21) | VPS security hardening | High | Backlog |

### Other

| Issue | Title | Priority | Status | Epic |
|-------|-------|----------|--------|------|
| [EVE-23](https://linear.app/evee/issue/EVE-23) | Re-setup SOPS + age secrets encryption | Low | Backlog | -- |
| [EVE-15](https://linear.app/evee/issue/EVE-15) | Define and implement backup strategy | Medium | Backlog | -- |
| [EVE-14](https://linear.app/evee/issue/EVE-14) | Auto-download videos from watched playlists | Medium | Backlog | -- |
| [EVE-5](https://linear.app/evee/issue/EVE-5) | Improve chat reliability and durability | High | Backlog | Epic 1 |

## Completed

| Issue | Title | Epic |
|-------|-------|------|
| EVE-9 | Replace tRPC with Hono RPC + protectedRouter | Epic 4 |
| EVE-10 | Channels, threads and messages -- data model + sidebar | Epic 4 |
| EVE-11 | Core chat -- streaming AI response | Epic 4 |
| EVE-12 | Tool calling -- web search and URL fetch | Epic 4 |
| EVE-13 | Thread continuity | Epic 4 |
| EVE-16 | Provision Hetzner CPX41 server | Epic 5 |
| EVE-18 | Set up deployment infrastructure | Epic 5 |
| EVE-19 | Write Dockerfiles for evee API and web | Epic 5 |
| EVE-8 | Remove claude-max-api-proxy references | -- |
| EVE-6 | Set up OpenRouter as LLM provider | -- |
| EVE-7 | Add git pre-commit hook | -- |
