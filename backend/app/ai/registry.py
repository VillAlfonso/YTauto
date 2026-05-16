from __future__ import annotations

from ..config import settings
from .gemini import GeminiProvider
from .provider import AIProvider, AIProviderError
from .stub_provider import StubProvider


def get_provider() -> AIProvider:
    """Single source of truth for which LLM the pipeline talks to.
    Swap by changing AI_PROVIDER env var; add new branches as you add providers.
    """
    name = (settings.ai_provider or "stub").lower()
    if name == "stub":
        return StubProvider()
    if name == "gemini":
        return GeminiProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)
    raise AIProviderError(f"unknown AI_PROVIDER '{name}'")
