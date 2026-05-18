from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import content, keys

app = FastAPI(title="YTauto API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(keys.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
