import asyncio
from datetime import datetime, timezone

from cachetools import TTLCache
from fastapi import APIRouter, HTTPException, Query

from ..config import CATEGORIES, settings
from ..google_trends import get_rising_score
from ..schemas import TrendsResponse, TrendTopic
from ..youtube import YouTubeError, top_videos_for_query

router = APIRouter(prefix="/api", tags=["trends"])

# Per-category cache. Swap for Redis when you scale past one worker.
_cache: TTLCache[str, TrendsResponse] = TTLCache(maxsize=64, ttl=settings.cache_ttl_seconds)


@router.get("/trends", response_model=TrendsResponse)
async def get_trends(category: str = Query(..., description="Category key, e.g. 'anime'")) -> TrendsResponse:
    key = category.lower()
    if key not in CATEGORIES:
        raise HTTPException(404, detail=f"unknown category '{category}'")

    cached = _cache.get(key)
    if cached is not None:
        return cached

    cfg = CATEGORIES[key]
    try:
        per_query = await asyncio.gather(*(top_videos_for_query(q) for q in cfg["queries"]))
    except YouTubeError as e:
        raise HTTPException(502, detail=str(e))

    topics: list[TrendTopic] = []
    for query, videos in zip(cfg["queries"], per_query):
        if not videos:
            continue
        topic_score = sum(v.proxy_score for v in videos) / len(videos)
        rising = await get_rising_score(query)
        topics.append(
            TrendTopic(
                query=query,
                label=query.title(),
                rising_trend_score=rising,
                top_videos=videos,
                topic_proxy_score=topic_score,
            )
        )

    topics.sort(key=lambda t: t.topic_proxy_score, reverse=True)
    response = TrendsResponse(
        category=key,
        generated_at=datetime.now(timezone.utc),
        topics=topics,
    )
    _cache[key] = response
    return response


@router.get("/categories")
async def list_categories() -> list[dict]:
    return [{"key": k, "label": v["label"]} for k, v in CATEGORIES.items()]
