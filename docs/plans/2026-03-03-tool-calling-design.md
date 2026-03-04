# Tool Calling Design

## Overview

Add tool calling to Evee so she can interact with the outside world — search the web, read web pages, and know the current date/time. Built with an extensible registry so future tools (weather, Spotify, email) are easy to add.

## Non-Technical Assumptions

- This is a personal bot for one user (Cal) in a private Discord server
- Usage volume is low — a few conversations a day, maybe a few tool calls per conversation
- DuckDuckGo search quality is good enough for a personal assistant
- It's acceptable if some websites can't be fetched (JS-heavy SPAs, paywalled content)
- Status messages in Discord ("searching: ...") are useful feedback, not noise
- No need for tool call approval/confirmation — Evee just executes tools when Claude asks

## Technical Assumptions

1. **claude-max-api-proxy supports OpenAI tool calling format.** The proxy must accept `tools` in the request body and return `tool_calls` in the response, translating between OpenAI's format and Claude's native tool_use format. **Must be verified before implementation.**
2. **Proxy handles multi-turn tool conversations.** Specifically, `role: "tool"` messages with `tool_call_id` must be correctly mapped to Claude's `tool_result` content blocks.
3. **`duckduckgo-search` library is synchronous.** Needs `asyncio.to_thread()` wrapping.
4. **`trafilatura.extract()` is synchronous and CPU-bound.** Same `to_thread()` wrapping needed.
5. **Tool call arguments arrive as JSON strings** (`tc.function.arguments`), not parsed dicts.
6. **Claude may call multiple tools in one response.** All must be executed and results sent back before the next LLM call.
7. **Fetched page content can be massive.** Must truncate to a hard cap (~6000 chars) to stay within context limits.
8. **The OpenAI sync client wrapping via `to_thread()` is still needed** inside the tool loop for each LLM call.

## What's Being Built

Right now Evee does one thing: receives a message, sends it to Claude, returns the text response. She can't look anything up or interact with the outside world.

This adds the ability for Claude to pause mid-response and say "I need to do something first." When you ask Evee something she doesn't know — like "what's the latest news about X" — Claude responds with a tool call instead of text. Evee catches that, runs the actual search, sends the results back to Claude, and Claude writes its answer using those results. In Discord you see a status message like `searching: "latest news about X"` while this happens, then the final answer.

Same flow for fetch_url — paste a link and say "summarize this", Claude asks Evee to fetch the page, gets extracted text back, writes a summary.

Current date/time is injected into the system prompt on every call (not a tool) so Claude always knows what day it is.

The tool registry is a decorator-based pattern so adding future tools is just creating a new file with a function and a schema.

## Decisions Made

- **verb_noun snake_case** naming convention for tools (e.g. `search_web`, `fetch_url`)
- **DuckDuckGo** for search (free, no API key, no hosting)
- **trafilatura** for HTML content extraction (free, local, open source)
- **Decorator-based tool registry** with status template strings
- **Date/time injected into system prompt**, not a tool
- **No calculator tool** (removed during design)
- **No weather tool** (deferred to later)
- **Status messages per tool** defined in the decorator, not hardcoded in the chat loop
- **Approach A** (tool loop in `chat()`) over Approach B (separate ToolRunner class)

## Architecture

### File Structure

```
evee.py                  # bot + async chat loop with tool calling
tools/
  __init__.py            # registry: register decorator, TOOLS dict, get_openai_tools(), execute_tool()
  search_web.py          # DuckDuckGo search
  fetch_url.py           # URL fetching + trafilatura content extraction
```

### Tool Registry (`tools/__init__.py`)

```python
TOOLS: dict[str, dict] = {}

def register(name: str, schema: dict, status: str = ""):
    """Decorator to register a tool with its schema and status template."""
    def decorator(fn):
        TOOLS[name] = {"function": fn, "schema": schema, "status": status}
        return fn
    return decorator

def get_openai_tools() -> list[dict]:
    return [t["schema"] for t in TOOLS.values()]

def execute_tool(name: str, arguments_json: str) -> str:
    tool = TOOLS.get(name)
    if not tool:
        return f"unknown tool: {name}"
    args = json.loads(arguments_json)
    return tool["function"](**args)

def get_status_message(name: str, arguments_json: str) -> str:
    tool = TOOLS.get(name)
    if not tool or not tool["status"]:
        return ""
    args = json.loads(arguments_json)
    return tool["status"].format(**args)
```

Auto-imports all modules in `tools/` on package load.

### search_web Tool (`tools/search_web.py`)

- Uses `duckduckgo_search.DDGS().text(query, max_results=5)`
- Returns formatted string: title + URL + snippet per result
- Status template: `"searching: {query}"`
- Schema: one required param `query` (string)

### fetch_url Tool (`tools/fetch_url.py`)

- Uses `httpx.get(url, timeout=10, follow_redirects=True)` with browser-like User-Agent
- Passes HTML through `trafilatura.extract()`
- Truncates to 6000 chars
- Returns extracted text or error message
- Status template: `"reading: {url}"`
- Schema: one required param `url` (string)

### Chat Loop Changes (`evee.py`)

`chat()` becomes async with a tool-calling loop:

1. Build messages: system prompt (with injected datetime) + conversation history
2. Call LLM with messages + tool schemas (via `to_thread()` since client is sync)
3. If response has text content: return it
4. If response has tool_calls: for each call, format status message, execute tool (via `to_thread()`), append tool result to messages
5. Go to step 2
6. Max 10 iterations, return error if exceeded

`on_status` callback passed from Discord handlers to send status messages to the thread.

### System Prompt Injection

`load_system_prompt()` appends current datetime:

```
\n\nCurrent date and time: Tuesday, March 3, 2026, 2:45 PM GMT
```

### Discord Handler Changes

- `handle_thread_message()` and `handle_channel_message()` create an `on_status` closure that sends to the thread
- `chat()` is now awaited directly (no `to_thread()` wrapper at this level — it handles its own threading internally)

## Dependencies

Added via `uv add`:
- `duckduckgo-search` — DuckDuckGo search API wrapper
- `httpx` — async HTTP client for URL fetching
- `trafilatura` — HTML content extraction

## Future Tool Convention

To add a new tool, create `tools/<verb>_<noun>.py`:

```python
from tools import register

@register("verb_noun", schema={...}, status="doing thing: {param}")
def verb_noun(param: str) -> str:
    # do the thing
    return result
```

No other changes needed — the registry auto-discovers it.
