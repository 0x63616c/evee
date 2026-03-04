# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Evee is a personal AI assistant Discord bot. She listens to messages in a private Discord server, creates threads for each conversation, and replies using an LLM via OpenRouter.

## Commands

```bash
# Run the bot
uv run python evee.py
```

## Logs

- Bot logs: `~/.local/log/evee.log`

## Architecture

- `evee.py` — main bot file. Discord event handling, LLM chat loop with tool calling, thread management.
- `tools/` — tool registry and individual tools
  - `__init__.py` — decorator-based registry, auto-discovers tool modules
  - `search_web.py` — DuckDuckGo web search
  - `fetch_url.py` — URL fetching with trafilatura content extraction + SSRF protection
- `prompts/SYSTEM.md` — evee's personality/instructions (editable without restart)

## Key Design Decisions

- Uses OpenRouter API (OpenAI-compatible) with DeepSeek V3 as default model
- System prompt is read from disk on every LLM call so edits take effect without restarting
- Current date/time injected into system prompt automatically
- Tool calling via async loop — Claude/DeepSeek decides when to use tools
- Status messages sent to Discord during tool execution (e.g. "searching: ...")
- No debounce/queueing on messages — rapid-fire messages may cause multiple responses (intentional MVP trade-off)
- Thread history capped at 100 messages per request
- The sync `openai` client call is wrapped in `asyncio.to_thread()` to avoid blocking the Discord event loop
- Tool names use verb_noun snake_case convention (e.g. `search_web`, `fetch_url`)

## Config

- `.env` — secrets (DISCORD_BOT_TOKEN, OPENROUTER_API_KEY). See `.env.example` for required vars.
- `prompts/SYSTEM.md` — evee's personality/instructions (editable without restart)

## Adding a New Tool

Create `tools/<verb>_<noun>.py`:

```python
from tools import register

@register("verb_noun", schema={...}, status="doing thing: {param}")
def verb_noun(param: str) -> str:
    return result
```

No other changes needed — the registry auto-discovers it.

## Testing

Use the Discord MCP (SaseQ/discord-mcp) to interact with and test Evee directly. Guild ID: `1478129336316985529`. Use `mcp__discord__find_channel` to locate channels, `mcp__discord__send_message` to send test messages, and `mcp__discord__read_messages` to check Evee's replies.

## Future Plans

- SQLite logging of all messages and tool calls
- Thread auto-rename after 3 messages (LLM-generated summary)
- Multi-model routing (cheap model for simple tasks, smart model for complex ones)
