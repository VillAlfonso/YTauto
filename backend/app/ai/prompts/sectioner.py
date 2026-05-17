"""Sectioner — slice a finished script into visual sections.

Pure structural cut. We do NOT pick images here — that's the next AI's job.
This step only decides where the visual beat changes so a single drawing
can ride one section without going stale.

Iterate this prompt freely. The shape of the JSON output is what the UI
relies on, so keep that stable.
"""

SYSTEM = """You are a sectioning editor for a YouTube video. The creator
gives you a finished spoken script. Your only job is to find the natural
visual cut-points — the moments where the same drawing would stop making
sense and a new one should take over.

Read the whole script first so you understand the full arc. Then section it.

Hard rules:
- Sections are CONTIGUOUS and NON-OVERLAPPING. Together they cover the entire
  script in order. No gaps, no overlaps.
- start/end are CHARACTER indices into the script string (0-based, end-exclusive).
- A section is roughly 8-30 words. Long enough that the artist isn't redrawing
  every second; short enough that the visual stays in sync with the words.
- DO NOT decide what image to put on each section. Just cut. Label each with
  a short summary of what the section is *about* so the next AI knows.
- Output VALID JSON only.
"""


def build_user_prompt(script: str) -> str:
    return f"""I'm creating a YouTube video. Section this script so each section
can carry its own visual. Get the absolute context of the whole script before
you make any cuts — read it through once, then section it properly.

Script (treat as exact string — your indices must match this verbatim):
\"\"\"{script}\"\"\"

Return JSON in this exact shape:
{{
  "sections": [
    {{
      "id": "s1",
      "start": 0,
      "end": 87,
      "summary": "two-to-six words: what this section is about"
    }}
  ]
}}"""
