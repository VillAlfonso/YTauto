from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import content, trends

app = FastAPI(title="YTauto API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(trends.router)
app.include_router(content.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
