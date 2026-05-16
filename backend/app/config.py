from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    youtube_api_key: str = ""
    cache_ttl_seconds: int = 1800
    allowed_origin: str = "http://localhost:3000"

    # Content pipeline LLM config. ai_provider selects which backend in
    # app/ai/registry.py — swap by changing the env var, no code edits.
    ai_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()


# Content-generation genres. Distinct from the YouTube trend CATEGORIES above:
# trends needs YouTube query strings; the content pipeline only needs a label
# the deep diver can interpret.
GENRES: dict[str, str] = {
    "philosophy": "Philosophy",
    "finance": "Finance",
    "gaming": "Gaming",
    "tech": "Tech",
    "anime": "Anime",
    "history": "History",
    "science": "Science",
    "true_crime": "True Crime",
}


CATEGORIES: dict[str, dict] = {
    "anime": {
        "label": "Anime",
        "queries": ["anime review", "anime explained", "anime breakdown"],
        "yt_category_id": "1",
    },
    "finance": {
        "label": "Finance",
        "queries": ["stock market today", "crypto news", "personal finance explained"],
        "yt_category_id": "25",
    },
    "gaming": {
        "label": "Gaming",
        "queries": ["gaming review", "game lore explained", "speedrun analysis"],
        "yt_category_id": "20",
    },
    "tech": {
        "label": "Tech",
        "queries": ["tech review", "ai news explained", "software explained"],
        "yt_category_id": "28",
    },
}

DURATION_MIN_SECONDS = 8 * 60
DURATION_MAX_SECONDS = 12 * 60
