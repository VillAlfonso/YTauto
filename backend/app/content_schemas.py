from __future__ import annotations

from pydantic import BaseModel, Field


class Finding(BaseModel):
    working_title: str
    hook: str
    key_facts: list[str] = Field(default_factory=list)
    characters: list[str] = Field(default_factory=list)
    tensions: list[str] = Field(default_factory=list)
    sources_hint: str = ""
    confidence: str = "medium"


class DeepDiveResponse(BaseModel):
    genre: str
    findings: list[Finding]


class Story(BaseModel):
    id: str
    title: str
    logline: str
    beats: list[str] = Field(default_factory=list)
    tone_hint: str = ""
    needs_visuals: list[str] = Field(default_factory=list)


class OrganizeResponse(BaseModel):
    stories: list[Story]


class Script(BaseModel):
    story_id: str
    title: str
    script: str
    target_seconds: int = 180
    word_count: int = 0


class Cluster(BaseModel):
    id: str
    start: int
    end: int
    color: str
    label: str = ""
    suggested_image: str
    scene_description: str = ""


class ClusterResponse(BaseModel):
    script: str
    clusters: list[Cluster]


class Genre(BaseModel):
    key: str
    label: str


# ---- request bodies ----


class DeepDiveSeed(BaseModel):
    title: str
    angle: str = ""
    treatment: str = ""


class DeepDiveRequest(BaseModel):
    genre: str
    count: int = 5
    seed: DeepDiveSeed | None = None


class OrganizeRequest(BaseModel):
    findings: list[Finding]


class ScriptRequest(BaseModel):
    story: Story


class ClusterRequest(BaseModel):
    script: str


# ---- Title Forge ----


class TitleCandidate(BaseModel):
    text: str
    hook_style: str = ""
    reasoning: str = ""


class TitlesResponse(BaseModel):
    idea: str
    titles: list[TitleCandidate]


class TitlesRequest(BaseModel):
    idea: str
    count: int = 5


# ---- Route Mapper ----


class Route(BaseModel):
    id: str
    label: str
    angle: str
    treatment: str = ""
    why_this_works: str = ""


class RoutesResponse(BaseModel):
    title: str
    routes: list[Route]


class RoutesRequest(BaseModel):
    title: str
    count: int = 4
