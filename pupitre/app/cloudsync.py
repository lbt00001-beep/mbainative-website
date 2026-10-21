"""Copia de seguridad continua de la base de datos SQLite en Cloud Storage.

En Cloud Run el disco se borra al reiniciar. Si se define GCS_BUCKET:
  - al arrancar, se descarga la última copia (pupitre.db) del bucket;
  - tras cada petición que cambia datos, se sube una copia consistente (como mucho cada pocos
    segundos, para no subirla en cada clic);
  - al apagarse la instancia, se sube la copia final.
Así no hace falta ningún servicio de base de datos externo. Requiere una sola instancia
(--max-instances 1), que es lo adecuado para un uso entre familias y amigos.
"""
from __future__ import annotations

import logging
import os
import sqlite3
import threading
import time
from pathlib import Path

log = logging.getLogger("pupitre.cloudsync")

BUCKET = os.environ.get("GCS_BUCKET", "").strip()
OBJECT = os.environ.get("GCS_OBJECT", "pupitre.db").strip()
MIN_INTERVAL = float(os.environ.get("GCS_SYNC_SECONDS", "4"))

_lock = threading.Lock()
_state = {"dirty": False, "last_upload": 0.0, "db_path": None}


def enabled() -> bool:
    return bool(BUCKET)


def _blob():
    from google.cloud import storage  # solo se necesita en Cloud Run
    return storage.Client().bucket(BUCKET).blob(OBJECT)


def restore(db_path: Path) -> None:
    """Descarga la última copia antes de abrir la base de datos."""
    _state["db_path"] = db_path
    if not enabled():
        return
    db_path.parent.mkdir(parents=True, exist_ok=True)
    blob = _blob()
    if blob.exists():
        blob.download_to_filename(str(db_path))
        log.info("Base de datos restaurada desde gs://%s/%s (%d bytes)", BUCKET, OBJECT, db_path.stat().st_size)
    else:
        log.info("No hay copia previa en gs://%s/%s: se empieza con una base de datos nueva", BUCKET, OBJECT)


def upload(force: bool = False) -> bool:
    """Sube una copia consistente (API de copia de SQLite) si hay cambios pendientes."""
    db_path = _state["db_path"]
    if not enabled() or not db_path or not Path(db_path).exists():
        return False
    with _lock:
        if not force and not _state["dirty"]:
            return False
        _state["dirty"] = False  # antes de copiar: un commit durante la subida vuelve a marcarlo
        tmp = Path(str(db_path) + ".subida")
        src = sqlite3.connect(str(db_path))
        dst = sqlite3.connect(str(tmp))
        try:
            src.backup(dst)
        finally:
            dst.close()
            src.close()
        try:
            _blob().upload_from_filename(str(tmp))
            _state["last_upload"] = time.time()
            return True
        except Exception:  # noqa: BLE001 - se reintentará en la siguiente petición
            log.exception("No se pudo subir la copia de la base de datos")
            _state["dirty"] = True
            return False
        finally:
            tmp.unlink(missing_ok=True)


def mark_dirty() -> None:
    """Se llama tras cada commit de la base de datos (evento de SQLAlchemy)."""
    _state["dirty"] = True


def maybe_upload() -> None:
    """Se llama al terminar cada petición: sube si hay cambios y ha pasado el intervalo mínimo."""
    if enabled() and _state["dirty"] and time.time() - _state["last_upload"] >= MIN_INTERVAL:
        upload()


def start_background() -> None:
    """Hilo de respaldo: sube los cambios pendientes que no se subieron por el intervalo mínimo
    (p. ej. del procesamiento de un libro en segundo plano)."""
    if not enabled():
        return

    def loop():
        while True:
            time.sleep(max(MIN_INTERVAL, 5))
            try:
                upload()
            except Exception:  # noqa: BLE001
                log.exception("Error en la copia periódica")

    threading.Thread(target=loop, daemon=True, name="cloudsync").start()
