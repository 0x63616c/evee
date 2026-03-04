# Tests

## Running Tests

```bash
uv run pytest -v
```

## Structure

```
tests/
  test_fetch_url.py    # SSRF validation for URL fetcher
```

## Conventions

- Test files: `test_<module>.py`
- Mock external services — tests must run offline without API keys
- Use `pytest.mark.parametrize` for testing multiple inputs
- Use `unittest.mock.patch` for mocking stdlib/third-party calls

## Coverage

| Module | Tested | Notes |
|--------|--------|-------|
| `tools/fetch_url.py` | `validate_url()` | SSRF protection: scheme, IP, hostname validation |
| `tools/search_web.py` | Not yet | Needs mocked DuckDuckGo responses |
| `tools/__init__.py` | Not yet | Registry, execute_tool, get_status_message |
| `evee.py` | Not yet | split_message, format_thread_name are easy targets |

## Adding Tests

1. Create `tests/test_<module>.py`
2. Mock external dependencies (HTTP, DNS, Discord API)
3. Run `uv run pytest -v` to verify
4. CI runs tests automatically on push/PR
