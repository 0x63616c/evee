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
