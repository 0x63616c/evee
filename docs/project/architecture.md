# Architecture

## Overview

Evee is a single-process Discord bot that routes user messages through an LLM with tool-calling capabilities.

```
Discord Server
    |
    v
discord.py Client (evee.py)
    |
    +-- on_message (channel) --> create thread --> chat()
    +-- on_message (thread)  --> load history --> chat()
    |
    v
chat() — async tool-calling loop
    |
    +-- OpenAI client --> OpenRouter API --> DeepSeek V3
    +-- tool calls --> tools/ registry --> execute_tool()
    |                                        |
    |                                        +-- search_web (DuckDuckGo)
    |                                        +-- fetch_url (httpx + trafilatura)
    v
response --> split_message() --> thread.send()
```

## Components

### Discord Layer (`evee.py`)

- `on_message` — routes channel messages vs thread messages
- `handle_channel_message` — creates a new thread, sends first message to LLM
- `handle_thread_message` — loads thread history (up to 100 messages), sends to LLM
- `split_message` — splits long responses at newlines/spaces to fit Discord's 2000-char limit
- `format_thread_name` — generates timestamped thread names

### LLM Layer (`evee.py`)

- `chat()` — async function that runs the tool-calling loop (up to 10 iterations)
- Wraps synchronous OpenAI client in `asyncio.to_thread()` to avoid blocking
- Loads system prompt from `prompts/SYSTEM.md` on every call
- Injects current date/time into system prompt

### Tool System (`tools/`)

- `__init__.py` — decorator-based registry with auto-discovery via `pkgutil`
- `@register(name, schema, status)` — registers a tool with its OpenAI schema and status template
- `execute_tool(name, args_json)` — looks up and executes a tool by name
- `get_status_message(name, args_json)` — formats status template for Discord display

### Individual Tools

| Tool | File | Dependencies | Purpose |
|------|------|--------------|---------|
| `search_web` | `tools/search_web.py` | ddgs | DuckDuckGo web search, returns top 5 results |
| `fetch_url` | `tools/fetch_url.py` | httpx, trafilatura | Fetches URL, extracts text content, SSRF-protected |

## Data Flow

1. User sends message in Discord channel or thread
2. Bot creates thread (if channel) or loads history (if thread)
3. `chat()` sends conversation + system prompt to OpenRouter (DeepSeek V3)
4. If LLM returns tool calls: execute tools, send status to Discord, append results, loop
5. If LLM returns text: split and send to Discord thread

## Key Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Thread history | 100 messages | Prevent token overflow |
| Tool iterations | 10 max | Prevent infinite loops |
| Discord message | 2000 chars | Discord API limit |
| URL content | 6000 chars | Prevent token overflow from large pages |
| System prompt | Loaded from disk each call | Live-editable without restart |
