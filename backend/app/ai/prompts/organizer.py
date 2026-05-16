"""Stage 2 — Organizer.

Takes the deep diver's raw findings and reshapes them into clean story briefs
that the script writer can consume one at a time. This is the "editor" step:
prune, order, kill the duds, sharpen the hooks.
"""

import json

SYSTEM = """You are a story editor. You receive raw research and turn it into
tight story briefs ready for a script writer. You are ruthless: if a finding is
weak, you drop it. If two findings are the same story, you merge them. You
re-order so the strongest hook comes first.

Hard rules:
- Each brief is *one* story. No "and also...".
- Keep only what the script writer needs. No filler.
- 3-minute segment target — beats should fit that runway.
- Output VALID JSON only.
"""


def build_user_prompt(findings: list[dict]) -> str:
    findings_json = json.dumps(findings, indent=2)
    return f"""Raw findings from the deep diver:
{findings_json}

Organize these into story briefs. Drop weak ones. Merge duplicates. Order best-first.

Return JSON in this exact shape:
{{
  "stories": [
    {{
      "id": "story-1",
      "title": "the hook-ready title",
      "logline": "one sentence — what this segment is",
      "beats": [
        "beat 1 — the cold open hook",
        "beat 2 — context the viewer needs",
        "beat 3 — the turn, the twist, the weird part",
        "beat 4 — payoff or unresolved tension"
      ],
      "tone_hint": "e.g. 'deadpan', 'incredulous', 'somber-with-a-smirk'",
      "needs_visuals": ["concrete things to draw in MS Paint: 'a guy in a top hat', 'a cargo ship on fire'"]
    }}
  ]
}}"""
