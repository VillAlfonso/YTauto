from datetime import datetime
from typing import Iterable

import httpx

from .config import DURATION_MAX_SECONDS, DURATION_MIN_SECONDS, settings
from .schemas import VideoRef
from .scoring import compute_proxy_score, parse_iso8601_duration

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeError(RuntimeError):
    pass


async def _search_video_ids(client: httpx.AsyncClient, query: str, *, max_results: int = 25) -> list[str]:
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",
        "videoDuration": "medium",   # 4-20 min; we re-filter to 8-12 below
        "publishedAfter": _iso_n_days_ago(7),
        "maxResults": max_results,
        "key": settings.youtube_api_key,
    }
    r = await client.get(f"{YOUTUBE_API_BASE}/search", params=params, timeout=15.0)
    if r.status_code != 200:
        raise YouTubeError(f"search.list {r.status_code}: {r.text}")
    return [item["id"]["videoId"] for item in r.json().get("items", []) if item.get("id", {}).get("videoId")]


async def _hydrate_videos(client: httpx.AsyncClient, ids: Iterable[str]) -> list[VideoRef]:
    ids = [i for i in ids if i]
    if not ids:
        return []
    params = {
        "part": "snippet,contentDetails,statistics",
        "id": ",".join(ids[:50]),
        "key": settings.youtube_api_key,
    }
    r = await client.get(f"{YOUTUBE_API_BASE}/videos", params=params, timeout=15.0)
    if r.status_code != 200:
        raise YouTubeError(f"videos.list {r.status_code}: {r.text}")

    out: list[VideoRef] = []
    for item in r.json().get("items", []):
        duration = parse_iso8601_duration(item["contentDetails"]["duration"])
        if not (DURATION_MIN_SECONDS <= duration <= DURATION_MAX_SECONDS):
            continue

        stats = item.get("statistics", {})
        views = int(stats.get("viewCount", 0))
        likes = int(stats.get("likeCount", 0))
        comments = int(stats.get("commentCount", 0))
        if views < 1000:
            continue

        published_at = datetime.fromisoformat(item["snippet"]["publishedAt"].replace("Z", "+00:00"))
        score, velocity, engagement = compute_proxy_score(views, likes, comments, published_at)

        out.append(
            VideoRef(
                video_id=item["id"],
                title=item["snippet"]["title"],
                channel=item["snippet"]["channelTitle"],
                thumbnail=item["snippet"]["thumbnails"].get("high", {}).get("url", ""),
                published_at=published_at,
                duration_seconds=duration,
                views=views,
                likes=likes,
                comments=comments,
                view_velocity=velocity,
                engagement_rate=engagement,
                proxy_score=score,
                url=f"https://www.youtube.com/watch?v={item['id']}",
            )
        )
    return out


async def top_videos_for_query(query: str, *, top_n: int = 3) -> list[VideoRef]:
    if not settings.youtube_api_key:
        raise YouTubeError("YOUTUBE_API_KEY not configured")
    async with httpx.AsyncClient() as client:
        ids = await _search_video_ids(client, query)
        videos = await _hydrate_videos(client, ids)
    videos.sort(key=lambda v: v.proxy_score, reverse=True)
    return videos[:top_n]


def _iso_n_days_ago(n: int) -> str:
    from datetime import datetime, timedelta, timezone
    return (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%SZ")
