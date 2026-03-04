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
