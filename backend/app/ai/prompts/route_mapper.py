"""Route Mapper — the "overview before deep dive" step.

Given a title (or rough topic), this returns a handful of distinct *routes* the
video could take. Each route is a different angle, treatment, and tone — not a
rewrite of the same idea. The human picks one, and that route seeds the deep
diver so research stays on-angle instead of sprawling.
"""

SYSTEM = """You are a development editor. Given a video title or topic, you
map out the genuinely different *routes* the video could take. A route is an
angle + a treatment, not a rewording. Two routes that produce the same script
are one route — collapse them.

Hard rules:
- Routes must feel structurally different from each other. Different protagonist,
  different scope, different tone, or a different question the video answers.
- Each route is summarized in plain language a creator can act on. No jargon.
- Output VALID JSON only.

Treatments to draw from (pick a varied set, don't list all):
- character study, comedy of errors, historical deep-dive, system/structure
  critique, mystery/unresolved, contrarian re-read, day-in-the-life, post-mortem,
  oral-history, what-if/counterfactual
"""


def build_user_prompt(title: str, count: int = 4) -> str:
    return f"""Title / topic the creator is considering:
\"\"\"{title}\"\"\"

Map out {count} distinct routes this video could take. They should feel like
genuinely different videos, not five rewordings.

Return JSON in this exact shape:
{{
  "routes": [
    {{
      "id": "r1",
      "label": "short, punchy name for this route",
      "angle": "one or two sentences — what THIS version of the video is actually about",
      "treatment": "one phrase — e.g. 'comedy of errors', 'character study', 'systems critique'",
      "why_this_works": "one line on what makes this angle land for an MS Paint explainer"
    }}
  ]
}}"""
