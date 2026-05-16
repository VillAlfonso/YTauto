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


class AIProvider(ABC):
    """Abstract base for any LLM backend. Keep this surface small and stable —
    everything else (Gemini, OpenAI, Anthropic, local) implements this.
    """

    name: str = "abstract"

    @abstractmethod
    async def generate(self, req: GenerationRequest) -> str:
        """Return the raw model text. Callers parse JSON themselves when needed."""
