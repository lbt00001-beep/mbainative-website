"""Pupitre · API y servidor web."""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import random
import secrets
import threading
import time
from pathlib import Path
from datetime import date, datetime, timedelta

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from . import ai, cloudsync, config, ingest, keys, learning, reports
from .db import (Activity, AiUsage, Answer, ChatMessage, Chunk, Document, Family, Flashcard, ReportLog,
                 SessionLocal, Student, Subject, Topic, init_db)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("pupitre")
logging.getLogger("httpx").setLevel(logging.WARNING)

VERSION = "1.4.0"
app = FastAPI(title=config.APP_NAME, docs_url=None, redoc_url=None)
app.add_middleware(SessionMiddleware, secret_key=config.SECRET_KEY, max_age=60 * 60 * 24 * 60,
                   same_site="lax", https_only=config.APP_URL.startswith("https"), session_cookie="pupitre")
STATIC = config.BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.middleware("http")
async def _cloud_backup(request: Request, call_next):
    response = await call_next(request)
    if cloudsync.enabled():
        from starlette.concurrency import run_in_threadpool
        await run_in_threadpool(cloudsync.maybe_upload)
    return response


@app.on_event("shutdown")
def _shutdown():
    if cloudsync.enabled():
        cloudsync.upload(force=True)
        log.info("Copia final de la base de datos subida a Cloud Storage")


@app.on_event("startup")
def _startup():
    from .db import SQLITE_PATH
    if cloudsync.enabled():
        if not SQLITE_PATH:
            raise RuntimeError("GCS_BUCKET solo funciona con la base de datos SQLite integrada")
        cloudsync.restore(SQLITE_PATH)
    init_db()
    cloudsync.start_background()
    with SessionLocal() as db:  # lecturas que se cortaron por un reinicio (hay un solo proceso)
        for d in db.query(Document).filter(Document.status.in_(["procesando", "cancelando"])):
            d.status = "detenido"
            d.note = (f"Interrumpido por un reinicio: {d.ocr_done} de {d.ocr_total} páginas escaneadas leídas. "
                      "Lo ya leído no se vuelve a pagar.")
        db.commit()
    log.info("Pupitre listo. IA: %s (respaldo %s). Clave del servidor: %s", config.MODEL_MAIN,
             config.MODEL_FALLBACK, "sí" if config.AI_READY else "no (cada familia pone la suya)")


@app.exception_handler(ai.AiError)
async def _ai_error(_: Request, exc: ai.AiError):
    return JSONResponse({"detail": str(exc)}, status_code=503)


# ---------------------------------------------------------------------------
# Utilidades: BD, seguridad y permisos
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_secret(secret: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", secret.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${h}"


def check_secret(secret: str, stored: str) -> bool:
    try:
        salt, h = stored.split("$", 1)
    except ValueError:
        return False
    calc = hashlib.pbkdf2_hmac("sha256", secret.encode(), salt.encode(), 200_000).hex()
    return hmac.compare_digest(calc, h)


def family_id(request: Request) -> int:
    fid = request.session.get("fid")
    if not fid:
        raise HTTPException(401, "Inicia sesión para continuar.")
    return int(fid)


def parent_family(request: Request) -> int:
    fid = family_id(request)
    if request.session.get("parent_until", 0) < time.time():
        raise HTTPException(403, "Esta zona es para la familia. Introduce el PIN.")
    request.session["parent_until"] = time.time() + 30 * 60
    return fid


def own_student(db: Session, fid: int, sid: int) -> Student:
    s = db.get(Student, sid)
    if not s or s.family_id != fid:
        raise HTTPException(404, "Alumno no encontrado")
    return s


def own_subject(db: Session, fid: int, sub_id: int) -> Subject:
    s = db.get(Subject, sub_id)
    if not s or s.student.family_id != fid:
        raise HTTPException(404, "Asignatura no encontrada")
    return s


def own_topic(db: Session, fid: int, tid: int) -> Topic:
    t = db.get(Topic, tid)
    if not t or t.subject.student.family_id != fid:
        raise HTTPException(404, "Tema no encontrado")
    return t


def own_activity(db: Session, fid: int, aid: int) -> Activity:
    a = db.get(Activity, aid)
    if not a:
        raise HTTPException(404, "Actividad no encontrada")
    own_student(db, fid, a.student_id)
    return a


def topic_dict(t: Topic) -> dict:
    st = learning.status_of(t)
    return {"id": t.id, "title": t.title, "summary": t.summary, "keywords": t.keywords, "focus": t.focus,
            "mastery": round(t.mastery), "evaluated": t.evaluated, "status": st,
            "status_label": learning.STATUS_LABEL[st], "answered": t.answered, "correct": t.correct}


def subject_summary(s: Subject) -> dict:
    ev = [t for t in s.topics if t.evaluated]
    return {"id": s.id, "name": s.name, "icon": s.icon, "color": s.color, "diagnosed": s.diagnosed,
            "topics": len(s.topics), "documents": len(s.documents),
            "processing": any(d.status in ("procesando", "cancelando") for d in s.documents),
            "mastery": round(sum(t.mastery for t in ev) / len(ev)) if ev else None,
            "mastered": sum(1 for t in s.topics if learning.status_of(t) == "dominado")}


def student_dict(s: Student) -> dict:
    return {"id": s.id, "name": s.name, "course": s.course, "avatar": s.avatar, "notes": s.notes,
            "teacher_name": s.teacher_name, "teacher_email": s.teacher_email, "reports_enabled": s.reports_enabled,
            "xp": s.xp, "streak": s.streak, "level": learning.level_of(s.xp),
            "last_report_at": s.last_report_at.isoformat() if s.last_report_at else None}


# ---------------------------------------------------------------------------
# Páginas
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/api/health")
def health():
    return {"ok": True, "app": config.APP_NAME, "server_key": config.AI_READY}


# ---------------------------------------------------------------------------
# Cuenta de familia
# ---------------------------------------------------------------------------

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=8, max_length=200)
    pin: str = Field(pattern=r"^\d{4}$")
    password2: str
    pin2: str
    privacy: bool = False
    code: str = ""


@app.post("/api/auth/register")
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)):
    if not body.privacy:
        raise HTTPException(400, "Para crear la cuenta hay que aceptar el aviso de privacidad.")
    if body.password != body.password2:
        raise HTTPException(400, "Las dos contraseñas no coinciden.")
    if body.pin != body.pin2.strip():
        raise HTTPException(400, "Los dos PIN no coinciden.")
    if config.SIGNUP_CODE and body.code.strip() != config.SIGNUP_CODE:
        raise HTTPException(400, "El código de invitación no es correcto.")
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(400, "Email no válido.")
    if db.query(Family).filter_by(email=email).first():
        raise HTTPException(400, "Ya existe una cuenta con ese email.")
    f = Family(email=email, name=body.name.strip(), password_hash=hash_secret(body.password),
               parent_pin_hash=hash_secret(body.pin), privacy_accepted_at=datetime.utcnow())
    db.add(f)
    db.commit()
    request.session.update({"fid": f.id, "parent_until": time.time() + 30 * 60})
    return {"ok": True}


class LoginIn(BaseModel):
    email: str
    password: str


@app.post("/api/auth/login")
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    f = db.query(Family).filter_by(email=body.email.strip().lower()).first()
    if not f or not check_secret(body.password, f.password_hash):
        time.sleep(0.6)
        raise HTTPException(400, "Email o contraseña incorrectos.")
    request.session.clear()
    request.session["fid"] = f.id
    return {"ok": True}


@app.post("/api/auth/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}


class PinIn(BaseModel):
    pin: str


@app.post("/api/parent/unlock")
def parent_unlock(body: PinIn, request: Request, db: Session = Depends(get_db)):
    f = db.get(Family, family_id(request))
    if not f or not check_secret(body.pin, f.parent_pin_hash):
        time.sleep(0.6)
        raise HTTPException(400, "PIN incorrecto.")
    request.session["parent_until"] = time.time() + 30 * 60
    return {"ok": True}


@app.post("/api/parent/lock")
def parent_lock(request: Request):
    request.session["parent_until"] = 0
    return {"ok": True}


@app.get("/api/me")
def me(request: Request, db: Session = Depends(get_db)):
    fid = request.session.get("fid")
    base = {"app": config.APP_NAME, "courses": config.COURSES, "version": VERSION,
            "credit": f"By Luis Benedicto Tuzón with {config.APP_CREDIT_MODEL} · versión {VERSION} · 2026", "privacy_contact": config.PRIVACY_CONTACT,
            "server_key": config.AI_READY,
            "models": {"main": config.MODEL_MAIN, "fallback": config.MODEL_FALLBACK, "vision": config.MODEL_VISION},
            "signup_code": bool(config.SIGNUP_CODE), "smtp": bool(config.SMTP_HOST),
            "icons": config.SUBJECT_ICONS, "colors": config.SUBJECT_COLORS}
    f = db.get(Family, fid) if fid else None
    if not f:
        return {**base, "family": None}
    key = keys.family_key(f.id)
    ready = bool(key) or config.AI_READY
    return {**base, "family": {"id": f.id, "name": f.name, "email": f.email},
            "ai_ready": ready, "ai_message": "" if ready else keys.MISSING_MESSAGE,
            "key": {"source": "familia" if key else ("servidor" if config.AI_READY else ""), "masked": keys.mask(key) if key else ""},
            "parent": request.session.get("parent_until", 0) > time.time(),
            "students": [student_dict(s) for s in f.students]}


class PasswordIn(BaseModel):
    current: str
    password: str = Field(default="", max_length=200)
    password2: str = ""
    pin: str = ""
    pin2: str = ""


@app.post("/api/family/credentials")
def change_credentials(body: PasswordIn, request: Request, db: Session = Depends(get_db)):
    f = db.get(Family, parent_family(request))
    if not check_secret(body.current, f.password_hash):
        raise HTTPException(400, "La contraseña actual no es correcta.")
    if body.password != body.password2:
        raise HTTPException(400, "Las dos contraseñas nuevas no coinciden.")
    if body.pin.strip() != body.pin2.strip():
        raise HTTPException(400, "Los dos PIN nuevos no coinciden.")
    if body.password:
        if len(body.password) < 8:
            raise HTTPException(400, "La nueva contraseña debe tener al menos 8 caracteres.")
        f.password_hash = hash_secret(body.password)
    if body.pin:
        if not (len(body.pin) == 4 and body.pin.isdigit()):
            raise HTTPException(400, "El PIN debe tener 4 cifras.")
        f.parent_pin_hash = hash_secret(body.pin)
    db.commit()
    return {"ok": True}


class DeleteFamilyIn(BaseModel):
    password: str
    confirm: str


@app.post("/api/family/delete")
def delete_family(body: DeleteFamilyIn, request: Request, db: Session = Depends(get_db)):
    """Elimina la cuenta de familia y TODOS sus datos. Requiere PIN (zona familia) y contraseña."""
    f = db.get(Family, parent_family(request))
    if not check_secret(body.password, f.password_hash):
        time.sleep(0.6)
        raise HTTPException(400, "La contraseña no es correcta.")
    if body.confirm.strip().upper() != "ELIMINAR":
        raise HTTPException(400, "Escribe ELIMINAR para confirmar.")
    for s in list(f.students):
        _delete_student_data(db, s, delete_row=False)  # las filas de alumno y asignaturas caen en cascada
    db.query(AiUsage).filter(AiUsage.family_id == f.id).delete()
    db.delete(f)
    db.commit()
    request.session.clear()
    log.info("Cuenta de familia %s eliminada", f.id)
    return {"ok": True}


def _purge_documents(db: Session, docs: list[Document]) -> None:
    """Detiene lecturas en curso y borra las copias temporales y la caché de texto de esos documentos
    (si ningún otro documento usa el mismo archivo)."""
    from .db import OcrCache
    hashes = set()
    for d in docs:
        ingest.request_stop(d.id)
        if d.stored_file:
            Path(d.stored_file).unlink(missing_ok=True)
        if d.file_hash:
            hashes.add(d.file_hash)
    ids = [d.id for d in docs]
    for h in hashes:
        others = db.query(Document).filter(Document.file_hash == h, ~Document.id.in_(ids or [-1])).count()
        if not others:
            db.query(OcrCache).filter(OcrCache.file_hash == h).delete()


def _delete_student_data(db: Session, s: Student, delete_row: bool = True) -> None:
    from .db import MasteryLog
    for model in (Activity, Answer, ChatMessage, ReportLog, MasteryLog):
        db.query(model).filter(model.student_id == s.id).delete()
    for sub in s.subjects:
        _purge_documents(db, list(sub.documents))
        db.query(Flashcard).filter(Flashcard.subject_id == sub.id).delete()
        db.query(Chunk).filter(Chunk.subject_id == sub.id).delete()
    if delete_row:
        db.delete(s)


# ---------------------------------------------------------------------------
# Alumnos, asignaturas y temas (zona familia)
# ---------------------------------------------------------------------------

class StudentIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    course: str
    avatar: str = "fox"
    notes: str = Field(default="", max_length=1500)
    teacher_name: str = Field(default="", max_length=120)
    teacher_email: str = Field(default="", max_length=200)
    reports_enabled: bool = True


@app.post("/api/students")
def create_student(body: StudentIn, request: Request, db: Session = Depends(get_db)):
    fid = parent_family(request)
    if body.course not in config.COURSES:
        raise HTTPException(400, "Curso no válido.")
    s = Student(family_id=fid, **body.model_dump())
    db.add(s)
    db.flush()
    for i, (name, icon, color) in enumerate(config.DEFAULT_SUBJECTS):
        db.add(Subject(student_id=s.id, name=name, icon=icon, color=color, position=i))
    db.commit()
    return student_dict(s)


@app.put("/api/students/{sid}")
def update_student(sid: int, body: StudentIn, request: Request, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    if body.course not in config.COURSES:
        raise HTTPException(400, "Curso no válido.")
    for k, v in body.model_dump().items():
        setattr(s, k, v)
    db.commit()
    return student_dict(s)


@app.delete("/api/students/{sid}")
def delete_student(sid: int, request: Request, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    _delete_student_data(db, s)
    db.commit()
    return {"ok": True}


class SubjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    icon: str = "book"
    color: str = "#2563eb"


@app.post("/api/students/{sid}/subjects")
def add_subject(sid: int, body: SubjectIn, request: Request, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    sub = Subject(student_id=s.id, name=body.name.strip(), icon=body.icon, color=body.color,
                  position=len(s.subjects))
    db.add(sub)
    db.commit()
    return subject_summary(sub)


@app.put("/api/subjects/{sub_id}")
def edit_subject(sub_id: int, body: SubjectIn, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, parent_family(request), sub_id)
    sub.name, sub.icon, sub.color = body.name.strip(), body.icon, body.color
    db.commit()
    return subject_summary(sub)


@app.delete("/api/subjects/{sub_id}")
def delete_subject(sub_id: int, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, parent_family(request), sub_id)
    _purge_documents(db, list(sub.documents))
    from .db import MasteryLog
    for model in (Flashcard, Chunk, Activity, Answer, ChatMessage, MasteryLog):
        db.query(model).filter(model.subject_id == sub_id).delete()
    db.delete(sub)
    db.commit()
    return {"ok": True}


class TopicIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    summary: str = Field(default="", max_length=800)
    focus: bool = False


@app.post("/api/subjects/{sub_id}/topics")
def add_topic(sub_id: int, body: TopicIn, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, family_id(request), sub_id)
    t = Topic(subject_id=sub.id, title=body.title.strip(), summary=body.summary.strip(), focus=body.focus,
              position=len(sub.topics))
    db.add(t)
    db.commit()
    return topic_dict(t)


@app.put("/api/topics/{tid}")
def edit_topic(tid: int, body: TopicIn, request: Request, db: Session = Depends(get_db)):
    t = own_topic(db, family_id(request), tid)
    t.title, t.summary, t.focus = body.title.strip(), body.summary.strip(), body.focus
    db.commit()
    return topic_dict(t)


@app.delete("/api/topics/{tid}")
def delete_topic(tid: int, request: Request, db: Session = Depends(get_db)):
    t = own_topic(db, parent_family(request), tid)
    db.query(Flashcard).filter(Flashcard.topic_id == tid).delete()
    db.delete(t)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Material (lo puede subir la familia o el alumno)
# ---------------------------------------------------------------------------

@app.post("/api/subjects/{sub_id}/documents")
async def upload_document(sub_id: int, request: Request, file: UploadFile = File(...), kind: str = Form("libro"),
                          db: Session = Depends(get_db)):
    fid = family_id(request)
    sub = own_subject(db, fid, sub_id)
    if not keys.ready(fid):
        raise HTTPException(503, keys.MISSING_MESSAGE)
    ext = ingest.ext_of(file.filename or "")
    if ext not in ingest.ACCEPTED:
        raise HTTPException(400, "Formato no admitido. Usa PDF, Word (.docx), texto o fotos (JPG, PNG).")
    data = await file.read()
    if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"El archivo supera {config.MAX_UPLOAD_MB} MB.")
    if not data:
        raise HTTPException(400, "El archivo está vacío.")
    fhash = ingest.file_hash(data)
    dup = db.query(Document).filter(Document.subject_id == sub.id, Document.file_hash == fhash,
                                    Document.status == "listo").first()
    if dup:
        raise HTTPException(400, f"Este archivo ya está en {sub.name} («{dup.filename}»).")
    try:
        info = ingest.analyze(file.filename or "", data)
    except Exception:  # noqa: BLE001
        raise HTTPException(400, "No se ha podido abrir el archivo. ¿Está dañado o protegido con contraseña?")
    # Si ya existe un documento igual detenido o pendiente, se reutiliza (no se vuelve a pagar nada)
    doc = db.query(Document).filter(Document.subject_id == sub.id, Document.file_hash == fhash,
                                    Document.status.in_(["pendiente", "detenido", "error"])).first()
    if doc is None:
        doc = Document(subject_id=sub.id, filename=(file.filename or "documento")[:240], kind=kind[:20])
        db.add(doc)
        db.flush()
    path = ingest.stored_path(doc.id, doc.filename)
    path.write_bytes(data)
    doc.file_hash, doc.stored_file, doc.pages = fhash, str(path), info["pages"]
    doc.scanned_pages = ",".join(map(str, info["scanned"]))
    doc.page_from, doc.page_to, doc.error = 1, info["pages"], ""
    cached = ingest.cached_pages(fhash)
    est = ingest.estimate(info["scanned"], cached, 1, info["pages"])
    if est["to_read"] > config.OCR_CONFIRM_PAGES:
        doc.status = "pendiente"
        doc.note = (f"{est['to_read']} páginas escaneadas por leer con IA (≈ {_usd(est['cost'])}). "
                    "Elige qué páginas quieres procesar.")
        db.commit()
    else:
        db.commit()
        ingest.start(doc.id, fid)
    return document_dict(doc, cached)


def _usd(v: float) -> str:
    return f"{v:.2f}".replace(".", ",") + " $"


def document_dict(d: Document, cached: set[int] | None = None) -> dict:
    scanned = ingest.parse_pages(d.scanned_pages)
    cached = ingest.cached_pages(d.file_hash) if cached is None and d.file_hash else (cached or set())
    can_resume = bool(d.stored_file) and Path(d.stored_file).exists()
    return {"id": d.id, "filename": d.filename, "kind": d.kind, "status": d.status,
            "progress": max(0, min(100, d.progress)), "pages": d.pages, "error": d.error, "note": d.note,
            "page_from": d.page_from, "page_to": d.page_to, "ocr_total": d.ocr_total, "ocr_done": d.ocr_done,
            "ai_cost": round(d.ai_cost, 4), "scanned": scanned if d.status in ("pendiente", "detenido") else [],
            "scanned_count": len(scanned), "cached": sorted(p for p in cached if p in set(scanned))
            if d.status in ("pendiente", "detenido") else [], "cached_count": len(cached),
            "can_resume": can_resume, "price_per_page": config.OCR_COST_PER_PAGE,
            "workers": config.OCR_WORKERS, "confirm_pages": config.OCR_CONFIRM_PAGES,
            "created_at": d.created_at.isoformat()}


class StartIn(BaseModel):
    page_from: int = Field(ge=1)
    page_to: int = Field(ge=1)


@app.post("/api/documents/{doc_id}/start")
def start_document(doc_id: int, body: StartIn, request: Request, db: Session = Depends(get_db)):
    """Confirma la lectura (con el rango de páginas elegido) o continúa una detenida. Gasta IA: requiere PIN."""
    fid = parent_family(request)
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(404, "Documento no encontrado")
    own_subject(db, fid, d.subject_id)
    if d.status not in ("pendiente", "detenido", "error"):
        raise HTTPException(400, "Este documento no está esperando confirmación.")
    if not d.stored_file or not Path(d.stored_file).exists():
        raise HTTPException(400, "El archivo ya no está en el servidor. Vuelve a subirlo: las páginas ya leídas "
                                 "no se vuelven a pagar.")
    if not keys.ready(fid):
        raise HTTPException(503, keys.MISSING_MESSAGE)
    if body.page_from > body.page_to or body.page_to > max(1, d.pages):
        raise HTTPException(400, f"Rango no válido: el documento tiene {d.pages} páginas.")
    d.page_from, d.page_to = body.page_from, body.page_to
    db.commit()
    ingest.start(d.id, fid)
    return document_dict(d)


@app.post("/api/documents/{doc_id}/stop")
def stop_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(404, "Documento no encontrado")
    own_subject(db, fid, d.subject_id)
    if d.status == "procesando":
        ingest.request_stop(d.id)
        d.status = "cancelando"
        db.commit()
    return document_dict(d)


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    fid = parent_family(request)
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(404, "Documento no encontrado")
    own_subject(db, fid, d.subject_id)
    _purge_documents(db, [d])
    db.delete(d)
    db.commit()
    return {"ok": True}


@app.get("/api/subjects/{sub_id}")
def subject_detail(sub_id: int, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, family_id(request), sub_id)
    due = db.query(Flashcard).filter(Flashcard.subject_id == sub.id, Flashcard.due <= date.today()).count()
    cards = db.query(Flashcard).filter(Flashcard.subject_id == sub.id).count()
    return {**subject_summary(sub), "student_id": sub.student_id, "due_cards": due, "cards": cards,
            "topics_list": [topic_dict(t) for t in sub.topics],
            "documents_list": [document_dict(d) for d in sub.documents]}


# ---------------------------------------------------------------------------
# Zona del alumno: inicio
# ---------------------------------------------------------------------------

@app.get("/api/students/{sid}/home")
def student_home(sid: int, request: Request, db: Session = Depends(get_db)):
    s = own_student(db, family_id(request), sid)
    return {"student": student_dict(s), "subjects": [subject_summary(x) for x in s.subjects],
            "mission": learning.daily_mission(db, s), "badges": learning.badges(db, s),
            "due_cards": learning.due_cards(db, [x.id for x in s.subjects]),
            "week": learning.activity_timeline(db, s.id, 7)}


# ---------------------------------------------------------------------------
# Preguntas: prueba de nivel, test adaptativo y contrarreloj
# ---------------------------------------------------------------------------

def _public_question(i: int, q: dict, reveal: bool) -> dict:
    out = {"i": i, "type": q["type"], "question": q["question"], "topic_id": q["topic_id"],
           "difficulty": q["difficulty"]}
    if q["type"] == "mc":
        out["options"] = q["options"]
        if reveal:
            out["answer_index"] = q["answer_index"]
            out["explanation"] = q["explanation"]
    return out


@app.post("/api/subjects/{sub_id}/diagnostic")
def start_diagnostic(sub_id: int, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    sub = own_subject(db, fid, sub_id)
    student = sub.student
    topics = list(sub.topics)
    if not topics:
        raise HTTPException(400, "Primero sube un libro o añade los temas de esta asignatura.")
    topics.sort(key=lambda t: (not t.focus, t.position))
    topics = topics[:8]
    per = 3 if len(topics) <= 4 else 2
    blocks = [{"topic_id": t.id, "title": t.title, "summary": t.summary, "n": per, "difficulty": 2,
               "context": ingest.topic_context(t, 4000)} for t in topics]
    qs = ai.make_questions(sub.name, student.course, blocks, mode="diagnostico", family_id=fid, notes=student.notes)
    if not qs:
        raise HTTPException(503, "No se pudieron preparar las preguntas. Inténtalo de nuevo.")
    qs.sort(key=lambda q: q["difficulty"])
    act = Activity(student_id=student.id, subject_id=sub.id, type="diagnostico", payload={"questions": qs, "answers": {}},
                   max_score=len(qs))
    db.add(act)
    db.commit()
    return {"activity_id": act.id, "type": "diagnostico", "subject": sub.name, "color": sub.color,
            "questions": [_public_question(i, q, False) for i, q in enumerate(qs)]}


@app.post("/api/topics/{tid}/quiz")
def start_quiz(tid: int, request: Request, mode: str = "test", db: Session = Depends(get_db)):
    fid = family_id(request)
    t = own_topic(db, fid, tid)
    sub, student = t.subject, t.subject.student
    if mode not in ("test", "contrarreloj"):
        raise HTTPException(400, "Modo no válido")
    n = 8 if mode == "test" else 12
    diff = learning.target_difficulty(t.mastery)
    if mode == "contrarreloj":
        diff = min(diff, 2)
    weak = _weak_skills(db, student.id, t.id)
    summary = t.summary + (f" Refuerza especialmente: {'; '.join(weak)}." if weak else "")
    blocks = [{"topic_id": t.id, "title": t.title, "summary": summary, "n": n, "difficulty": diff,
               "context": ingest.topic_context(t, 6000)}]
    qs = ai.make_questions(sub.name, student.course, blocks, mode=mode, family_id=fid, notes=student.notes)
    if not qs:
        raise HTTPException(503, "No se pudieron preparar las preguntas. Inténtalo de nuevo.")
    act = Activity(student_id=student.id, subject_id=sub.id, topic_id=t.id, type=mode,
                   payload={"questions": qs, "answers": {}}, max_score=len(qs))
    db.add(act)
    db.commit()
    return {"activity_id": act.id, "type": mode, "subject": sub.name, "color": sub.color, "topic": t.title,
            "questions": [_public_question(i, q, mode == "contrarreloj") for i, q in enumerate(qs)]}


def _weak_skills(db: Session, student_id: int, topic_id: int) -> list[str]:
    rows = db.query(Answer).filter(Answer.student_id == student_id, Answer.topic_id == topic_id) \
        .order_by(Answer.created_at.desc()).limit(40).all()
    stats: dict[str, list[float]] = {}
    for r in rows:
        if r.skill:
            stats.setdefault(r.skill, []).append(r.correct)
    return [k for k, v in stats.items() if sum(v) / len(v) < 0.6][:4]


class AnswerIn(BaseModel):
    i: int
    value: str = Field(default="", max_length=500)


@app.post("/api/activities/{aid}/answer")
def answer_question(aid: int, body: AnswerIn, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    act = own_activity(db, fid, aid)
    if act.status != "abierta":
        raise HTTPException(400, "Esta actividad ya está cerrada.")
    qs = act.payload.get("questions", [])
    if not 0 <= body.i < len(qs):
        raise HTTPException(400, "Pregunta no válida")
    answers = dict(act.payload.get("answers", {}))
    if str(body.i) in answers:
        return answers[str(body.i)]
    q = qs[body.i]
    student = db.get(Student, act.student_id)
    if q["type"] == "mc":
        try:
            chosen = int(body.value)
        except ValueError:
            chosen = -1
        score = 1.0 if chosen == q["answer_index"] else 0.0
        given = q["options"][chosen] if 0 <= chosen < len(q["options"]) else ""
        feedback = q["explanation"]
    else:
        given = body.value.strip()
        if not given:
            score, feedback = 0.0, f"Sin respuesta. {q['explanation']}"
        else:
            g = ai.grade_short(db.get(Subject, act.subject_id).name, student.course,
                               [{"question": q["question"], "expected": q["answer"], "given": given}], family_id=fid)[0]
            score, feedback = g["score"], (g["feedback"] + " " + q["explanation"]).strip()
    res = {"i": body.i, "score": score, "correct_answer": q["answer"], "feedback": feedback,
           "answer_index": q.get("answer_index")}
    answers[str(body.i)] = res
    act.payload = {**act.payload, "answers": answers}
    db.add(Answer(activity_id=act.id, student_id=act.student_id, subject_id=act.subject_id, topic_id=q["topic_id"],
                  question=q["question"], given=given, expected=q["answer"], correct=score,
                  difficulty=q["difficulty"], skill=q.get("skill", ""), feedback=feedback[:1000]))
    db.commit()
    return res


class FinishIn(BaseModel):
    duration_s: int = Field(default=0, ge=0, le=4 * 3600)
    results: list[float] = []  # aciertos en comprobaciones de lección, tarjetas o parejas
    extra: dict = {}


@app.post("/api/activities/{aid}/finish")
def finish_activity(aid: int, body: FinishIn, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    act = own_activity(db, fid, aid)
    if act.status == "terminada":
        raise HTTPException(400, "La actividad ya estaba terminada.")
    student = db.get(Student, act.student_id)
    act.duration_s = body.duration_s
    act.finished_at = datetime.utcnow()
    act.status = "terminada"
    summary: dict = {}

    if act.type in ("diagnostico", "test", "contrarreloj"):
        qs = act.payload.get("questions", [])
        answers = act.payload.get("answers", {})
        per_topic: dict[int, list[tuple[float, int]]] = {}
        for i, q in enumerate(qs):
            a = answers.get(str(i))
            if a is None and act.type == "contrarreloj":
                continue  # en el reto, lo que no dio tiempo a contestar no penaliza
            sc = a["score"] if a else 0.0
            per_topic.setdefault(q["topic_id"], []).append((sc, q["difficulty"]))
        act.score = sum((answers.get(str(i)) or {}).get("score", 0) for i in range(len(qs)))
        if act.type == "contrarreloj":
            act.max_score = max(1, len(answers))
        weight = {"diagnostico": 1.0, "test": 0.35, "contrarreloj": 0.2}[act.type]
        topics_out = []
        for tid, items in per_topic.items():
            t = db.get(Topic, tid)
            if not t:
                continue
            before = round(t.mastery) if t.evaluated else None
            ws = learning.weighted_score(items)
            if act.type == "diagnostico":
                t.evaluated = False  # la prueba de nivel fija el punto de partida
            learning.update_mastery(db, t, ws, weight, student.id, len(items), sum(c for c, _ in items))
            topics_out.append({"id": t.id, "title": t.title, "before": before, "after": round(t.mastery),
                               "status_label": learning.STATUS_LABEL[learning.status_of(t)]})
        if act.type == "diagnostico":
            db.get(Subject, act.subject_id).diagnosed = True
        summary["topics"] = topics_out
        summary["review"] = [{"question": q["question"], "your": (answers.get(str(i)) or {}).get("score", 0),
                              "correct_answer": q["answer"], "explanation": q["explanation"]}
                             for i, q in enumerate(qs)]
    elif act.type in ("leccion", "tarjetas", "parejas"):
        res = [max(0.0, min(1.0, r)) for r in body.results]
        act.max_score = len(res)
        act.score = sum(res)
        if act.topic_id and res:
            t = db.get(Topic, act.topic_id)
            if t:
                weight = {"leccion": 0.2, "tarjetas": 0.15, "parejas": 0.15}[act.type]
                before = round(t.mastery) if t.evaluated else None
                learning.update_mastery(db, t, 100 * act.score / act.max_score, weight, student.id)
                summary["topics"] = [{"id": t.id, "title": t.title, "before": before, "after": round(t.mastery),
                                      "status_label": learning.STATUS_LABEL[learning.status_of(t)]}]
    ratio = (act.score / act.max_score) if act.max_score else 0.6
    gained = learning.award(db, student, ratio)
    db.commit()
    return {"score": act.score, "max_score": act.max_score, "xp_gained": gained, "xp": student.xp,
            "streak": student.streak, "level": learning.level_of(student.xp), **summary}


# ---------------------------------------------------------------------------
# Lección interactiva
# ---------------------------------------------------------------------------

@app.post("/api/topics/{tid}/lesson")
def start_lesson(tid: int, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    t = own_topic(db, fid, tid)
    sub, student = t.subject, t.subject.student
    lesson = ai.make_lesson(sub.name, student.course, {"title": t.title, "summary": t.summary},
                            ingest.topic_context(t, 8000), t.mastery, _weak_skills(db, student.id, t.id),
                            family_id=fid, notes=student.notes)
    act = Activity(student_id=student.id, subject_id=sub.id, topic_id=t.id, type="leccion", payload=lesson)
    db.add(act)
    db.commit()
    return {"activity_id": act.id, "subject": sub.name, "color": sub.color, "topic": t.title, **lesson}


# ---------------------------------------------------------------------------
# Tarjetas de memoria
# ---------------------------------------------------------------------------

def _ensure_cards(db: Session, t: Topic, fid: int, minimum: int = 8) -> None:
    have = db.query(Flashcard).filter(Flashcard.topic_id == t.id).count()
    if have >= minimum:
        return
    sub, student = t.subject, t.subject.student
    cards = ai.make_flashcards(sub.name, student.course, {"title": t.title, "summary": t.summary},
                               ingest.topic_context(t, 8000), max(6, 10 - have), family_id=fid)
    existing = {c.front.lower() for c in db.query(Flashcard).filter(Flashcard.topic_id == t.id)}
    for c in cards:
        if c["front"].lower() not in existing:
            db.add(Flashcard(subject_id=sub.id, topic_id=t.id, front=c["front"], back=c["back"]))
    db.commit()


class ReviewStartIn(BaseModel):
    subject_id: int
    topic_id: int | None = None


@app.post("/api/review/start")
def start_review(body: ReviewStartIn, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    sub = own_subject(db, fid, body.subject_id)
    q = db.query(Flashcard).filter(Flashcard.subject_id == sub.id)
    topic_title = None
    if body.topic_id:
        t = own_topic(db, fid, body.topic_id)
        _ensure_cards(db, t, fid)
        q = q.filter(Flashcard.topic_id == t.id)
        topic_title = t.title
    due = q.filter(Flashcard.due <= date.today()).all()
    cards = due if due else q.all()
    random.shuffle(cards)
    cards = sorted(cards, key=lambda c: c.box)[:15]
    if not cards:
        raise HTTPException(400, "Todavía no hay tarjetas. Elige un tema para crearlas.")
    act = Activity(student_id=sub.student_id, subject_id=sub.id, topic_id=body.topic_id, type="tarjetas")
    db.add(act)
    db.commit()
    names = {t.id: t.title for t in sub.topics}
    return {"activity_id": act.id, "subject": sub.name, "color": sub.color, "topic": topic_title,
            "practice": not due,
            "cards": [{"id": c.id, "front": c.front, "back": c.back, "box": c.box, "topic": names.get(c.topic_id, "")}
                      for c in cards]}


class CardReviewIn(BaseModel):
    grade: str = Field(pattern=r"^(si|casi|no)$")


@app.post("/api/flashcards/{cid}/review")
def review_flashcard(cid: int, body: CardReviewIn, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    c = db.get(Flashcard, cid)
    if not c:
        raise HTTPException(404, "Tarjeta no encontrada")
    own_subject(db, fid, c.subject_id)
    learning.review_card(c, body.grade)
    db.commit()
    return {"box": c.box, "due": c.due.isoformat()}


# ---------------------------------------------------------------------------
# Juego de parejas
# ---------------------------------------------------------------------------

@app.post("/api/topics/{tid}/pairs")
def start_pairs(tid: int, request: Request, db: Session = Depends(get_db)):
    fid = family_id(request)
    t = own_topic(db, fid, tid)
    sub, student = t.subject, t.subject.student
    pairs = ai.make_pairs(sub.name, student.course, {"title": t.title, "summary": t.summary},
                          ingest.topic_context(t, 6000), family_id=fid)
    if len(pairs) < 3:
        raise HTTPException(503, "No se pudo preparar el juego. Inténtalo de nuevo.")
    act = Activity(student_id=student.id, subject_id=sub.id, topic_id=t.id, type="parejas", payload={"pairs": pairs})
    db.add(act)
    db.commit()
    return {"activity_id": act.id, "subject": sub.name, "color": sub.color, "topic": t.title, "pairs": pairs}


# ---------------------------------------------------------------------------
# Tutor y ayuda con los deberes
# ---------------------------------------------------------------------------

@app.get("/api/subjects/{sub_id}/chat")
def chat_history(sub_id: int, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, family_id(request), sub_id)
    msgs = db.query(ChatMessage).filter(ChatMessage.subject_id == sub.id).order_by(ChatMessage.id.desc()).limit(40).all()
    return {"messages": [{"role": m.role, "content": m.content, "has_image": m.has_image,
                          "at": m.created_at.isoformat()} for m in reversed(msgs)]}


@app.post("/api/subjects/{sub_id}/chat")
async def chat_send(sub_id: int, request: Request, message: str = Form(""), mode: str = Form("tutor"),
                    image: UploadFile | None = File(None), db: Session = Depends(get_db)):
    fid = family_id(request)
    sub = own_subject(db, fid, sub_id)
    if not keys.ready(fid):
        raise HTTPException(503, keys.MISSING_MESSAGE)
    student = sub.student
    message = message.strip()[:2000]
    img = None
    if image is not None and image.filename:
        data = await image.read()
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(400, "La foto es demasiado grande (máx. 15 MB).")
        mime = ingest.IMAGE_TYPES.get(ingest.ext_of(image.filename), image.content_type or "image/jpeg")
        img = ingest._normalize_image(data, mime)
    if not message and not img:
        raise HTTPException(400, "Escribe una pregunta o adjunta una foto.")
    db.add(ChatMessage(student_id=student.id, subject_id=sub.id, role="user",
                       content=message or "(foto de un ejercicio)", has_image=bool(img)))
    db.commit()
    hist = db.query(ChatMessage).filter(ChatMessage.subject_id == sub.id).order_by(ChatMessage.id.desc()).limit(14).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(hist)]
    recent_user = " ".join(m["content"] for m in history if m["role"] == "user")[-600:]
    context = ingest.retrieve(sub.id, recent_user, 6000)
    reply = ai.tutor_reply(sub.name, student.course, student.name, history, context, img,
                           "deberes" if mode == "deberes" or img else "tutor", family_id=fid, notes=student.notes)
    db.add(ChatMessage(student_id=student.id, subject_id=sub.id, role="assistant", content=reply))
    # una actividad de tutor por asignatura y día (suma tiempo estimado por mensaje)
    today0 = datetime.combine(date.today(), datetime.min.time())
    kind = "deberes" if (mode == "deberes" or img) else "tutor"
    act = db.query(Activity).filter(Activity.student_id == student.id, Activity.subject_id == sub.id,
                                    Activity.type == kind, Activity.created_at >= today0).first()
    if not act:
        act = Activity(student_id=student.id, subject_id=sub.id, type=kind, status="terminada", payload={"messages": 0},
                       finished_at=datetime.utcnow())
        db.add(act)
        learning.award(db, student, 0.5, base=2)
    act.payload = {"messages": int((act.payload or {}).get("messages", 0)) + 1}
    act.duration_s = (act.duration_s or 0) + 75
    db.commit()
    return {"reply": reply}


@app.delete("/api/subjects/{sub_id}/chat")
def chat_clear(sub_id: int, request: Request, db: Session = Depends(get_db)):
    sub = own_subject(db, family_id(request), sub_id)
    db.query(ChatMessage).filter(ChatMessage.subject_id == sub.id).delete()
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Seguimiento e informes (zona familia)
# ---------------------------------------------------------------------------

@app.get("/api/students/{sid}/progress")
def student_progress(sid: int, request: Request, days: int = 7, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    days = max(1, min(90, days))
    recent = db.query(Activity).filter(Activity.student_id == s.id, Activity.status == "terminada") \
        .order_by(Activity.created_at.desc()).limit(25).all()
    subj = {x.id: x for x in s.subjects}
    topic_names = {t.id: t.title for x in s.subjects for t in x.topics}
    logs = db.query(ReportLog).filter(ReportLog.student_id == s.id).order_by(ReportLog.id.desc()).limit(10).all()
    return {
        "student": student_dict(s),
        "stats": learning.student_stats(db, s, days),
        "timeline": learning.activity_timeline(db, s.id, 14),
        "recent": [{"type": a.type, "subject": subj[a.subject_id].name if a.subject_id in subj else "",
                    "color": subj[a.subject_id].color if a.subject_id in subj else "#64748b",
                    "topic": topic_names.get(a.topic_id, ""), "score": a.score, "max_score": a.max_score,
                    "minutes": round(a.duration_s / 60), "at": a.created_at.isoformat()} for a in recent],
        "reports": [{"id": r.id, "to": r.sent_to, "status": r.status, "detail": r.detail,
                     "at": r.created_at.isoformat()} for r in logs],
    }


@app.get("/api/students/{sid}/report/preview", response_class=HTMLResponse)
def report_preview(sid: int, request: Request, days: int = 7, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    return HTMLResponse(reports.build_report(db, s, max(1, min(90, days)))["html"])


@app.post("/api/students/{sid}/report/send")
def report_send(sid: int, request: Request, days: int = 7, db: Session = Depends(get_db)):
    s = own_student(db, parent_family(request), sid)
    if not s.teacher_email:
        raise HTTPException(400, "Añade el email del profesor en la ficha del alumno.")
    entry = reports.send_report(db, s, max(1, min(90, days)))
    if entry.status == "sin_smtp":
        raise HTTPException(400, "El envío de emails no está configurado en el servidor (SMTP). "
                                 "Puedes ver la vista previa y reenviarla a mano.")
    if entry.status == "error":
        raise HTTPException(502, f"No se pudo enviar: {entry.detail}")
    return {"ok": True, "to": entry.sent_to}


@app.get("/api/reports/{rid}", response_class=HTMLResponse)
def report_view(rid: int, request: Request, db: Session = Depends(get_db)):
    fid = parent_family(request)
    r = db.get(ReportLog, rid)
    if not r:
        raise HTTPException(404, "Informe no encontrado")
    own_student(db, fid, r.student_id)
    return HTMLResponse(r.html)


@app.get("/api/usage")
def usage(request: Request, db: Session = Depends(get_db)):
    fid = parent_family(request)
    since = date.today() - timedelta(days=29)
    rows = db.query(AiUsage).filter(AiUsage.family_id == fid, AiUsage.day >= since).all()
    return {"calls": sum(r.calls for r in rows), "cost": round(sum(r.cost for r in rows), 4),
            "tokens": sum(r.tokens_in + r.tokens_out for r in rows), "daily_limit": config.DAILY_AI_LIMIT,
            "today": next((r.calls for r in rows if r.day == date.today()), 0),
            "models": {"main": config.MODEL_MAIN, "fallback": config.MODEL_FALLBACK, "vision": config.MODEL_VISION},
            "ai_ready": keys.ready(fid), "key_source": keys.source(fid)}


@app.get("/api/students/{sid}/export.csv")
def export_csv(sid: int, request: Request, db: Session = Depends(get_db)):
    """Exporta el progreso (temas y respuestas) en CSV para abrir con Excel."""
    import csv
    import io
    from fastapi.responses import Response
    s = own_student(db, parent_family(request), sid)
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(["DOMINIO POR TEMA"])
    w.writerow(["Asignatura", "Tema", "Dominio (0-100)", "Estado", "En clase", "Respondidas", "Aciertos"])
    for sub in s.subjects:
        for t in sub.topics:
            w.writerow([sub.name, t.title, round(t.mastery) if t.evaluated else "",
                        learning.STATUS_LABEL[learning.status_of(t)], "sí" if t.focus else "", t.answered, t.correct])
    w.writerow([])
    w.writerow(["RESPUESTAS"])
    w.writerow(["Fecha", "Asignatura", "Tema", "Pregunta", "Respuesta del alumno", "Respuesta correcta",
                "Puntuación", "Dificultad", "Destreza"])
    subj = {x.id: x.name for x in s.subjects}
    topics = {t.id: t.title for x in s.subjects for t in x.topics}
    for a in db.query(Answer).filter(Answer.student_id == s.id).order_by(Answer.created_at).all():
        w.writerow([a.created_at.strftime("%Y-%m-%d %H:%M"), subj.get(a.subject_id, ""), topics.get(a.topic_id, ""),
                    a.question, a.given, a.expected, str(a.correct).replace(".", ","), a.difficulty, a.skill])
    import unicodedata
    from urllib.parse import quote
    fname = f"pupitre_{s.name}_{date.today()}.csv".replace(" ", "_")
    ascii_name = unicodedata.normalize("NFKD", fname).encode("ascii", "ignore").decode() or "pupitre.csv"
    return Response("\ufeff" + buf.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(fname)}"})


@app.post("/api/ai/check")
def ai_check(request: Request):
    return ai.check_service(parent_family(request))


class KeyIn(BaseModel):
    key: str = Field(default="", max_length=300)


@app.post("/api/family/openrouter-key")
def set_openrouter_key(body: KeyIn, request: Request, db: Session = Depends(get_db)):
    """Guarda (validándola antes con OpenRouter) o borra la clave de la familia."""
    f = db.get(Family, parent_family(request))
    k = body.key.strip()
    if not k:
        f.openrouter_key_enc = ""
        db.commit()
        return {"ok": True, "removed": True, "ai_ready": config.AI_READY}
    v = keys.validate(k)
    if not v["ok"]:
        raise HTTPException(400, v["error"])
    f.openrouter_key_enc = keys.encrypt(k)
    db.commit()
    return {"ok": True, "masked": keys.mask(k), "limit_remaining": v.get("limit_remaining"), "ai_ready": True}


# ---------------------------------------------------------------------------
# Tarea programada: informes semanales (Cloud Scheduler)
# ---------------------------------------------------------------------------

@app.post("/api/cron/weekly-reports")
def cron_reports(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("X-Cron-Token", "")
    if not config.CRON_TOKEN or not hmac.compare_digest(token, config.CRON_TOKEN):
        raise HTTPException(403, "No autorizado")
    sent, failed = 0, 0
    for s in reports.due_students(db):
        e = reports.send_report(db, s, 7)
        sent += e.status == "enviado"
        failed += e.status != "enviado"
    return {"sent": sent, "failed": failed}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=config.PORT)
