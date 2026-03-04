import asyncio
import logging
import os
from collections.abc import Awaitable, Callable
from datetime import datetime
from pathlib import Path

import discord
import truststore
from dotenv import load_dotenv
from openai import OpenAI

truststore.inject_into_ssl()

from tools import execute_tool, get_openai_tools, get_status_message

load_dotenv()

LOG_FILE = Path.home() / ".local" / "log" / "evee.log"
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE),
    ],
)
log = logging.getLogger("evee")

# --- LLM client ---

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-chat"

llm = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


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
                model=DEFAULT_MODEL,
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

            result = await asyncio.to_thread(execute_tool, tc.function.name, tc.function.arguments)
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
    year = now.year
    return f"{month} {day}, {year} - {hour}:{minute}{ampm}"


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
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        log.error("DISCORD_BOT_TOKEN not set in .env")
        raise SystemExit(1)
    if not os.getenv("OPENROUTER_API_KEY"):
        log.error("OPENROUTER_API_KEY not set in .env")
        raise SystemExit(1)
    client.run(token, log_handler=None)


if __name__ == "__main__":
    main()
