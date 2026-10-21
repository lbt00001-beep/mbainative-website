"""Claves de OpenRouter por familia.

Cada familia guarda su propia clave (cifrada con la SECRET_KEY del servidor). Si el servidor
tiene además una clave propia (OPENROUTER_API_KEY, p. ej. en el .env de un PC), se usa como
reserva para las familias que no hayan puesto la suya. En la versión publicada no hay clave de
servidor: cada familia paga su propio uso.
"""
from __future__ import annotations

import base64
import hashlib

import httpx
from cryptography.fernet import Fernet, InvalidToken

from . import config
from .db import Family, SessionLocal

MISSING_MESSAGE = ("La IA no está disponible porque tu familia todavía no tiene clave de OpenRouter. "
                   "Añádela en Ajustes › Clave de OpenRouter (se consigue en openrouter.ai/keys).")


def _fernet() -> Fernet:
    digest = hashlib.sha256(("pupitre-claves:" + config.SECRET_KEY).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(key: str) -> str:
    return _fernet().encrypt(key.encode()).decode()


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return ""  # p. ej. si cambió SECRET_KEY: la familia tendrá que volver a ponerla


def family_key(family_id: int | None) -> str:
    if family_id is None:
        return ""
    with SessionLocal() as db:
        f = db.get(Family, family_id)
        return decrypt(f.openrouter_key_enc) if f else ""


def key_for(family_id: int | None) -> str:
    """Clave a usar: la de la familia o, si no tiene, la del servidor."""
    return family_key(family_id) or (config.OPENROUTER_API_KEY if config.AI_READY else "")


def source(family_id: int | None) -> str:
    """'familia', 'servidor' o '' (sin clave)."""
    if family_key(family_id):
        return "familia"
    return "servidor" if config.AI_READY else ""


def ready(family_id: int | None) -> bool:
    return bool(key_for(family_id))


def mask(key: str) -> str:
    return f"{key[:8]}…{key[-4:]}" if len(key) > 14 else "…"


def validate(key: str) -> dict:
    """Comprueba la clave contra OpenRouter. Devuelve {ok, error?, limit_remaining?, usage?}."""
    key = key.strip()
    if not key.startswith("sk-"):
        return {"ok": False, "error": "La clave de OpenRouter empieza por «sk-or-». Revisa que la has copiado entera."}
    try:
        r = httpx.get("https://openrouter.ai/api/v1/key", headers={"Authorization": f"Bearer {key}"}, timeout=20)
    except httpx.HTTPError:
        return {"ok": False, "error": "No se ha podido contactar con OpenRouter para comprobar la clave. Inténtalo de nuevo."}
    if r.status_code in (401, 403):
        return {"ok": False, "error": "OpenRouter dice que esa clave no es válida."}
    if r.status_code != 200:
        return {"ok": False, "error": f"OpenRouter respondió con un error ({r.status_code}). Inténtalo de nuevo."}
    d = r.json().get("data", {}) or {}
    return {"ok": True, "limit_remaining": d.get("limit_remaining"), "usage": d.get("usage"), "label": d.get("label")}
