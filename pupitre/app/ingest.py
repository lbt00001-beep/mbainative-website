"""Lectura de libros y documentos, troceado y búsqueda de fragmentos relevantes."""
from __future__ import annotations

import io
import logging
import re
import unicodedata
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from . import ai, config
from .db import Chunk, Document, SessionLocal, Subject, Topic

log = logging.getLogger("pupitre.ingest")

IMAGE_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
               ".heic": "image/heic"}
ACCEPTED = {".pdf", ".docx", ".txt", ".md", ".csv", *IMAGE_TYPES}


def ext_of(name: str) -> str:
    m = re.search(r"\.[A-Za-z0-9]+$", name or "")
    return m.group(0).lower() if m else ""


def _set(doc_id: int, **fields) -> None:
    with SessionLocal() as db:
        d = db.get(Document, doc_id)
        if d:
            for k, v in fields.items():
                setattr(d, k, v)
            db.commit()


# ---------------------------------------------------------------------------
# Extracción de texto
# ---------------------------------------------------------------------------

def extract_pages(doc_id: int, filename: str, data: bytes, family_id: int) -> list[tuple[int, str]]:
    """Devuelve [(número de página, texto)]. Las páginas sin texto (escaneadas) se leen con IA."""
    ext = ext_of(filename)
    if ext == ".pdf":
        return _pdf_pages(doc_id, data, family_id)
    if ext == ".docx":
        import docx
        d = docx.Document(io.BytesIO(data))
        parts = [p.text for p in d.paragraphs if p.text.strip()]
        for t in d.tables:
            for row in t.rows:
                parts.append(" | ".join(c.text.strip() for c in row.cells))
        return [(1, "\n".join(parts))]
    if ext in (".txt", ".md", ".csv"):
        for enc in ("utf-8", "latin-1"):
            try:
                return [(1, data.decode(enc))]
            except UnicodeDecodeError:
                continue
    if ext in IMAGE_TYPES:
        img, mime = _normalize_image(data, IMAGE_TYPES[ext])
        return [(1, ai.ocr_image(img, mime, family_id=family_id))]
    raise ValueError("Formato no admitido")


def _normalize_image(data: bytes, mime: str) -> tuple[bytes, str]:
    """Reduce fotos grandes del móvil para abaratar la lectura (máx. 2000 px de lado)."""
    try:
        import pymupdf
        pix = pymupdf.Pixmap(data)
        if max(pix.width, pix.height) > 2000:
            f = 2000 / max(pix.width, pix.height)
            pix = pymupdf.Pixmap(pix, int(pix.width * f), int(pix.height * f), None)
        if pix.alpha:
            pix = pymupdf.Pixmap(pix, 0)
        return pix.tobytes("jpeg", jpg_quality=85), "image/jpeg"
    except Exception:  # noqa: BLE001 - si no se puede convertir, se envía tal cual
        return data, mime


def _pdf_pages(doc_id: int, data: bytes, family_id: int) -> list[tuple[int, str]]:
    import pymupdf
    pdf = pymupdf.open(stream=data, filetype="pdf")
    n = pdf.page_count
    _set(doc_id, pages=n)
    pages: dict[int, str] = {}
    scanned: list[int] = []
    for i, page in enumerate(pdf):
        txt = page.get_text("text") or ""
        if len(txt.strip()) >= 80:
            pages[i + 1] = txt
        else:
            scanned.append(i)
    if scanned:
        scanned = scanned[: config.MAX_OCR_PAGES]
        images = []
        for i in scanned:
            pix = pdf[i].get_pixmap(dpi=130)
            images.append((i + 1, pix.tobytes("jpeg", jpg_quality=80)))
        done = [0]

        def work(item):
            num, img = item
            try:
                text = ai.ocr_image(img, "image/jpeg", family_id=family_id)
            except ai.AiError as e:
                log.warning("OCR página %s: %s", num, e)
                text = ""
            done[0] += 1
            _set(doc_id, progress=int(100 * (len(pages) + done[0]) / max(1, n)))
            return num, text

        with ThreadPoolExecutor(max_workers=config.OCR_WORKERS) as ex:
            for num, text in ex.map(work, images):
                if text.strip():
                    pages[num] = text
    pdf.close()
    return sorted(pages.items())


# ---------------------------------------------------------------------------
# Troceado
# ---------------------------------------------------------------------------

def make_chunks(pages: list[tuple[int, str]], size: int = 1400, overlap: int = 200) -> list[tuple[int, str]]:
    out = []
    for page, text in pages:
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + size)
            if end < len(text):
                cut = text.rfind("\n", start + size // 2, end)
                if cut == -1:
                    cut = text.rfind(". ", start + size // 2, end)
                end = cut + 1 if cut != -1 else end
            piece = text[start:end].strip()
            if len(piece) > 40:
                out.append((page, piece))
            if end >= len(text):
                break
            start = max(end - overlap, start + 1)
    return out


def segments(pages: list[tuple[int, str]], size: int) -> list[str]:
    out, cur, n = [], [], 0
    for p, t in pages:
        piece = f"[pág. {p}] {t}"
        if cur and n + len(piece) > size:
            out.append("\n\n".join(cur))
            cur, n = [], 0
        cur.append(piece[:size])
        n += len(piece)
    if cur:
        out.append("\n\n".join(cur))
    return out


def pdf_outline(data: bytes) -> str:
    """Índice interno (marcadores) del PDF, si lo tiene."""
    try:
        import pymupdf
        with pymupdf.open(stream=data, filetype="pdf") as pdf:
            toc = pdf.get_toc(simple=True)
        return "\n".join(f"{'  ' * (lvl - 1)}{title} (pág. {page})" for lvl, title, page in toc[:150] if lvl <= 3)
    except Exception:  # noqa: BLE001
        return ""


# ---------------------------------------------------------------------------
# Proceso completo de un documento (se ejecuta en segundo plano)
# ---------------------------------------------------------------------------

def process_document(doc_id: int, filename: str, data: bytes, family_id: int) -> None:
    try:
        _set(doc_id, status="procesando", progress=5)
        pages = extract_pages(doc_id, filename, data, family_id)
        chunks = make_chunks(pages)
        if not chunks:
            _set(doc_id, status="error", error="No se ha encontrado texto legible en el archivo.")
            return
        with SessionLocal() as db:
            d = db.get(Document, doc_id)
            if d is None:
                return
            for i, (page, text) in enumerate(chunks):
                db.add(Chunk(document_id=doc_id, subject_id=d.subject_id, idx=i, page=page, text=text))
            d.chars = sum(len(t) for _, t in chunks)
            d.pages = d.pages or len(pages)
            d.progress = 90
            subject = db.get(Subject, d.subject_id)
            existing = [t.title for t in subject.topics]
            course = subject.student.course
            subject_name = subject.name
            subject_id = subject.id
            db.commit()

        toc = pdf_outline(data) if ext_of(filename) == ".pdf" else ""
        topics = []
        # Libros completos: se analizan por tramos (unos 90.000 caracteres, ~60 páginas) para que
        # ningún tema se quede fuera. Cada tramo conoce los temas ya encontrados para no repetirlos.
        for seg in segments(pages, 90_000):
            if len(existing) + len(topics) >= 40:
                break
            hint = (f"ÍNDICE DEL LIBRO (úsalo como guía de los temas):\n{toc}\n\n" if toc else "")
            found = ai.extract_topics(subject_name, course, hint + seg,
                                      existing + [t["title"] for t in topics], family_id=family_id)
            topics.extend(found)
            _set(doc_id, progress=min(99, 90 + len(topics) // 2))
        with SessionLocal() as db:
            pos = db.query(Topic).filter_by(subject_id=subject_id).count()
            for t in topics:
                db.add(Topic(subject_id=subject_id, title=t["title"], summary=t["summary"],
                             keywords=t["keywords"], position=pos))
                pos += 1
            db.commit()
        _set(doc_id, status="listo", progress=100)
    except ai.AiError as e:
        _set(doc_id, status="error", error=str(e))
    except Exception as e:  # noqa: BLE001
        log.exception("Error procesando documento %s", doc_id)
        _set(doc_id, status="error", error=f"No se pudo leer el archivo ({type(e).__name__}).")


# ---------------------------------------------------------------------------
# Búsqueda de fragmentos relevantes (BM25 ligero, sin embeddings)
# ---------------------------------------------------------------------------

STOP = set("""a al algo como con de del donde el ella ellas ellos en entre era es esta este esto estos fue ha han hay
la las le les lo los mas me mi muy no nos o para pero por que se si sin sobre son su sus te tiene tu un una uno unos
y ya yo cual cuales cuando tambien porque cada otro otra otros otras puede pueden ser hacer tema""".split())


def tokens(text: str) -> list[str]:
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return [w[:7] for w in re.findall(r"[a-z0-9]{3,}", t) if w not in STOP]


def retrieve(subject_id: int, query: str, max_chars: int = 7000) -> str:
    with SessionLocal() as db:
        rows = db.query(Chunk.text, Chunk.page).filter(Chunk.subject_id == subject_id).all()
    if not rows:
        return ""
    q = Counter(tokens(query))
    if not q:
        return "\n\n".join(r.text for r in rows[:4])[:max_chars]
    docs = [Counter(tokens(r.text)) for r in rows]
    n = len(docs)
    df = Counter()
    for d in docs:
        df.update(set(d))
    avg = sum(sum(d.values()) for d in docs) / n or 1
    import math
    scored = []
    for i, d in enumerate(docs):
        L = sum(d.values()) or 1
        s = 0.0
        for w, qf in q.items():
            if w in d:
                idf = math.log(1 + (n - df[w] + 0.5) / (df[w] + 0.5))
                tf = d[w]
                s += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * L / avg)) * qf
        scored.append((s, i))
    scored.sort(reverse=True)
    out, total = [], 0
    for s, i in scored:
        if s <= 0 and out:
            break
        t = rows[i].text
        if total + len(t) > max_chars:
            break
        out.append(f"[pág. {rows[i].page}] {t}")
        total += len(t)
    return "\n\n".join(out)


def topic_context(topic: Topic, max_chars: int = 7000) -> str:
    return retrieve(topic.subject_id, f"{topic.title} {topic.title} {topic.keywords} {topic.summary}", max_chars)
