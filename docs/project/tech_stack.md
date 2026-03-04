# Tech Stack

## Runtime

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Language | Python | 3.12+ | Primary language |
| Package manager | uv | latest | Dependency management, virtual environments |
| SSL | truststore | 0.10.4+ | Uses macOS keychain for SSL certs (uv's standalone Python lacks system certs) |

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| discord.py | 2.7.1+ | Discord bot framework |
| openai | 2.24.0+ | OpenAI-compatible client for LLM API calls |
| python-dotenv | 1.2.2+ | Environment variable loading from .env |

## Tool Dependencies

| Package | Version | Used By | Purpose |
|---------|---------|---------|---------|
| ddgs | 9.11.1+ | `search_web` | DuckDuckGo search API |
| httpx | 0.28.1+ | `fetch_url` | HTTP client with async support |
| trafilatura | 2.0.0+ | `fetch_url` | Web page content extraction |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pytest | 9.0.2+ | Test framework |
| ruff | 0.9.0+ | Linter and formatter |

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Discord API | Bot messaging and thread management | `DISCORD_BOT_TOKEN` in `.env` |
| OpenRouter | LLM API gateway (OpenAI-compatible) | `OPENROUTER_API_KEY` in `.env` |
| DeepSeek V3 | Default LLM model via OpenRouter | Configured in `evee.py` as `deepseek/deepseek-chat` |

## CI/CD

| Tool | Purpose | Config |
|------|---------|--------|
| GitHub Actions | Lint + test on push/PR to main | `.github/workflows/ci.yml` |
| ruff | Linting (E, F, W, I, UP, B, SIM, S) + formatting | `pyproject.toml` `[tool.ruff]` |
| pytest | Unit tests | `pyproject.toml` `[tool.pytest.ini_options]` |
