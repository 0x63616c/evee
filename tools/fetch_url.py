import httpx
import trafilatura

from tools import register

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

_MAX_CHARS = 6000


@register(
    name="fetch_url",
    schema={
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch a URL and extract its main text content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch.",
                    },
                },
                "required": ["url"],
            },
        },
    },
    status="reading: {url}",
)
def fetch_url(url: str) -> str:
    resp = httpx.get(url, headers={"User-Agent": _USER_AGENT}, follow_redirects=True, timeout=15)
    resp.raise_for_status()

    text = trafilatura.extract(resp.text) or resp.text[:_MAX_CHARS]
    if len(text) > _MAX_CHARS:
        text = text[:_MAX_CHARS] + "\n...(truncated)"
    return text
