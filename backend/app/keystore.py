"""Per-user API key store for image generation.

In-memory list backed by a JSON file (gitignored). One key is "active" at a
time. On a quota error (401/403/429) the caller flips the active key to
"exhausted" and the store activates the next available key. The user can
manually activate, deactivate, reset (clear exhausted), and delete keys
from the /keys page.

Never expose StoredKey to the API. Use to_public() so the response only
contains a masked preview of the key (first 4 + last 4 chars).
"""

from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from pydantic import BaseModel

KEYSTORE_PATH = Path(__file__).parent.parent / "keys.json"


class StoredKey(BaseModel):
    id: str
    label: str
    key: str
    active: bool = False
    exhausted: bool = False
    last_error: Optional[str] = None
    last_used_at: Optional[str] = None
    created_at: str


class PublicKey(BaseModel):
    """Same data but with the raw key replaced by a masked preview. Always
    return this from API endpoints — never StoredKey."""

    id: str
    label: str
    key_preview: str
    active: bool
    exhausted: bool
    last_error: Optional[str] = None
    last_used_at: Optional[str] = None
    created_at: str


def _mask(key: str) -> str:
    if len(key) <= 8:
        return "•••"
    return f"{key[:4]}…{key[-4:]}"


def _to_public(k: StoredKey) -> PublicKey:
    return PublicKey(
        id=k.id,
        label=k.label,
        key_preview=_mask(k.key),
        active=k.active,
        exhausted=k.exhausted,
        last_error=k.last_error,
        last_used_at=k.last_used_at,
        created_at=k.created_at,
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class KeyStore:
    def __init__(self, path: Path = KEYSTORE_PATH):
        self.path = path
        self._lock = threading.RLock()
        self._keys: list[StoredKey] = []
        self._load()

    # ---- persistence ----

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            self._keys = [StoredKey(**k) for k in data]
        except Exception:
            self._keys = []

    def _save(self) -> None:
        try:
            self.path.write_text(
                json.dumps([k.model_dump() for k in self._keys], indent=2),
                encoding="utf-8",
            )
        except Exception:
            # Don't crash if disk is read-only; in-memory state remains
            pass

    # ---- public-facing reads ----

    def list_public(self) -> list[PublicKey]:
        with self._lock:
            return [_to_public(k) for k in self._keys]

    # ---- mutations ----

    def add(self, label: str, key: str) -> PublicKey:
        with self._lock:
            new = StoredKey(
                id=uuid.uuid4().hex[:8],
                label=label.strip() or f"key {len(self._keys) + 1}",
                key=key.strip(),
                created_at=_now(),
            )
            # Convenience: if nothing is active yet, auto-activate the first key added.
            if not any(k.active and not k.exhausted for k in self._keys):
                new.active = True
            self._keys.append(new)
            self._save()
            return _to_public(new)

    def delete(self, key_id: str) -> bool:
        with self._lock:
            before = len(self._keys)
            self._keys = [k for k in self._keys if k.id != key_id]
            self._save()
            return len(self._keys) < before

    def activate(self, key_id: str) -> Optional[PublicKey]:
        with self._lock:
            target = next((k for k in self._keys if k.id == key_id), None)
            if target is None:
                return None
            for k in self._keys:
                k.active = k.id == key_id
            self._save()
            return _to_public(target)

    def deactivate(self, key_id: str) -> Optional[PublicKey]:
        with self._lock:
            target = next((k for k in self._keys if k.id == key_id), None)
            if target is None:
                return None
            target.active = False
            self._save()
            return _to_public(target)

    def reset(self, key_id: str) -> Optional[PublicKey]:
        """Clear the exhausted flag. Use when you know the quota has reset."""
        with self._lock:
            target = next((k for k in self._keys if k.id == key_id), None)
            if target is None:
                return None
            target.exhausted = False
            target.last_error = None
            self._save()
            return _to_public(target)

    # ---- runtime use ----

    def get_active_key(self) -> Optional[str]:
        """Returns the raw key value of the currently active, non-exhausted key,
        or None if no usable key is available."""
        with self._lock:
            for k in self._keys:
                if k.active and not k.exhausted:
                    k.last_used_at = _now()
                    # Don't bother saving on every read; last_used_at is best-effort
                    return k.key
            return None

    def log_error(self, key_value: str, error: str) -> None:
        """Record a non-quota error against a key so the UI can show it,
        without marking the key exhausted."""
        with self._lock:
            for k in self._keys:
                if k.key == key_value:
                    k.last_error = error[:200]
                    k.last_used_at = _now()
                    self._save()
                    return

    def mark_exhausted_and_rotate(self, key_value: str, error: str) -> Optional[str]:
        """The currently active key just hit a quota error. Mark it exhausted,
        activate the next non-exhausted key, return its raw value (or None)."""
        with self._lock:
            for k in self._keys:
                if k.key == key_value:
                    k.active = False
                    k.exhausted = True
                    k.last_error = error[:200]
                    k.last_used_at = _now()
                    break
            for k in self._keys:
                if not k.exhausted and not k.active:
                    k.active = True
                    self._save()
                    return k.key
            self._save()
            return None


# Module-level singleton.
keystore = KeyStore()
