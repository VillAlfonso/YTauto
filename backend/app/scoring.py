import math
import re
from datetime import datetime, timezone

ISO8601_DURATION = re.compile(
    r"^P(?:(?P<days>\d+)D)?T?(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?$"
)


def parse_iso8601_duration(value: str) -> int:
    m = ISO8601_DURATION.match(value or "")
    if not m:
        return 0
    parts = {k: int(v) if v else 0 for k, v in m.groupdict().items()}
    return parts["days"] * 86400 + parts["hours"] * 3600 + parts["minutes"] * 60 + parts["seconds"]


def hours_since(published_at: datetime) -> float:
    now = datetime.now(timezone.utc)
    delta = now - published_at
    return max(delta.total_seconds() / 3600.0, 1.0)


def compute_proxy_score(
    views: int,
    likes: int,
    comments: int,
    published_at: datetime,
    *,
    w_velocity: float = 10.0,
    w_engagement: float = 1000.0,
) -> tuple[float, float, float]:
    """
    Returns (proxy_score, view_velocity, engagement_rate).

    Retention is private, so we approximate it. The intuition:
    - High view_velocity = the algorithm is actively pushing the video,
      which only happens when retention is strong.
    - High engagement_rate = viewers cared enough to interact, a strong
      retention correlate.
    - log10 on velocity prevents one viral hit from dominating the topic.
    - A mild age penalty rewards videos that are still climbing.
    """
    hrs = hours_since(published_at)
    velocity = views / hrs
    engagement = (likes + comments) / views if views > 0 else 0.0

    age_penalty = math.log10(hrs / 24.0 + 1.0)  # ~0 for a day-old, ~1 for ~10 days

    score = (
        math.log10(velocity + 1.0) * w_velocity
        + engagement * w_engagement
        - age_penalty
    )
    return score, velocity, engagement
