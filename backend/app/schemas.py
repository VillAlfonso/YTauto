from datetime import datetime
from pydantic import BaseModel


class VideoRef(BaseModel):
    video_id: str
    title: str
    channel: str
    thumbnail: str
    published_at: datetime
    duration_seconds: int
    views: int
    likes: int
    comments: int
    view_velocity: float
    engagement_rate: float
    proxy_score: float
    url: str


class TrendTopic(BaseModel):
    query: str
    label: str
    rising_trend_score: float | None = None
    top_videos: list[VideoRef]
    topic_proxy_score: float


class TrendsResponse(BaseModel):
    category: str
    generated_at: datetime
    topics: list[TrendTopic]
