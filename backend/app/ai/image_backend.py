"""Real image generation via Gemini, with auto-rotation across stored keys.

When the active key hits 401/403/429 the keystore marks it exhausted and we
retry with the next available key. If no keys remain, return None and let
the caller fall back to the stub provider's SVG placeholder.

The actual model used is settings.gemini_image_model (default
gemini-2.5-flash-image). Response shape is a base64-encoded inline_data part
which we wrap as a data: URL the frontend can render directly.
"""

from __future__ import annotations

import sys

import httpx

from ..config import settings
from ..keystore import keystore

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class QuotaError(RuntimeError):
    """Raised on 401/403/429 — the active key should be marked exhausted."""


async def _call_gemini_image(api_key: str, prompt: str) -> str:
    url = f"{GEMINI_BASE}/{settings.gemini_image_model}:generateContent"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url,
            params={"key": api_key},
            json=body,
            timeout=120.0,
        )
    if r.status_code in (401, 403, 429):
        raise QuotaError(f"{r.status_code}: {r.text[:300]}")
    if r.status_code != 200:
        raise RuntimeError(f"gemini image {r.status_code}: {r.text[:300]}")

    data = r.json()
    # Walk candidates -> content.parts looking for the first inline_data with data.
    for cand in data.get("candidates", []):
        parts = cand.get("content", {}).get("parts", []) or []
        for p in parts:
            inl = p.get("inlineData") or p.get("inline_data")
            if inl and inl.get("data"):
                mime = inl.get("mimeType") or inl.get("mime_type") or "image/png"
                return f"data:{mime};base64,{inl['data']}"
    raise RuntimeError(
        f"gemini image: response had no inline image data: {str(data)[:300]}"
    )


async def generate_image(prompt: str) -> str | None:
    """Generate one image. Returns a data: URL or None.

    None means: no keys available (no keys configured, all exhausted, or a
    non-quota error tripped us). The caller should fall back to the stub.
    """
    tried: set[str] = set()
    while True:
        api_key = keystore.get_active_key()
        if not api_key or api_key in tried:
            return None
        tried.add(api_key)
        try:
            return await _call_gemini_image(api_key, prompt)
        except QuotaError as e:
            # Mark this key exhausted, try whatever the keystore rotates to next.
            keystore.mark_exhausted_and_rotate(api_key, str(e))
            continue
        except Exception as e:
            # Non-quota error (network, invalid key, bad prompt, model
            # overloaded). Record it for visibility but don't mark exhausted —
            # the user should fix or remove the key themselves.
            print(f"[image_backend] non-quota error, falling back: {e}", file=sys.stderr)
            keystore.log_error(api_key, str(e))
            return None
