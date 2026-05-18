from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    allowed_origin: str = "http://localhost:3000"

    # Content pipeline LLM config. ai_provider selects which backend in
    # app/ai/registry.py — swap by changing the env var, no code edits.
    # Defaults to "stub" so a fresh checkout works end-to-end without keys.
    # Real Gemini keys for image generation are managed via the /keys page,
    # not env vars.
    ai_provider: str = "stub"
    gemini_api_key: str = ""  # env fallback for text-stage Gemini calls
    gemini_model: str = "gemini-2.0-flash"
    gemini_image_model: str = "gemini-2.5-flash-image"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()


# Content-generation genres. Used by the /api/content/genres endpoint as a
# starter set for the older genre-seeded pipeline (the current prototype
# Studio uses paste-script flow instead, but the genre endpoints remain).
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
