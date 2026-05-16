from fastapi import APIRouter, HTTPException

from ..ai import AIProviderError, get_provider
from ..ai.pipeline import (
    run_clusters,
    run_deep_dive,
    run_organize,
    run_route_mapper,
    run_script,
    run_title_forge,
)
from ..config import GENRES
from ..content_schemas import (
    ClusterRequest,
    ClusterResponse,
    DeepDiveRequest,
    DeepDiveResponse,
    Genre,
    OrganizeRequest,
    OrganizeResponse,
    RoutesRequest,
    RoutesResponse,
    Script,
    ScriptRequest,
    TitlesRequest,
    TitlesResponse,
)

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/genres", response_model=list[Genre])
async def list_genres() -> list[Genre]:
    return [Genre(key=k, label=v) for k, v in GENRES.items()]


@router.post("/deep-dive", response_model=DeepDiveResponse)
async def deep_dive(req: DeepDiveRequest) -> DeepDiveResponse:
    try:
        provider = get_provider()
        return await run_deep_dive(provider, req.genre, req.count, req.seed)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))


@router.post("/routes", response_model=RoutesResponse)
async def routes(req: RoutesRequest) -> RoutesResponse:
    try:
        provider = get_provider()
        return await run_route_mapper(provider, req.title, req.count)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))


@router.post("/organize", response_model=OrganizeResponse)
async def organize(req: OrganizeRequest) -> OrganizeResponse:
    try:
        provider = get_provider()
        return await run_organize(provider, req.findings)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))


@router.post("/script", response_model=Script)
async def script(req: ScriptRequest) -> Script:
    try:
        provider = get_provider()
        return await run_script(provider, req.story)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))


@router.post("/clusters", response_model=ClusterResponse)
async def clusters(req: ClusterRequest) -> ClusterResponse:
    try:
        provider = get_provider()
        return await run_clusters(provider, req.script)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))


@router.post("/titles", response_model=TitlesResponse)
async def titles(req: TitlesRequest) -> TitlesResponse:
    try:
        provider = get_provider()
        return await run_title_forge(provider, req.idea, req.count)
    except AIProviderError as e:
        raise HTTPException(502, detail=str(e))
