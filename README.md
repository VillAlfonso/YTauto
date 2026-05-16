# YTauto — Trend Analytics + Automated Video Pipeline

Monorepo:
- `backend/` — FastAPI service. Trend ingestion, proxy scoring, future video render pipeline.
- `frontend/` — Next.js (App Router) dashboard. Capacitor-ready for APK wrap.

## Why this split

YouTube Data API quota is 10,000 units/day. `search.list` is 100 units, `videos.list` is 1. We must cache and aggregate server-side — the browser never talks to YouTube directly.

The Engagement Proxy Score stands in for retention (which is private to each video's owner):

```
proxy = log10(view_velocity + 1) * W_velocity
      + engagement_rate * W_engagement
      - age_penalty
```

where `view_velocity = views / hours_since_publish` and
`engagement_rate = (likes + comments) / views`.

A video stays in the candidate pool only if duration ∈ [8, 12] minutes.

## Quick start

### Backend
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # fill in YOUTUBE_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

1. **Done:** Trend dashboard, proxy scoring, Google Trends augmentation hook.
2. Postgres for historical proxy curves (catch trends before they peak).
3. Video render worker (FFmpeg + TTS + stock B-roll).
4. Capacitor APK wrap of the dashboard.
