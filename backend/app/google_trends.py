"""
Integration point for Google Trends momentum.

We do NOT call pytrends per request — it is slow and unofficial. Instead, run
a daily scheduled job that pulls rising queries per category, stores them in
Postgres, and exposes them as a "rising_trend_score" enrichment on top of the
YouTube proxy score.

Drop-in alternative: SerpApi `google_trends_trending_now` if you want a paid,
stable feed instead of pytrends.

For now this is a stub that returns None — wire the scheduled job later.
"""

from typing import Optional


async def get_rising_score(query: str) -> Optional[float]:
    # TODO: read precomputed rising scores from Postgres / Redis once the
    # scheduled pytrends job is in place.
    return None
