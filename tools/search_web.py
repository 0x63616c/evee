from ddgs import DDGS

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
    return "\n\n".join(f"{r['title']}\n{r['href']}\n{r['body']}" for r in results)
