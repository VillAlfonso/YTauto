"""Stage 1 — Deep Diver.

Goal: surface raw, juicy, *story-shaped* material in the given genre.
We are NOT writing the script here. We are collecting ammunition.

Iterate freely. Swap to alt versions when the videos start feeling formulaic.
"""

SYSTEM = """You are a relentless researcher who finds stories the internet hasn't
chewed to death. Your job is to surface raw material — weird incidents, unresolved
mysteries, lesser-known characters, counterintuitive facts — in the genre given to
you. You do NOT write scripts. You do NOT add fluff. You write dense, factual,
*specific* notes a screenwriter can use.

Hard rules:
- Specifics over generalities. Names, dates, numbers, places, quotes.
- Prefer the strange, the petty, the human, the disputed. Avoid Wikipedia-tier
  factoids that every channel already covered.
- If you don't know something concretely, say "unverified" — never invent details.
- Output VALID JSON only. No prose outside the JSON object.
"""


def build_user_prompt(genre: str, count: int = 5, seed: dict | None = None) -> str:
    """Two modes:
      - genre-only: broad discovery, N distinct stories within the genre
      - seed mode: the creator has already chosen a specific title + angle;
        we stay *inside* that topic and surface sub-stories, key beats,
        characters, contradictions that build out the chosen angle into a
        ~10-minute video.
    """
    if seed:
        return f"""The creator has already chosen a focus:
  Title:     {seed.get('title', '')}
  Angle:     {seed.get('angle', '')}
  Treatment: {seed.get('treatment', '')}
  Genre context: {genre}

Find {count} pieces of raw material that build THIS specific video out into a
~10-minute runtime. These are sub-stories, supporting characters, key facts,
contradictions, anecdotes — *within* the chosen angle. Do not drift to other
framings of the same topic. Stay on-angle.

Return JSON in this exact shape:
{{
  "findings": [
    {{
      "working_title": "short, blunt — a sub-beat of the larger video",
      "hook": "one sentence: why this slice of the topic matters",
      "key_facts": ["specific fact", "specific fact", "..."],
      "characters": ["name + one-line role", "..."],
      "tensions": ["the conflict, the unresolved bit, the irony"],
      "sources_hint": "where this came from (book, court doc, forum thread, etc.)",
      "confidence": "high|medium|low"
    }}
  ]
}}"""

    return f"""Genre: {genre}
Find {count} distinct story candidates. For each, return raw research dense enough
that a script writer could build a 3-minute segment from it.

Return JSON in this exact shape:
{{
  "findings": [
    {{
      "working_title": "short, blunt — not clickbait yet",
      "hook": "one sentence: why anyone should care",
      "key_facts": ["specific fact", "specific fact", "..."],
      "characters": ["name + one-line role", "..."],
      "tensions": ["the conflict, the unresolved bit, the irony"],
      "sources_hint": "where this came from (book, court doc, forum thread, etc.)",
      "confidence": "high|medium|low"
    }}
  ]
}}"""
