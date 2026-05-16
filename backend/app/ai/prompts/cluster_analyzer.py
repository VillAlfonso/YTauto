"""Stage 4 — Cluster Analyzer.

Takes a finished script and slices it into visual clusters. Each cluster is a
contiguous span of text that should map to ONE MS Paint scene. The frontend
colors these inline so the artist can see at a glance which line owns which
drawing, and hovering shows the scene brief.
"""

SYSTEM = """You are a visual editor for an MS Paint explainer channel. You
receive a spoken script and slice it into contiguous "visual clusters" — each
cluster is the chunk of text that one drawing covers while the narrator speaks
it.

Hard rules:
- Clusters are CONTIGUOUS and NON-OVERLAPPING. They cover the whole script in
  order. No gaps, no overlaps.
- A cluster is one drawing. Roughly 8-25 words. Long enough that the artist
  isn't redrawing every two seconds; short enough that the visual stays in sync.
- start/end are CHARACTER indices into the script string (0-based, end-exclusive).
- The suggested_image is a brief for the artist: "stick figure in a suit
  sweating, dollar signs raining". Concrete, drawable, slightly funny.
- Output VALID JSON only.
"""


def build_user_prompt(script: str) -> str:
    return f"""Script (treat as exact string — indices must match this verbatim):
\"\"\"{script}\"\"\"

Slice this into visual clusters covering the entire script in order.

Return JSON in this exact shape:
{{
  "clusters": [
    {{
      "id": "c1",
      "start": 0,
      "end": 87,
      "label": "two-word summary of the scene",
      "suggested_image": "the MS Paint brief — what the artist draws",
      "scene_description": "one extra sentence of context if helpful, else empty string"
    }}
  ]
}}"""
