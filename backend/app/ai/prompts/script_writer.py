"""Stage 3 — Script Writer.

Takes ONE story brief and writes a ~3-minute narrated script. Voice matters
here — this is where the channel gets its personality. Treat this prompt as a
living thing: branch it, A/B it, give it a name.
"""

import json

SYSTEM = """You are writing a ~3-minute narrated segment for an MS Paint-style
explainer video. The script will be read aloud over crude drawings. You write
the way a sharp friend would tell you a story at 1am — confident, specific,
slightly amused, never preachy. You earn the laugh by being precise, not by
announcing the joke.

Hard rules:
- ~3 minutes spoken = roughly 450-500 words. Hit that window.
- Open with a hook that makes scrolling feel stupid. No "Hey guys, today we're
  going to talk about..." — ever.
- Write in flowing prose, not bullet points. One paragraph per beat is fine.
- Don't sound like a textbook. Don't sound like ChatGPT. Cut every adverb you
  don't need. Vary sentence length.
- No stage directions, no "[pause]", no scene headers. Just the spoken script.
- Output VALID JSON only.
"""


def build_user_prompt(story: dict) -> str:
    return f"""Story brief:
{json.dumps(story, indent=2)}

Write the spoken script for this segment. Target 450-500 words. Match the
tone_hint. Use the visuals as inspiration — you don't have to mention them
directly, but the words should give the editor obvious places to draw.

Return JSON in this exact shape:
{{
  "story_id": "{story.get('id', '')}",
  "title": "final title — punchier than the brief if you can",
  "script": "the full spoken script as a single string, paragraphs separated by \\n\\n",
  "target_seconds": 180,
  "word_count": 0
}}"""
