import os
from dotenv import load_dotenv

load_dotenv()


def get_allowed_origins() -> list[str]:
    raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
    )
    if raw == "*":
        return ["*"]
    origins = [
        origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()
    ]
    return list(dict.fromkeys(origins))


def get_github_token() -> str | None:
    token = os.getenv("GITHUB_TOKEN", "").strip()
    return token or None


def get_github_api_base_url() -> str:
    return (
        os.getenv("GITHUB_API_BASE_URL", "https://api.github.com").strip().rstrip("/")
    )


def get_backend_user_agent() -> str:
    return os.getenv("BACKEND_USER_AGENT", "reposcope-fastapi").strip()


def get_http_timeout_seconds() -> float:
    raw = os.getenv("HTTP_TIMEOUT_SECONDS", "15")
    try:
        value = float(raw)
    except ValueError:
        value = 15.0
    return max(1.0, value)


def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:8080").strip().rstrip("/")


def get_backend_url() -> str:
    return os.getenv("BACKEND_URL", "http://localhost:8000").strip().rstrip("/")


def get_github_oauth_client_id() -> str:
    return os.getenv("GITHUB_OAUTH_CLIENT_ID", "").strip()


def get_github_oauth_client_secret() -> str:
    return os.getenv("GITHUB_OAUTH_CLIENT_SECRET", "").strip()


def get_github_oauth_redirect_uri() -> str:
    raw = os.getenv("GITHUB_OAUTH_REDIRECT_URI", "").strip()
    if raw:
        return raw.rstrip("/")
    return f"{get_backend_url()}/api/auth/github/callback"


def get_redis_url() -> str | None:
    raw = os.getenv("REDIS_URL", "").strip()
    return raw or None


def get_cache_ttl_seconds() -> int:
    raw = os.getenv("CACHE_TTL_SECONDS", "300").strip()
    try:
        value = int(raw)
    except ValueError:
        value = 300
    return max(1, value)


def get_cache_key_prefix() -> str:
    return os.getenv("CACHE_KEY_PREFIX", "reposcope").strip() or "reposcope"
