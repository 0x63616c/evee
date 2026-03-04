# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Evee is a personal AI assistant Discord bot. She listens to messages in a private Discord server, creates threads for each conversation, and replies using Claude via a local API proxy.

## Commands

```bash
# Run the bot (auto-starts proxy if not running)
uv run python evee.py

# Start the proxy manually
proxy  # alias for: node ~/code/github.com/atalovesyou/claude-max-api-proxy/dist/server/standalone.js

# Check proxy health
curl http://localhost:3456/health
```

## Architecture

Single-file bot (`evee.py`) with three layers:

1. **Proxy management** — auto-starts claude-max-api-proxy on localhost:3456 if not running, kills it on shutdown. Logs to `~/.local/log/claude-proxy.log`.
2. **LLM client** — OpenAI Python client pointed at the local proxy. Model: `claude-sonnet-4`. System prompt loaded fresh from `prompts/SYSTEM.md` each call.
3. **Discord bot** — discord.py Client. Channel messages create a new thread (timestamped name). Thread messages fetch history and send full conversation to LLM. Responses over 2000 chars are split.

## Key Design Decisions

- Uses claude-max-api-proxy (OpenAI-compatible) to route through Claude Max subscription instead of paying per-token API costs
- System prompt is read from disk on every LLM call so edits take effect without restarting
- No debounce/queueing on messages — rapid-fire messages may cause multiple responses (intentional MVP trade-off)
- Thread history capped at 100 messages per request
- The sync `openai` client call is wrapped in `asyncio.to_thread()` to avoid blocking the Discord event loop

## Config

- `.env` — secrets (DISCORD_BOT_TOKEN). See `.env.example` for required vars.
- `prompts/SYSTEM.md` — evee's personality/instructions (editable without restart)

## Future Plans

- SQLite logging of all messages and tool calls
- Web search and other tools/skills
- Thread auto-rename after 3 messages (LLM-generated summary)
- Multi-model routing (cheap model for simple tasks, smart model for complex ones)
