import asyncio
import atexit
import json
import logging
import os
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Awaitable, Callable

import discord
from dotenv import load_dotenv
from openai import OpenAI

from tools import execute_tool, get_openai_tools, get_status_message

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("evee")

PROXY_URL = "http://localhost:3456"
PROXY_SCRIPT = "/Users/calum/code/github.com/atalovesyou/claude-max-api-proxy/dist/server/standalone.js"
PROXY_LOG_DIR = Path.home() / ".local" / "log"
PROXY_LOG_FILE = PROXY_LOG_DIR / "claude-proxy.log"

proxy_process: subprocess.Popen | None = None
proxy_log_handle = None


def proxy_is_running() -> bool:
    try:
        req = urllib.request.Request(f"{PROXY_URL}/health", method="GET")
        with urllib.request.urlopen(req, timeout=3):
            return True
    except (urllib.error.URLError, OSError):
        return False


def start_proxy() -> subprocess.Popen | None:
    global proxy_process, proxy_log_handle

    if proxy_is_running():
        log.info("proxy already running")
        return None

    PROXY_LOG_DIR.mkdir(parents=True, exist_ok=True)
    proxy_log_handle = open(PROXY_LOG_FILE, "a")

    log.info("starting claude-max-api-proxy...")
    proxy_process = subprocess.Popen(
        ["node", PROXY_SCRIPT],
        stdout=proxy_log_handle,
        stderr=proxy_log_handle,
    )
    time.sleep(2)

    if proxy_is_running():
        log.info("proxy started (pid %d)", proxy_process.pid)
    else:
        log.warning("proxy started but health check failed — it may still be booting")

    return proxy_process


def stop_proxy():
    global proxy_process, proxy_log_handle
    if proxy_process is not None:
        log.info("stopping proxy (pid %d)", proxy_process.pid)
        proxy_process.terminate()
        try:
            proxy_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proxy_process.kill()
        proxy_process = None
    if proxy_log_handle is not None:
        proxy_log_handle.close()
        proxy_log_handle = None


atexit.register(stop_proxy)

# --- LLM client ---

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


# --- Discord helpers ---


def split_message(text: str, limit: int = 2000) -> list[str]:
    """Split a message into chunks that fit Discord's character limit."""
    if len(text) <= limit:
        return [text]

    chunks = []
    while text:
        if len(text) <= limit:
            chunks.append(text)
            break

        # try to split at a newline
        split_at = text.rfind("\n", 0, limit)
        if split_at == -1 or split_at < limit // 2:
            # fall back to splitting at a space
            split_at = text.rfind(" ", 0, limit)
        if split_at == -1 or split_at < limit // 2:
            # hard split
            split_at = limit

        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")

    return chunks


def format_thread_name() -> str:
    now = datetime.now()
    hour = now.strftime("%I").lstrip("0")
    minute = now.strftime("%M")
    ampm = now.strftime("%p").lower()
    month = now.strftime("%b").lower()
    day = now.day
    return f"{month} {day} - {hour}:{minute}{ampm}"


# --- Discord bot ---

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    log.info("evee is online as %s", client.user)


@client.event
async def on_message(message: discord.Message):
    # ignore own messages
    if message.author == client.user:
        return

    if isinstance(message.channel, discord.Thread):
        await handle_thread_message(message)
    else:
        await handle_channel_message(message)


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


def main():
    start_proxy()
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        log.error("DISCORD_BOT_TOKEN not set in .env")
        raise SystemExit(1)
    try:
        client.run(token, log_handler=None)
    finally:
        stop_proxy()


if __name__ == "__main__":
    main()
