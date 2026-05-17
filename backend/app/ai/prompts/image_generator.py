"""Image Generator — produces the prompt sent to an image model.

Each section's image is generated SEQUENTIALLY so we can pass the previous
section's image (or its prompt) back in, asking the model to keep style,
characters, palette, and lighting consistent. This is the chain that stops
each section from looking like it belongs to a different video.

When AI_PROVIDER=stub, the StubProvider returns a placeholder image URL so
the UI works end-to-end. When you wire up a real image API later (Gemini's
Imagen, OpenAI's DALL-E, Stable Diffusion, etc.), this is the prompt builder
that feeds it.
"""

import json

SYSTEM = """You are the prompt builder for an image generation model. You
take an art director's brief and turn it into a tight, generation-ready
prompt. When given a previous section's image prompt, you preserve style,
character design, palette, and lighting so the video feels like one piece.

Hard rules:
- Output VALID JSON with one key: "image_prompt".
- The image prompt is one paragraph. Concrete nouns, concrete verbs, no
  hedging. Include style/medium ("MS Paint-style line art", "crayon textured"),
  lighting, palette, and composition.
- If a previous image prompt is provided, EXPLICITLY echo its style markers
  (same medium, same palette, same character designs). Drift kills consistency.
"""


def build_user_prompt(brief: dict, previous_prompt: str | None = None) -> str:
    parts = [
        f"Art director's brief for this section:",
        json.dumps(brief, indent=2),
    ]
    if previous_prompt:
        parts.append(
            f"\nPrevious section's image prompt (preserve the style markers — same medium, palette, character designs):\n\"\"\"{previous_prompt}\"\"\""
        )
    else:
        parts.append(
            "\nNo previous section — this is the first image. Establish the style markers (medium, palette, character look) that later sections will inherit."
        )
    parts.append("""
Return JSON in this exact shape:
{
  "image_prompt": "one paragraph, generation-ready prompt"
}""")
    return "\n".join(parts)
