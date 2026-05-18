from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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
