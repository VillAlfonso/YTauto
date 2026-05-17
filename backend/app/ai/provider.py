from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


class AIProviderError(RuntimeError):
    pass


@dataclass
class GenerationRequest:
    prompt: str
    system: str | None = None
    json_mode: bool = False
    temperature: float = 0.9
    max_output_tokens: int = 4096
    # Identifier the StubProvider uses to pick a canned response. Real
    # providers ignore it. Pipeline stages set this to their stage name.
    stage_id: str | None = None


class AIProvider(ABC):
    """Abstract base for any LLM backend. Keep this surface small and stable —
    everything else (Gemini, OpenAI, Anthropic, local) implements this.
    """

    name: str = "abstract"

    @abstractmethod
    async def generate(self, req: GenerationRequest) -> str:
        """Return the raw model text. Callers parse JSON themselves when needed."""

    async def generate_image(self, prompt: str, *, color_hint: str = "#4d96ff") -> str:
        """Return an image URL (or data: URL) for the prompt. Optional —
        providers that don't do image generation can leave the default, which
        raises so the caller knows to swap providers or stub it.
        """
        raise NotImplementedError(
            f"{self.name} does not support image generation. "
            "Set AI_PROVIDER=stub for placeholder images, or wire up an image backend."
        )
