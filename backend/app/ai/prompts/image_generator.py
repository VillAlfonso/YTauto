"""Stage 3 of the image flow — turn the art director's brief into a tight,
generation-ready prompt for an image model.

Each section's image is generated SEQUENTIALLY so we can pass the previous
section's prompt back in and ask the model to preserve style, character
design, palette, and lighting. This is what stops each section from looking
like it belongs to a different video.

The output of this stage is the literal string sent to the Gemini image API,
so it must be concrete, visual, and free of words that confuse image models
("elegant", "beautiful", "atmospheric", etc).
"""

import json

SYSTEM = """You are the prompt builder for an image generation model that
produces ONE 16:9 cartoon illustration per call. Your output goes directly
into a Gemini image generation request — make it concrete and visual.

Hard rules:
- Output VALID JSON with exactly one key: "image_prompt".
- The image prompt is one paragraph, 50-120 words.
- Start with the style anchor verbatim: "MS Paint cartoon, 16:9 aspect ratio,
  crude line drawings with flat solid-color fills, slightly imperfect
  hand-drawn linework, limited primary-color palette".
- After the anchor, describe: the subject (concrete noun + action), the
  composition, the mood. Use only things that can literally be drawn.
- Avoid words that confuse image models: "elegant", "beautiful",
  "atmospheric", "captivating", "stunning". Replace with concrete visual
  nouns and verbs.
- If a previous prompt is provided, copy its exact style markers (medium,
  palette, character designs). Style drift across sections kills the video.
- No text or labels inside the image unless explicitly requested.
"""


def build_user_prompt(brief: dict, previous_prompt: str | None = None) -> str:
    parts = [
        "Art director's brief for this section:",
        json.dumps(brief, indent=2),
    ]
    if previous_prompt:
        parts.append(
            "\nPrevious section's image prompt — preserve its style anchor "
            "and palette verbatim so the panels feel like one video:\n"
            f'"""{previous_prompt}"""'
        )
    else:
        parts.append(
            "\nNo previous section — this is the first panel. Establish the "
            "style anchor that every later section will inherit."
        )
    parts.append("""
Return JSON in this exact shape:
{
  "image_prompt": "one paragraph, 50-120 words, generation-ready"
}""")
    return "\n".join(parts)
