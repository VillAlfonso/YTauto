"""Pipeline orchestrator.

Each stage is its own function so the router can expose them granularly and
the frontend can show progress between stages. Keep this file thin — prompts
live in ./prompts/, provider plumbing lives in ./provider.py and ./gemini.py.
"""

from __future__ import annotations

import json
import re

from ..content_schemas import (
    Cluster,
    ClusterResponse,
    DeepDiveResponse,
    DeepDiveSeed,
    Finding,
    OrganizeResponse,
    Route,
    RoutesResponse,
    Script,
    Story,
    TitleCandidate,
    TitlesResponse,
)
from .prompts import (
    cluster_analyzer,
    deep_diver,
    organizer,
    route_mapper,
    script_writer,
    title_forge,
)
from .provider import AIProvider, AIProviderError, GenerationRequest

# Distinct, high-contrast colors that read well on a dark background.
# Cycles if there are more clusters than colors.
CLUSTER_PALETTE = [
    "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c780fa",
    "#ff9f43", "#1dd1a1", "#54a0ff", "#ee5253", "#feca57",
    "#5f27cd", "#10ac84", "#ff6348", "#48dbfb", "#a55eea",
]


def _extract_json(text: str) -> dict:
    """Models occasionally wrap JSON in ```json fences even with json_mode on.
    Strip fences and parse defensively.
    """
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise AIProviderError(f"model returned non-JSON: {text[:300]}") from e


async def run_deep_dive(
    provider: AIProvider,
    genre: str,
    count: int = 5,
    seed: DeepDiveSeed | None = None,
) -> DeepDiveResponse:
    seed_dict = seed.model_dump() if seed else None
    raw = await provider.generate(
        GenerationRequest(
            prompt=deep_diver.build_user_prompt(genre, count, seed_dict),
            system=deep_diver.SYSTEM,
            json_mode=True,
        )
    )
    data = _extract_json(raw)
    findings = [Finding(**f) for f in data.get("findings", [])]
    return DeepDiveResponse(genre=genre, findings=findings)


async def run_route_mapper(provider: AIProvider, title: str, count: int = 4) -> RoutesResponse:
    raw = await provider.generate(
        GenerationRequest(
            prompt=route_mapper.build_user_prompt(title, count),
            system=route_mapper.SYSTEM,
            json_mode=True,
            temperature=0.9,
            max_output_tokens=1536,
        )
    )
    data = _extract_json(raw)
    routes = [Route(**r) for r in data.get("routes", [])]
    return RoutesResponse(title=title, routes=routes)


async def run_organize(provider: AIProvider, findings: list[Finding]) -> OrganizeResponse:
    raw = await provider.generate(
        GenerationRequest(
            prompt=organizer.build_user_prompt([f.model_dump() for f in findings]),
            system=organizer.SYSTEM,
            json_mode=True,
        )
    )
    data = _extract_json(raw)
    stories = [Story(**s) for s in data.get("stories", [])]
    return OrganizeResponse(stories=stories)


async def run_script(provider: AIProvider, story: Story) -> Script:
    raw = await provider.generate(
        GenerationRequest(
            prompt=script_writer.build_user_prompt(story.model_dump()),
            system=script_writer.SYSTEM,
            json_mode=True,
            max_output_tokens=2048,
        )
    )
    data = _extract_json(raw)
    script_text = data.get("script", "")
    return Script(
        story_id=data.get("story_id", story.id),
        title=data.get("title", story.title),
        script=script_text,
        target_seconds=int(data.get("target_seconds", 180)),
        word_count=len(script_text.split()),
    )


async def run_title_forge(provider: AIProvider, idea: str, count: int = 5) -> TitlesResponse:
    raw = await provider.generate(
        GenerationRequest(
            prompt=title_forge.build_user_prompt(idea, count),
            system=title_forge.SYSTEM,
            json_mode=True,
            temperature=1.0,
            max_output_tokens=1024,
        )
    )
    data = _extract_json(raw)
    titles = [TitleCandidate(**t) for t in data.get("titles", [])]
    return TitlesResponse(idea=idea, titles=titles)


async def run_clusters(provider: AIProvider, script_text: str) -> ClusterResponse:
    raw = await provider.generate(
        GenerationRequest(
            prompt=cluster_analyzer.build_user_prompt(script_text),
            system=cluster_analyzer.SYSTEM,
            json_mode=True,
            max_output_tokens=3072,
        )
    )
    data = _extract_json(raw)
    raw_clusters = data.get("clusters", [])
    clusters = _normalize_clusters(raw_clusters, len(script_text))
    return ClusterResponse(script=script_text, clusters=clusters)


def _normalize_clusters(raw: list[dict], script_len: int) -> list[Cluster]:
    """Fix common model mistakes: out-of-range indices, overlaps, missing colors.
    We trust order; we clamp ranges; we assign palette colors deterministically.
    """
    out: list[Cluster] = []
    cursor = 0
    for i, c in enumerate(raw):
        start = max(int(c.get("start", cursor)), cursor)
        end = min(int(c.get("end", start)), script_len)
        if end <= start:
            continue
        out.append(
            Cluster(
                id=c.get("id") or f"c{i+1}",
                start=start,
                end=end,
                color=CLUSTER_PALETTE[i % len(CLUSTER_PALETTE)],
                label=c.get("label", ""),
                suggested_image=c.get("suggested_image", ""),
                scene_description=c.get("scene_description", ""),
            )
        )
        cursor = end
    return out
