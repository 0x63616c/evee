# Requirements

## Current (v0.1 — MVP)

| ID | Requirement | Status |
|----|-------------|--------|
| R1 | Respond to messages in a private Discord server via LLM | Done |
| R2 | Create a new thread for each channel message | Done |
| R3 | Maintain conversation context within threads (up to 100 messages) | Done |
| R4 | Support tool calling — LLM can invoke tools during conversation | Done |
| R5 | Web search tool (DuckDuckGo) | Done |
| R6 | URL fetching tool with content extraction | Done |
| R7 | SSRF protection on URL fetching (block private IPs, non-HTTP schemes) | Done |
| R8 | System prompt editable without restart | Done |
| R9 | Status messages shown in Discord during tool execution | Done |
| R10 | Long responses split at Discord's 2000-char limit | Done |

## Planned

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R11 | SQLite logging of all messages and tool calls | High | Observability, debugging, cost tracking |
| R12 | Thread auto-rename after 3 messages | Medium | LLM-generated summary as thread name |
| R13 | Multi-model routing | Low | Cheap model for simple tasks, smart model for complex |

## Non-Goals

- Multi-server support (private server only)
- User authentication/authorization (trusted environment)
- Web dashboard or admin UI
- Voice channel support
