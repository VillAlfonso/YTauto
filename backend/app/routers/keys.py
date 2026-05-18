from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..ai import image_backend
from ..keystore import PublicKey, keystore

router = APIRouter(prefix="/api/keys", tags=["keys"])


class AddKeyRequest(BaseModel):
    label: str = ""
    key: str


@router.get("", response_model=list[PublicKey])
async def list_keys() -> list[PublicKey]:
    return keystore.list_public()


@router.post("", response_model=PublicKey)
async def add_key(req: AddKeyRequest) -> PublicKey:
    if not req.key.strip():
        raise HTTPException(400, detail="key cannot be empty")
    return keystore.add(req.label, req.key)


@router.delete("/{key_id}")
async def delete_key(key_id: str) -> dict:
    if not keystore.delete(key_id):
        raise HTTPException(404, detail="key not found")
    return {"ok": True}


@router.post("/{key_id}/activate", response_model=PublicKey)
async def activate_key(key_id: str) -> PublicKey:
    pub = keystore.activate(key_id)
    if not pub:
        raise HTTPException(404, detail="key not found")
    return pub


@router.post("/{key_id}/deactivate", response_model=PublicKey)
async def deactivate_key(key_id: str) -> PublicKey:
    pub = keystore.deactivate(key_id)
    if not pub:
        raise HTTPException(404, detail="key not found")
    return pub


@router.post("/{key_id}/reset", response_model=PublicKey)
async def reset_key(key_id: str) -> PublicKey:
    """Clear the exhausted flag — call when you know the quota has reset."""
    pub = keystore.reset(key_id)
    if not pub:
        raise HTTPException(404, detail="key not found")
    return pub


class TestKeyResponse(BaseModel):
    ok: bool
    image_url: str | None = None
    error: str | None = None  # "quota" | "invalid" | "other"
    detail: str | None = None


@router.post("/{key_id}/test", response_model=TestKeyResponse)
async def test_key(key_id: str) -> TestKeyResponse:
    """Burns ONE image generation call on this key so you can verify the
    end-to-end setup without running a full pipeline batch. Marks the key
    exhausted on quota errors; records last_error on others."""
    raw = keystore.get_raw_key(key_id)
    if not raw:
        raise HTTPException(404, detail="key not found")
    try:
        url = await image_backend.test_one(raw)
        return TestKeyResponse(ok=True, image_url=url)
    except image_backend.QuotaError as e:
        keystore.mark_exhausted_and_rotate(raw, str(e))
        return TestKeyResponse(ok=False, error="quota", detail=str(e)[:300])
    except Exception as e:
        msg = str(e)
        keystore.log_error(raw, msg)
        kind = "invalid" if "API_KEY_INVALID" in msg or " 400" in msg else "other"
        return TestKeyResponse(ok=False, error=kind, detail=msg[:300])
