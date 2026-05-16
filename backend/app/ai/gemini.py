from __future__ import annotations

import json

import httpx

from .provider import AIProvider, AIProviderError, GenerationRequest

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY not configured")
        self.api_key = api_key
        self.model = model

    async def generate(self, req: GenerationRequest) -> str:
        url = f"{GEMINI_BASE}/{self.model}:generateContent"
        body: dict = {
            "contents": [{"role": "user", "parts": [{"text": req.prompt}]}],
            "generationConfig": {
                "temperature": req.temperature,
                "maxOutputTokens": req.max_output_tokens,
            },
        }
        if req.system:
            body["systemInstruction"] = {"parts": [{"text": req.system}]}
        if req.json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient() as client:
            r = await client.post(
                url,
                params={"key": self.api_key},
                json=body,
                timeout=90.0,
            )
        if r.status_code != 200:
            raise AIProviderError(f"gemini {r.status_code}: {r.text[:500]}")

        data = r.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise AIProviderError(f"gemini malformed response: {json.dumps(data)[:500]}") from e
