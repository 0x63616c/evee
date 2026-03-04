# Tool Calling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an extensible tool calling system to Evee with two initial tools: web search (DuckDuckGo) and URL fetching (trafilatura).

**Architecture:** Decorator-based tool registry in `tools/` package. Chat function becomes an async tool-calling loop that executes tools when Claude requests them and sends status messages to Discord. Date/time injected into system prompt.

**Tech Stack:** Python 3.12, discord.py, openai, duckduckgo-search, httpx, trafilatura

**Design doc:** `docs/plans/2026-03-03-tool-calling-design.md`

---

### Task 1: Verify Proxy Supports Tool Calling

This is the highest-risk assumption. Before building anything, verify the proxy handles tool calls.

**Files:**
- None (manual verification)

**Step 1: Start the proxy**

Run: `proxy` (or `node ~/code/github.com/atalovesyou/claude-max-api-proxy/dist/server/standalone.js`)

**Step 2: Send a test request with tools**

Run:
```bash
curl -s http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [{"role": "user", "content": "What time is it in London right now?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_time",
        "description": "Get the current time in a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {"type": "string"}
          },
          "required": ["city"]
        }
      }
    }]
  }' | python3 -m json.tool
```

Expected: Response contains `tool_calls` array with `get_time` and `{"city": "London"}`.

**Step 3: Send the tool result back**

Take the `id` from the tool call response and send:
```bash
curl -s http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [
      {"role": "user", "content": "What time is it in London right now?"},
      {"role": "assistant", "content": null, "tool_calls": [{"id": "TOOL_CALL_ID_HERE", "type": "function", "function": {"name": "get_time", "arguments": "{\"city\": \"London\"}"}}]},
      {"role": "tool", "tool_call_id": "TOOL_CALL_ID_HERE", "content": "2:45 PM GMT"}
    ]
  }' | python3 -m json.tool
```

Expected: Response contains a text message referencing 2:45 PM.

**Step 4: Document result**

If it works: continue with Task 2.
If it fails: stop and investigate the proxy. Check if it needs updating or patching. Do NOT proceed until this works.

---

### Task 2: Add Dependencies

**Files:**
- Modify: `pyproject.toml`

**Step 1: Add the three new dependencies**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv add duckduckgo-search httpx trafilatura
```

Expected: `pyproject.toml` updated with new deps, `uv.lock` regenerated.

**Step 2: Verify imports work**

Run:
```bash
uv run python -c "from duckduckgo_search import DDGS; import httpx; import trafilatura; print('all imports ok')"
```

Expected: `all imports ok`

**Step 3: Commit**

```bash
git add pyproject.toml uv.lock
git commit -m "chore: add tool calling dependencies"
git push
```

---

### Task 3: Create Tool Registry

**Files:**
- Create: `tools/__init__.py`

**Step 1: Write the registry module**

```python
import importlib
import json
import logging
import pkgutil
from typing import Callable

log = logging.getLogger("evee.tools")

_TOOLS: dict[str, dict] = {}


def register(name: str, schema: dict, status: str = ""):
    """Decorator to register a tool function with its OpenAI schema and status template."""

    def decorator(fn: Callable[..., str]) -> Callable[..., str]:
        _TOOLS[name] = {"function": fn, "schema": schema, "status": status}
        log.info("registered tool: %s", name)
        return fn

    return decorator


def get_openai_tools() -> list[dict]:
    """Return all tool schemas in OpenAI function-calling format."""
    return [tool["schema"] for tool in _TOOLS.values()]


def execute_tool(name: str, arguments_json: str) -> str:
    """Look up a tool by name, parse its JSON arguments, and call it."""
    tool = _TOOLS.get(name)
    if not tool:
        return f"unknown tool: {name}"
    try:
        args = json.loads(arguments_json)
        return tool["function"](**args)
    except Exception as exc:
        log.exception("tool %s failed", name)
        return f"tool error: {exc}"


def get_status_message(name: str, arguments_json: str) -> str:
    """Format a tool's status template with its arguments."""
    tool = _TOOLS.get(name)
    if not tool or not tool["status"]:
        return ""
    try:
        args = json.loads(arguments_json)
        return tool["status"].format(**args)
    except Exception:
        return ""


def _discover_tools():
    """Import all modules in the tools package so their @register decorators run."""
    package_path = __path__
    for importer, modname, ispkg in pkgutil.iter_modules(package_path):
        importlib.import_module(f"tools.{modname}")


_discover_tools()
```

**Step 2: Verify the module loads without errors**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "import tools; print('registry loaded, tools:', list(tools._TOOLS.keys()))"
```

Expected: `registry loaded, tools: []` (no tools registered yet)

**Step 3: Commit**

```bash
git add tools/__init__.py
git commit -m "feat: add tool registry with decorator-based registration"
git push
```

---

### Task 4: Create search_web Tool

**Files:**
- Create: `tools/search_web.py`

**Step 1: Write the search_web tool**

```python
from duckduckgo_search import DDGS

from tools import register

_SEARCH_SCHEMA = {
    "type": "function",
    "function": {
        "name": "search_web",
        "description": "Search the web for current information, recent events, or anything you need to look up.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query",
                }
            },
            "required": ["query"],
        },
    },
}


@register("search_web", schema=_SEARCH_SCHEMA, status='searching: "{query}"')
def search_web(query: str) -> str:
    results = DDGS().text(query, max_results=5)
    if not results:
        return "no results found"
    return "\n\n".join(
        f"{r['title']}\n{r['href']}\n{r['body']}" for r in results
    )
```

**Step 2: Verify the tool registers and works**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "
import tools
print('registered tools:', list(tools._TOOLS.keys()))
result = tools.execute_tool('search_web', '{\"query\": \"python asyncio\"}')
print('results:')
print(result[:500])
"
```

Expected: Tool is registered, search returns results with titles, URLs, and snippets.

**Step 3: Commit**

```bash
git add tools/search_web.py
git commit -m "feat: add search_web tool using DuckDuckGo"
git push
```

---

### Task 5: Create fetch_url Tool

**Files:**
- Create: `tools/fetch_url.py`

**Step 1: Write the fetch_url tool**

```python
import httpx
import trafilatura

from tools import register

_MAX_CONTENT_LENGTH = 6000

_FETCH_SCHEMA = {
    "type": "function",
    "function": {
        "name": "fetch_url",
        "description": "Fetch a web page and extract its main text content. Use this to read articles, documentation, or any URL.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to fetch",
                }
            },
            "required": ["url"],
        },
    },
}

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


@register("fetch_url", schema=_FETCH_SCHEMA, status="reading: {url}")
def fetch_url(url: str) -> str:
    try:
        resp = httpx.get(url, timeout=10, follow_redirects=True, headers=_HEADERS)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        return f"failed to fetch URL: {exc}"

    content = trafilatura.extract(resp.text)
    if not content:
        return "could not extract content from this page"

    if len(content) > _MAX_CONTENT_LENGTH:
        content = content[:_MAX_CONTENT_LENGTH] + "\n\n[content truncated]"

    return content
```

**Step 2: Verify the tool registers and works**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "
import tools
print('registered tools:', list(tools._TOOLS.keys()))
result = tools.execute_tool('fetch_url', '{\"url\": \"https://example.com\"}')
print('content:')
print(result[:500])
"
```

Expected: Tool is registered, returns extracted text from example.com.

**Step 3: Commit**

```bash
git add tools/fetch_url.py
git commit -m "feat: add fetch_url tool using httpx and trafilatura"
git push
```

---

### Task 6: Add Datetime Injection to System Prompt

**Files:**
- Modify: `evee.py:87-88` (`load_system_prompt` function)

**Step 1: Update load_system_prompt to inject current datetime**

Replace the current `load_system_prompt` function:

```python
def load_system_prompt() -> str:
    base = Path("prompts/SYSTEM.md").read_text().strip()
    now = datetime.now().strftime("%A, %B %-d, %Y, %-I:%M %p %Z").strip()
    return f"{base}\n\nCurrent date and time: {now}"
```

**Step 2: Verify the output**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "
from evee import load_system_prompt
print(load_system_prompt())
"
```

Expected: System prompt text followed by `Current date and time: Monday, March 3, 2026, 2:45 PM` (or similar).

**Step 3: Commit**

```bash
git add evee.py
git commit -m "feat: inject current datetime into system prompt"
git push
```

---

### Task 7: Rewrite chat() as Async Tool-Calling Loop

This is the biggest change. The `chat()` function goes from a single sync LLM call to an async loop that handles tool calls.

**Files:**
- Modify: `evee.py:82-101` (LLM client section)

**Step 1: Replace the chat function and update the LLM client**

Replace lines 82-101 of `evee.py` (the entire `# --- LLM client ---` section) with:

```python
# --- LLM client ---

import json
from typing import Callable, Awaitable

from tools import get_openai_tools, execute_tool, get_status_message

llm = OpenAI(base_url=f"{PROXY_URL}/v1", api_key="not-needed")

_MAX_TOOL_ITERATIONS = 10

OnStatus = Callable[[str], Awaitable[None]]


def load_system_prompt() -> str:
    base = Path("prompts/SYSTEM.md").read_text().strip()
    now = datetime.now().strftime("%A, %B %-d, %Y, %-I:%M %p %Z").strip()
    return f"{base}\n\nCurrent date and time: {now}"


async def chat(messages: list[dict], on_status: OnStatus | None = None) -> str:
    system_prompt = load_system_prompt()
    tools = get_openai_tools()
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    for _ in range(_MAX_TOOL_ITERATIONS):
        try:
            resp = await asyncio.to_thread(
                llm.chat.completions.create,
                model="claude-sonnet-4",
                messages=full_messages,
                tools=tools if tools else None,
            )
        except Exception:
            log.exception("llm request failed")
            return "sorry, something went wrong with my brain. try again?"

        msg = resp.choices[0].message

        if not msg.tool_calls:
            return msg.content or "(empty response)"

        # Append the assistant message with tool calls
        full_messages.append(
            {
                "role": "assistant",
                "content": msg.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in msg.tool_calls
                ],
            }
        )

        # Execute each tool call
        for tc in msg.tool_calls:
            status = get_status_message(tc.function.name, tc.function.arguments)
            if status and on_status:
                await on_status(status)

            result = await asyncio.to_thread(
                execute_tool, tc.function.name, tc.function.arguments
            )
            full_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                }
            )

    return "sorry, I got stuck in a loop trying to use my tools. try again?"
```

Note: The `json` import and `tools` imports need to be added at the top of the file. The `from typing import Callable, Awaitable` import goes at the top too.

**Step 2: Verify it at least loads without syntax errors**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "from evee import chat; print('chat function loaded ok')"
```

Expected: `chat function loaded ok`

**Step 3: Commit**

```bash
git add evee.py
git commit -m "feat: rewrite chat() as async tool-calling loop"
git push
```

---

### Task 8: Update Discord Handlers to Use New chat()

**Files:**
- Modify: `evee.py:166-195` (Discord handlers)

**Step 1: Update handle_channel_message**

Replace the current `handle_channel_message` function:

```python
async def handle_channel_message(message: discord.Message):
    thread_name = format_thread_name()
    thread = await message.create_thread(name=thread_name)

    messages = [{"role": "user", "content": message.content}]

    async def on_status(text: str):
        await thread.send(text)

    async with thread.typing():
        reply = await chat(messages, on_status=on_status)

    for chunk in split_message(reply):
        await thread.send(chunk)
```

**Step 2: Update handle_thread_message**

Replace the current `handle_thread_message` function:

```python
async def handle_thread_message(message: discord.Message):
    thread = message.channel

    history = []
    async for msg in thread.history(limit=100, oldest_first=True):
        role = "assistant" if msg.author == client.user else "user"
        content = msg.content or ""
        if not content:
            continue
        history.append({"role": role, "content": content})

    async def on_status(text: str):
        await thread.send(text)

    async with thread.typing():
        reply = await chat(history, on_status=on_status)

    for chunk in split_message(reply):
        await thread.send(chunk)
```

The key changes:
- `chat()` is now `await`ed directly (no more `asyncio.to_thread()` wrapper — chat handles its own threading internally)
- `on_status` closure is created and passed to `chat()`

**Step 3: Commit**

```bash
git add evee.py
git commit -m "feat: update Discord handlers with tool status callbacks"
git push
```

---

### Task 9: Clean Up Imports in evee.py

After all the changes, make sure the imports at the top of `evee.py` are correct and ordered.

**Files:**
- Modify: `evee.py:1-14` (imports section)

**Step 1: Update imports**

The final imports block at the top of `evee.py` should be:

```python
import asyncio
import atexit
import json
import logging
import os
import subprocess
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from typing import Awaitable, Callable

import discord
from dotenv import load_dotenv
from openai import OpenAI

from tools import execute_tool, get_openai_tools, get_status_message
```

Remove any duplicate or inline imports added during earlier tasks. The `json`, `typing`, and `tools` imports are the new additions.

**Step 2: Verify the full bot loads**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python -c "import evee; print('evee loaded ok')"
```

Expected: `evee loaded ok` (plus some logging about tool registration)

**Step 3: Commit**

```bash
git add evee.py
git commit -m "refactor: clean up imports in evee.py"
git push
```

---

### Task 10: End-to-End Manual Test

**Files:**
- None (manual testing)

**Step 1: Start the bot**

Run:
```bash
cd /Users/calum/code/github.com/0x63616c/evee
uv run python evee.py
```

Expected: Bot starts, proxy starts, "evee is online" logged, tool registration messages logged.

**Step 2: Test basic chat (no tools)**

In Discord, send a message like "hey, what's your name?". Verify:
- Thread is created
- Evee responds normally
- No tool calls triggered

**Step 3: Test web search**

Send: "what's the latest news about Python 3.13?"

Verify:
- Status message appears: `searching: "latest news about Python 3.13"` (or similar)
- Evee responds with information from search results
- Response includes relevant, current information

**Step 4: Test URL fetching**

Send: "can you summarize this page? https://docs.python.org/3/whatsnew/3.13.html"

Verify:
- Status message appears: `reading: https://docs.python.org/3/whatsnew/3.13.html`
- Evee responds with a summary of the page content

**Step 5: Test datetime awareness**

Send: "what day is it today?"

Verify:
- Evee answers correctly without a tool call (datetime is in the system prompt)
- No status message appears

**Step 6: Test error handling**

Send: "can you read this page? https://thisdomaindoesnotexist12345.com"

Verify:
- Status message appears: `reading: https://thisdomaindoesnotexist12345.com`
- Evee responds gracefully saying it couldn't access the page
- Bot does not crash
