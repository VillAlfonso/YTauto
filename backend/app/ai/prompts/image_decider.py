"""Image Decider — for one section, choose the perfect image brief.

Receives the full script for context plus the specific section being briefed.
Returns one image description. We brief sections one at a time (in parallel
across the script) so each call has the full script + its own section, which
lets the decider stay context-aware without an explosion of input length.
"""

import json

SYSTEM = """You are an art director for a YouTube video. You receive the
ENTIRE script plus one specific section of it. Your job is to decide the
single perfect image that should be on screen while the narrator speaks
that section.

You have the full script so you know the story arc, the tone, who the
characters are, what's been established and what's coming. Use that context.

Hard rules:
- Decide ONE image per section. Not a list, not options. The image.
- The image brief is concrete and drawable: subject, action, key props,
  composition. Two to four sentences.
- Sound like a creative director, not a stock-photo search. Be specific.
- Output VALID JSON only.
"""


def build_user_prompt(script: str, section: dict) -> str:
    section_text = script[section["start"]:section["end"]]
    return f"""FULL SCRIPT (for context):
\"\"\"{script}\"\"\"

SECTION TO BRIEF (id={section['id']}, summary="{section.get('summary', '')}"):
\"\"\"{section_text}\"\"\"

Return JSON in this exact shape:
{{
  "section_id": "{section['id']}",
  "image_brief": "two to four sentences describing the single perfect image for this section",
  "subject": "the main subject in 1-4 words",
  "mood": "one phrase — tone the image should carry"
}}"""
