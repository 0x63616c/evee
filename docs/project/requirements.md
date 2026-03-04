# Requirements

<!-- SCOPE: Functional requirements only. No implementation details, no NFRs. -->

## Current (v0.2 -- TypeScript Web App)

| ID | Requirement | Status | Epic |
|----|-------------|--------|------|
| R1 | User can send a message and receive a streaming AI response via web UI | Done | Epic 4 |
| R2 | Conversations organised as Channels -> Threads -> Messages | Done | Epic 4 |
| R3 | Channels are pre-defined (seeded); user cannot create/delete channels | Done | Epic 4 |
| R4 | New message in a channel creates a new thread | Done | Epic 4 |
| R5 | User can view and continue past threads | Done | Epic 4 |
| R6 | LLM can invoke tools (web search, URL fetch) during conversation | Done | Epic 4 |
| R7 | Tool call status shown in UI during execution | Done | Epic 4 |
| R8 | SSRF protection on URL fetch tool (block private IPs, non-HTTP) | Done | Epic 4 |
| R9 | System prompt loaded from disk on each LLM call (live-editable) | Done | Epic 4 |
| R10 | Auth required to access the app (single user, JWT) | Done | Epic 4 |
| R11 | Thread name auto-set from first user message | Done | Epic 4 |
| R12 | Assistant messages rendered as markdown | Done | Epic 4 |

## Planned

| ID | Requirement | Priority | Epic | Notes |
|----|-------------|----------|------|-------|
| R13 | Deploy to production (Hetzner VPS + Kamal) | High | Epic 5 | In progress -- VPS provisioned, Kamal configured |
| R14 | Temporal workflow for durable chat execution | High | Epic 1 | Automatic retries, replay, debugging |
| R15 | Multi-model routing | Low | -- | Cheap model for simple tasks, smart for complex |
| R16 | Auto-download videos from watched playlists | Medium | -- | Background job, yt-dlp |

## Non-Goals

- Multi-user support (single user -- personal assistant for Cal only)
- Mobile app
- Voice input
- Discord bot (retired -- replaced by web UI)
- Web dashboard or admin UI beyond the chat interface
