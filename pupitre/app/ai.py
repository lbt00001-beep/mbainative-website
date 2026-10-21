"""Capa de IA: OpenRouter, prompts pedagógicos y validación de las respuestas del modelo.

Cada función de alto nivel devuelve datos ya validados y saneados, de modo que el resto
de la app nunca trabaja con texto libre del modelo sin comprobar.
"""
from __future__ import annotations

import base64
import json
import logging
import random
import re
from datetime import date

import httpx

from . import config
from .db import AiUsage, SessionLocal

log = logging.getLogger("pupitre.ai")


class AiError(Exception):
    pass


# ---------------------------------------------------------------------------
# Adaptación al curso
# ---------------------------------------------------------------------------

def level_guide(course: str) -> str:
    c = (course or "").lower()
    if "infantil" in c or c.startswith(("1º primaria", "2º primaria")):
        return ("Alumno de 5 a 8 años. Frases muy cortas (máximo 12 palabras), vocabulario cotidiano, "
                "un concepto cada vez, ejemplos de su vida diaria (juguetes, comida, familia, animales). "
                "Tono cálido y animado.")
    if c.startswith(("3º primaria", "4º primaria")):
        return ("Alumno de 8 a 10 años. Frases claras y cortas, explica cada palabra técnica nueva, "
                "ejemplos concretos y cercanos. Tono cercano y motivador.")
    if c.startswith(("5º primaria", "6º primaria")):
        return ("Alumno de 10 a 12 años. Lenguaje claro, introduce el vocabulario propio de la materia "
                "con su definición, ejemplos y pequeñas comparaciones. Tono cercano, sin infantilizar.")
    if "eso" in c:
        return ("Alumno de 12 a 16 años de ESO. Lenguaje preciso con terminología de la materia, "
                "razonamiento paso a paso, conexiones entre ideas. Tono respetuoso, nada infantil.")
    if "bachillerato" in c:
        return ("Alumno de 16 a 18 años de Bachillerato. Rigor académico, terminología exacta, "
                "análisis y relación de conceptos, nivel preuniversitario.")
    return "Adapta el lenguaje a un alumno de primaria."


BASE_RULES = (
    "Eres el tutor de Pupitre, una app educativa para alumnos españoles que estudian en casa. "
    "Escribes siempre en español de España, con ortografía y puntuación impecables. "
    "Eres riguroso: nunca inventas datos, fechas ni definiciones; si el material del alumno trae "
    "información, te ciñes a ella. Contenido siempre adecuado para menores."
)


def _is_math(subject: str) -> bool:
    s = (subject or "").lower()
    return "mate" in s or "matem" in s


# ---------------------------------------------------------------------------
# Cliente OpenRouter
# ---------------------------------------------------------------------------

def _check_and_count(family_id: int | None, usage: dict | None) -> None:
    if family_id is None:
        return
    with SessionLocal() as db:
        row = db.query(AiUsage).filter_by(family_id=family_id, day=date.today()).first()
        if row is None:
            row = AiUsage(family_id=family_id, day=date.today(), calls=0, tokens_in=0, tokens_out=0, cost=0.0)
            db.add(row)
        if usage is None:  # comprobación previa
            if row.calls >= config.DAILY_AI_LIMIT:
                raise AiError("Se ha alcanzado el límite diario de uso de la IA. Mañana se renueva.")
            db.commit()
            return
        row.calls += 1
        row.tokens_in += int(usage.get("prompt_tokens") or 0)
        row.tokens_out += int(usage.get("completion_tokens") or 0)
        row.cost += float(usage.get("cost") or 0.0)
        db.commit()


def chat(messages: list[dict], *, family_id: int | None, json_mode: bool = True, vision: bool = False,
         max_tokens: int = 3000, temperature: float = 0.4) -> str:
    """Llamada a OpenRouter con modelo de respaldo. Devuelve el texto de la respuesta."""
    from . import keys
    api_key = keys.key_for(family_id)
    if not api_key:
        raise AiError(keys.MISSING_MESSAGE)
    _check_and_count(family_id, None)
    primary = config.MODEL_VISION if vision else config.MODEL_MAIN
    models = [primary] + ([config.MODEL_FALLBACK] if config.MODEL_FALLBACK and config.MODEL_FALLBACK != primary else [])
    body = {
        "model": primary,
        "models": models,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "usage": {"include": True},
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": config.APP_URL,
        "X-Title": config.APP_NAME,
    }
    last_err = None
    # 1.º principal con respaldo automático; 2.º solo el respaldo (por si el nombre del principal
    # no existe en OpenRouter y la petición conjunta falla con 400); 3.º reintento simple.
    plans = [body]
    if len(models) > 1:
        plans.append({**{k: v for k, v in body.items() if k != "models"}, "model": models[1]})
    plans.append(body)
    for b in plans:
        try:
            r = httpx.post(config.OPENROUTER_URL, json=b, headers=headers, timeout=config.AI_TIMEOUT)
            if r.status_code >= 400:
                last_err = f"HTTP {r.status_code}: {r.text[:300]}"
                if r.status_code == 401:
                    raise AiError("La clave de OpenRouter no es válida. Revísala en Ajustes › Clave de OpenRouter.")
                if r.status_code in (402, 403):
                    break
                continue
            data = r.json()
            content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
            _check_and_count(family_id, data.get("usage") or {})
            if not content.strip():
                last_err = "respuesta vacía"
                continue
            return content
        except (httpx.HTTPError, ValueError) as e:
            last_err = str(e)
    log.error("OpenRouter error: %s", last_err)
    if last_err and "402" in last_err:
        raise AiError("La cuenta de OpenRouter no tiene saldo suficiente. Añade crédito en openrouter.ai.")
    raise AiError("El servicio de IA no ha respondido. Inténtalo de nuevo en unos segundos.")


def check_service(family_id: int | None) -> dict:
    """Comprueba la clave de la familia, que los modelos existen y una llamada real mínima."""
    from . import keys
    api_key = keys.key_for(family_id)
    out = {"configured": bool(api_key), "source": keys.source(family_id), "key": None, "models": {}, "test": None}
    if not api_key:
        out["key"] = {"ok": False, "error": keys.MISSING_MESSAGE}
        return out
    h = {"Authorization": f"Bearer {api_key}"}
    try:
        r = httpx.get("https://openrouter.ai/api/v1/key", headers=h, timeout=20)
        if r.status_code == 200:
            d = r.json().get("data", {})
            out["key"] = {"ok": True, "usage": d.get("usage"), "limit": d.get("limit"),
                          "limit_remaining": d.get("limit_remaining")}
        else:
            out["key"] = {"ok": False, "error": f"HTTP {r.status_code}"}
    except httpx.HTTPError as e:
        out["key"] = {"ok": False, "error": str(e)}
    try:
        r = httpx.get("https://openrouter.ai/api/v1/models", timeout=30)
        catalog = {m["id"]: m for m in r.json().get("data", [])}
        for role, slug in (("principal", config.MODEL_MAIN), ("respaldo", config.MODEL_FALLBACK),
                           ("visión", config.MODEL_VISION)):
            m = catalog.get(slug)
            price = (m or {}).get("pricing", {})
            out["models"][role] = {
                "id": slug, "exists": bool(m),
                "input_per_m": round(float(price.get("prompt", 0)) * 1e6, 3) if m else None,
                "output_per_m": round(float(price.get("completion", 0)) * 1e6, 3) if m else None,
                "vision": "image" in ((m or {}).get("architecture", {}).get("input_modalities") or []),
                "similar": [k for k in catalog if k.split("/")[0] == slug.split("/")[0]
                            and slug.split("/")[-1].split("-")[0] in k][:6] if not m else [],
            }
    except (httpx.HTTPError, ValueError, KeyError) as e:
        out["models_error"] = str(e)
    try:
        t0 = __import__("time").time()
        txt = chat([{"role": "user", "content": 'Responde solo este JSON: {"ok": true, "saludo": "hola"}'}],
                   family_id=family_id, max_tokens=50, temperature=0)
        out["test"] = {"ok": parse_json(txt).get("ok") is True, "seconds": round(__import__("time").time() - t0, 1)}
    except AiError as e:
        out["test"] = {"ok": False, "error": str(e)}
    return out


def parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    raise AiError("La IA devolvió un formato inesperado. Inténtalo de nuevo.")


def ask_json(system: str, user: str, *, family_id: int | None, max_tokens: int = 3000,
             temperature: float = 0.4) -> dict:
    msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    for _ in range(2):
        try:
            return parse_json(chat(msgs, family_id=family_id, max_tokens=max_tokens, temperature=temperature))
        except AiError as e:
            err = e
            if "formato" not in str(e):
                raise
    raise err  # noqa


def _clip(s: str, n: int) -> str:
    s = (s or "").strip()
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


# ---------------------------------------------------------------------------
# 1. Lectura de páginas escaneadas y fotos (OCR)
# ---------------------------------------------------------------------------

def ocr_image(image_bytes: bytes, mime: str, *, family_id: int | None) -> str:
    b64 = base64.b64encode(image_bytes).decode()
    msgs = [
        {"role": "system", "content": "Transcribes páginas de libros de texto escolares con total fidelidad."},
        {"role": "user", "content": [
            {"type": "text", "text": (
                "Transcribe todo el texto de esta página en orden de lectura. Mantén títulos, listas y "
                "enunciados de ejercicios. Para fórmulas usa notación de texto sencilla (3/4, x², √9). "
                "Si hay ilustraciones con contenido didáctico, descríbelas en una línea entre corchetes. "
                "Devuelve solo la transcripción, sin comentarios.")},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]},
    ]
    return chat(msgs, family_id=family_id, json_mode=False, vision=True, max_tokens=4000, temperature=0.0).strip()


# ---------------------------------------------------------------------------
# 2. Temario a partir del material
# ---------------------------------------------------------------------------

def extract_topics(subject: str, course: str, material: str, existing: list[str], *,
                   family_id: int | None) -> list[dict]:
    system = BASE_RULES + " Eres además un experto en programación didáctica del currículo español."
    user = f"""Asignatura: {subject}
Curso del alumno: {course}
Temas que ya existen (no los repitas): {json.dumps(existing, ensure_ascii=False)}

A partir del MATERIAL, identifica los temas o unidades de aprendizaje que contiene, en el orden del libro.
Cada tema debe ser evaluable por separado (ni demasiado amplio ni una simple anécdota). Como mucho 12 temas.
Puede que el MATERIAL sea solo una parte del libro: devuelve únicamente los temas NUEVOS que aparecen en él.
Si solo continúa temas que ya existen, o es un índice, portada o solucionario, devuelve "topics": [].

Devuelve JSON: {{"topics": [{{"title": "título breve (máx. 8 palabras)", "summary": "qué debe saber y saber hacer el alumno, 2-3 frases", "keywords": ["5-8 conceptos clave"]}}]}}

MATERIAL:
\"\"\"{material[:110000]}\"\"\""""
    data = ask_json(system, user, family_id=family_id, max_tokens=3000, temperature=0.2)
    out = []
    seen = {e.lower() for e in existing}
    for t in data.get("topics", [])[:12]:
        title = _clip(str(t.get("title", "")), 120)
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        kws = t.get("keywords") or []
        out.append({"title": title, "summary": _clip(str(t.get("summary", "")), 600),
                    "keywords": ", ".join(str(k) for k in kws[:10]) if isinstance(kws, list) else str(kws)})
    return out


# ---------------------------------------------------------------------------
# 3. Preguntas (prueba de nivel, test, contrarreloj)
# ---------------------------------------------------------------------------

def make_questions(subject: str, course: str, blocks: list[dict], *, mode: str, family_id: int | None,
                   notes: str = "") -> list[dict]:
    """blocks: [{topic_id, title, summary, context, n, difficulty}] -> lista de preguntas validadas."""
    total = sum(b["n"] for b in blocks)
    only_mc = mode == "contrarreloj"
    style = {
        "diagnostico": ("Es una PRUEBA DE NIVEL inicial: para cada tema reparte la dificultad (1 fácil, 2 media, "
                        "3 alta) para medir dónde está el alumno. Mezcla tipo test y respuesta corta."),
        "test": ("Es una PRÁCTICA ADAPTATIVA: respeta la dificultad objetivo indicada en cada tema. "
                 "Mezcla tipo test (70 %) y respuesta corta (30 %). Incluye preguntas de aplicación, no solo memoria."),
        "contrarreloj": ("Es un JUEGO CONTRARRELOJ: preguntas tipo test que se respondan en menos de 10 segundos, "
                         "claras y directas, dificultad 1-2."),
    }[mode]
    math = ("\nEs MATEMÁTICAS: resuelve tú cada ejercicio paso a paso ANTES de escribir las opciones y "
            "comprueba que la respuesta correcta es exacta. Usa números concretos. Notación de texto simple.") \
        if _is_math(subject) else ""
    topics_txt = "\n\n".join(
        f"### TEMA id={b['topic_id']}: {b['title']}\nObjetivo: {b['summary']}\nNº de preguntas: {b['n']}  "
        f"Dificultad objetivo: {b.get('difficulty', 2)}\nMaterial del alumno:\n\"\"\"{b['context'][:6000]}\"\"\""
        for b in blocks)
    system = BASE_RULES + "\n" + level_guide(course)
    user = f"""Asignatura: {subject}. Curso: {course}.{(' Notas de la familia: ' + notes) if notes else ''}
{style}{math}

Genera exactamente {total} preguntas basadas en el material de cada tema (si el material es escaso, usa los
contenidos estándar del curso para ese tema).
Reglas:
- Tipo test: 4 opciones plausibles, una sola correcta, distractores basados en errores típicos de alumnos.
- Respuesta corta: se responde en 1-10 palabras o con un número.
- "skill": la destreza concreta que mide (p. ej. "sumar fracciones con distinto denominador").
- "explanation": explicación breve y clara del porqué, para el alumno.
{'- SOLO tipo test.' if only_mc else ''}

Devuelve JSON: {{"questions": [{{"topic_id": 0, "type": "mc" o "short", "question": "...", "options": ["..."] (solo mc),
"answer_index": 0 (solo mc), "answer": "respuesta correcta en texto", "explanation": "...", "difficulty": 1, "skill": "..."}}]}}

{topics_txt}"""
    data = ask_json(system, user, family_id=family_id, max_tokens=min(8000, 600 + total * 260), temperature=0.5)
    qs = _sanitize_questions(data.get("questions", []), {b["topic_id"] for b in blocks}, only_mc)
    if _is_math(subject) and qs:
        qs = verify_math(subject, course, qs, family_id=family_id)
    return qs


def _sanitize_questions(raw: list, topic_ids: set, only_mc: bool) -> list[dict]:
    out = []
    default_tid = next(iter(topic_ids)) if topic_ids else None
    for q in raw:
        if not isinstance(q, dict) or not str(q.get("question", "")).strip():
            continue
        qtype = "mc" if q.get("type") == "mc" or only_mc else "short"
        item = {
            "topic_id": q.get("topic_id") if q.get("topic_id") in topic_ids else default_tid,
            "type": qtype,
            "question": _clip(str(q["question"]), 600),
            "answer": _clip(str(q.get("answer", "")), 300),
            "explanation": _clip(str(q.get("explanation", "")), 700),
            "difficulty": max(1, min(3, int(q.get("difficulty") or 2))) if str(q.get("difficulty", "2")).isdigit() else 2,
            "skill": _clip(str(q.get("skill", "")), 110),
        }
        if qtype == "mc":
            opts = [_clip(str(o), 250) for o in (q.get("options") or []) if str(o).strip()]
            try:
                ai = int(q.get("answer_index"))
            except (TypeError, ValueError):
                ai = -1
            if len(opts) < 2 or len(set(opts)) != len(opts) or not 0 <= ai < len(opts):
                continue
            # barajar para que la correcta no caiga siempre en el mismo sitio
            correct = opts[ai]
            random.shuffle(opts)
            item["options"] = opts[:5]
            item["answer_index"] = item["options"].index(correct) if correct in item["options"] else 0
            item["answer"] = correct
        elif not item["answer"]:
            continue
        out.append(item)
    return out


def verify_math(subject: str, course: str, qs: list[dict], *, family_id: int | None) -> list[dict]:
    """Segunda pasada: un revisor comprueba cada ejercicio y corrige o descarta los erróneos."""
    listing = [{"i": i, "question": q["question"], "options": q.get("options"), "answer": q["answer"]}
               for i, q in enumerate(qs)]
    system = "Eres un profesor de matemáticas meticuloso que revisa exámenes antes de entregarlos."
    user = f"""Revisa cada ejercicio ({course}). Resuélvelo tú de forma independiente.
- Si la respuesta marcada es correcta: ok=true.
- Si es incorrecta pero la correcta está entre las opciones (o es un número/expresión clara): ok=false y da "fixed_answer" (texto exacto de la opción correcta, si hay opciones).
- Si el enunciado es ambiguo o ninguna opción es correcta: ok=false, discard=true.
Devuelve JSON: {{"review": [{{"i": 0, "ok": true, "fixed_answer": "", "discard": false}}]}}

{json.dumps(listing, ensure_ascii=False)}"""
    try:
        data = ask_json(system, user, family_id=family_id, max_tokens=2500, temperature=0.0)
    except AiError:
        return qs
    drop = set()
    for r in data.get("review", []):
        i = r.get("i")
        if not isinstance(i, int) or not 0 <= i < len(qs) or r.get("ok"):
            continue
        q = qs[i]
        fixed = str(r.get("fixed_answer") or "").strip()
        if r.get("discard") or not fixed:
            drop.add(i)
        elif q["type"] == "mc":
            if fixed in q["options"]:
                q["answer_index"] = q["options"].index(fixed)
                q["answer"] = fixed
            else:
                drop.add(i)
        else:
            q["answer"] = fixed
    return [q for i, q in enumerate(qs) if i not in drop]


def grade_short(subject: str, course: str, items: list[dict], *, family_id: int | None) -> list[dict]:
    """items: [{question, expected, given}] -> [{score 0/0.5/1, feedback}]"""
    if not items:
        return []
    system = BASE_RULES + "\n" + level_guide(course)
    user = f"""Corrige estas respuestas cortas de {subject}. Sé justo: acepta sinónimos, faltas de ortografía leves
y formas equivalentes (en matemáticas, valores equivalentes como 0,5 y 1/2). score: 1 correcta, 0.5 parcialmente
correcta, 0 incorrecta o en blanco. "feedback": 1-2 frases dirigidas al alumno, que expliquen el error si lo hay
y le animen. "error_type": categoría breve del error si score<1 (p. ej. "confunde conceptos", "error de cálculo",
"respuesta incompleta", "no responde").
Devuelve JSON: {{"grades": [{{"i": 0, "score": 1, "feedback": "...", "error_type": ""}}]}}

{json.dumps([{"i": i, **it} for i, it in enumerate(items)], ensure_ascii=False)}"""
    data = ask_json(system, user, family_id=family_id, max_tokens=1500, temperature=0.0)
    by_i = {g.get("i"): g for g in data.get("grades", []) if isinstance(g, dict)}
    out = []
    for i, it in enumerate(items):
        g = by_i.get(i, {})
        try:
            s = float(g.get("score", 0))
        except (TypeError, ValueError):
            s = 0.0
        s = 1.0 if s >= 0.75 else 0.5 if s >= 0.25 else 0.0
        out.append({"score": s, "feedback": _clip(str(g.get("feedback", "")), 400),
                    "error_type": _clip(str(g.get("error_type", "")), 60)})
    return out


def _norm(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9/,.]+", " ", s).strip().replace(",", ".")


# ---------------------------------------------------------------------------
# 4. Tarjetas de memoria y parejas
# ---------------------------------------------------------------------------

def make_flashcards(subject: str, course: str, topic: dict, context: str, n: int, *,
                    family_id: int | None) -> list[dict]:
    system = BASE_RULES + "\n" + level_guide(course)
    user = f"""Crea {n} tarjetas de memoria (flashcards) sobre el tema «{topic['title']}» de {subject}.
Objetivo del tema: {topic['summary']}
Cada tarjeta: "front" una pregunta o concepto breve; "back" la respuesta, en 1-2 frases (máx. 30 palabras).
Cubre los conceptos más importantes del material, de lo básico a lo más complejo. Sin repetir.
{'En matemáticas incluye también procedimientos y ejemplos resueltos breves.' if _is_math(subject) else ''}
Devuelve JSON: {{"cards": [{{"front": "...", "back": "..."}}]}}

Material:
\"\"\"{context[:9000]}\"\"\""""
    data = ask_json(system, user, family_id=family_id, max_tokens=2500, temperature=0.4)
    cards = []
    for c in data.get("cards", [])[: n + 2]:
        f, b = _clip(str(c.get("front", "")), 300), _clip(str(c.get("back", "")), 500)
        if f and b:
            cards.append({"front": f, "back": b})
    return cards


def make_pairs(subject: str, course: str, topic: dict, context: str, *, family_id: int | None) -> list[dict]:
    system = BASE_RULES + "\n" + level_guide(course)
    user = f"""Juego de emparejar sobre «{topic['title']}» ({subject}). Crea 6 parejas concepto ↔ definición
(o en matemáticas operación ↔ resultado, en historia hecho ↔ fecha o personaje, etc.).
Cada lado máximo 8 palabras. Sin ambigüedades: cada elemento solo puede casar con su pareja.
Devuelve JSON: {{"pairs": [{{"a": "...", "b": "..."}}]}}

Material:
\"\"\"{context[:6000]}\"\"\""""
    data = ask_json(system, user, family_id=family_id, max_tokens=800, temperature=0.4)
    pairs = [{"a": _clip(str(p.get("a", "")), 80), "b": _clip(str(p.get("b", "")), 100)}
             for p in data.get("pairs", []) if p.get("a") and p.get("b")]
    if _is_math(subject) and pairs:
        pairs = _verify_pairs(pairs, course, family_id)
    return pairs[:6]


def _verify_pairs(pairs, course, family_id):
    user = f"""Comprueba que cada pareja es matemáticamente correcta ({course}). Devuelve solo las correctas.
JSON: {{"pairs": [{{"a": "...", "b": "..."}}]}}
{json.dumps(pairs, ensure_ascii=False)}"""
    try:
        data = ask_json("Eres un profesor de matemáticas meticuloso.", user, family_id=family_id,
                        max_tokens=800, temperature=0.0)
        ok = [p for p in data.get("pairs", []) if p.get("a") and p.get("b")]
        return ok if len(ok) >= 4 else pairs
    except AiError:
        return pairs


# ---------------------------------------------------------------------------
# 5. Lección interactiva (presentación)
# ---------------------------------------------------------------------------

def make_lesson(subject: str, course: str, topic: dict, context: str, mastery: float, weak_skills: list[str], *,
                family_id: int | None, notes: str = "") -> dict:
    focus = ("Empieza desde cero, con mucha base." if mastery < 30 else
             "Repasa lo básico rápido y profundiza." if mastery < 70 else
             "El alumno ya domina lo básico: ve a aplicaciones y retos.")
    system = BASE_RULES + "\n" + level_guide(course) + "\nEres un diseñador instruccional excelente."
    user = f"""Crea una lección interactiva tipo presentación sobre «{topic['title']}» ({subject}, {course}).
Objetivo: {topic['summary']}
Nivel actual del alumno en este tema: {round(mastery)}/100. {focus}
{('Destrezas en las que ha fallado: ' + '; '.join(weak_skills)) if weak_skills else ''}
{('Notas de la familia: ' + notes) if notes else ''}

Entre 6 y 8 diapositivas. Cada una enseña UNA idea:
- "title": máx. 7 palabras.
- "text": explicación de 2-4 frases cortas. Puedes usar **negrita** para el término clave.
- "example": un ejemplo concreto o una situación cotidiana (1-2 frases).
- "emoji": un emoji que represente la idea.
- "check": en las diapositivas 2, 4 y 6 (y en la última), una pregunta rápida de comprobación tipo test
  {{"question": "...", "options": ["3 opciones"], "answer_index": 0, "explanation": "..."}}; en las demás null.
La última diapositiva es un resumen de 3 ideas clave ("text" con las tres ideas separadas por " · ").
Basado en el material del alumno; si es escaso, usa los contenidos estándar del curso.
{'Matemáticas: resuelve los ejemplos con todos los pasos y comprueba los resultados.' if _is_math(subject) else ''}

Devuelve JSON: {{"title": "...", "intro": "1 frase motivadora", "slides": [{{"title":"","text":"","example":"","emoji":"","check":null}}]}}

Material:
\"\"\"{context[:9000]}\"\"\""""
    data = ask_json(system, user, family_id=family_id, max_tokens=4000, temperature=0.5)
    slides = []
    for s in data.get("slides", [])[:9]:
        chk = s.get("check")
        if isinstance(chk, dict):
            opts = [str(o) for o in chk.get("options") or []]
            try:
                ai = int(chk.get("answer_index"))
            except (TypeError, ValueError):
                ai = -1
            chk = {"question": _clip(str(chk.get("question", "")), 300), "options": opts,
                   "answer_index": ai, "explanation": _clip(str(chk.get("explanation", "")), 400)} \
                if len(opts) >= 2 and 0 <= ai < len(opts) else None
        else:
            chk = None
        slides.append({"title": _clip(str(s.get("title", "")), 80), "text": _clip(str(s.get("text", "")), 700),
                       "example": _clip(str(s.get("example", "")), 400), "emoji": str(s.get("emoji", "📘"))[:4],
                       "check": chk})
    if len(slides) < 3:
        raise AiError("No se pudo preparar la lección. Inténtalo de nuevo.")
    return {"title": _clip(str(data.get("title") or topic["title"]), 100),
            "intro": _clip(str(data.get("intro", "")), 200), "slides": slides}


# ---------------------------------------------------------------------------
# 6. Tutor conversacional (y ayuda con los deberes con foto)
# ---------------------------------------------------------------------------

def tutor_reply(subject: str, course: str, student_name: str, history: list[dict], context: str,
                image: tuple[bytes, str] | None, mode: str, *, family_id: int | None, notes: str = "") -> str:
    deberes = mode == "deberes"
    system = f"""{BASE_RULES}
{level_guide(course)}
Hablas con {student_name}, alumno de {course}, en la asignatura de {subject}.
{('Notas de la familia sobre el alumno: ' + notes) if notes else ''}
MÉTODO (muy importante):
- Eres un tutor socrático: NUNCA das directamente la solución de un ejercicio o deber. Guías con preguntas,
  pistas graduadas y ejemplos parecidos con otros números o palabras. Solo si el alumno ya lo ha resuelto
  confirmas si está bien y por qué.
- Si pregunta un concepto, explícalo de forma breve y clara y comprueba que lo ha entendido con una pregunta.
- Respuestas cortas: máximo 90 palabras salvo que pida una explicación larga. Un paso cada vez.
- Refuerza el esfuerzo, no la inteligencia. Si se frustra, tranquilízale y divide el problema en pasos más pequeños.
- Si se sale del tema de estudio, reconduce con amabilidad. Si cuenta algo preocupante (acoso, que alguien le hace
  daño, tristeza persistente), responde con cariño y anímale a hablarlo con su familia o su tutor del colegio.
- Usa el material de su libro cuando sea útil y cítalo de forma natural ("en tu libro pone…").
{'- Está haciendo los DEBERES. Si envía una foto, primero di qué ejercicio ves y pregunta por dónde quiere empezar.' if deberes else ''}
Formato: texto plano, puedes usar **negrita** y listas breves con guiones.

MATERIAL DE SU LIBRO (fragmentos relevantes):
\"\"\"{context[:7000]}\"\"\""""
    msgs = [{"role": "system", "content": system}]
    for h in history[-14:-1]:
        msgs.append({"role": h["role"], "content": h["content"]})
    last = history[-1]["content"] if history else ""
    if image:
        b64 = base64.b64encode(image[0]).decode()
        msgs.append({"role": "user", "content": [
            {"type": "text", "text": last or "Ayúdame con este ejercicio."},
            {"type": "image_url", "image_url": {"url": f"data:{image[1]};base64,{b64}"}},
        ]})
    else:
        msgs.append({"role": "user", "content": last})
    return chat(msgs, family_id=family_id, json_mode=False, vision=bool(image), max_tokens=700,
                temperature=0.6).strip()


# ---------------------------------------------------------------------------
# 7. Informe para el profesor
# ---------------------------------------------------------------------------

def report_narrative(stats: dict, *, family_id: int | None) -> dict:
    system = ("Eres un orientador educativo que redacta informes breves, objetivos y profesionales para el "
              "profesorado de un alumno. Español de España. Sin adornos, sin exagerar, basado solo en los datos.")
    user = f"""Redacta el informe de seguimiento para el profesor/a a partir de estos datos de la app de estudio en casa.
Si hay pocos datos, dilo con naturalidad y no saques conclusiones fuertes.
Devuelve JSON: {{"summary": "párrafo de 3-5 frases", "strengths": ["2-3 puntos"], "difficulties": ["2-4 puntos
concretos, citando destrezas"], "recommendations": ["2-3 sugerencias prácticas para el aula o para casa"]}}

DATOS:
{json.dumps(stats, ensure_ascii=False, default=str)[:12000]}"""
    data = ask_json(system, user, family_id=family_id, max_tokens=1200, temperature=0.3)
    return {
        "summary": _clip(str(data.get("summary", "")), 1200),
        "strengths": [_clip(str(x), 250) for x in data.get("strengths", [])][:4],
        "difficulties": [_clip(str(x), 250) for x in data.get("difficulties", [])][:5],
        "recommendations": [_clip(str(x), 250) for x in data.get("recommendations", [])][:4],
    }
