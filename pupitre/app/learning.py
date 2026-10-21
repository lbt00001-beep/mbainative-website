"""Motor pedagógico: dominio por tema, ruta del día, repaso espaciado, logros y estadísticas."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from .db import Activity, Answer, Flashcard, MasteryLog, Student, Subject, Topic

WEIGHT = {1: 1.0, 2: 1.5, 3: 2.0}
LEITNER_DAYS = {1: 0, 2: 1, 3: 3, 4: 7, 5: 16}


def status_of(t: Topic) -> str:
    if not t.evaluated:
        return "sin_evaluar"
    if t.mastery >= 75:
        return "dominado"
    if t.mastery >= 40:
        return "en_progreso"
    return "reforzar"


STATUS_LABEL = {"sin_evaluar": "Sin evaluar", "dominado": "Dominado", "en_progreso": "En progreso",
                "reforzar": "Por reforzar"}


def target_difficulty(mastery: float) -> int:
    return 1 if mastery < 40 else 2 if mastery < 75 else 3


def weighted_score(items: list[tuple[float, int]]) -> float:
    """items: [(correcto 0..1, dificultad)] -> 0..100, premiando acertar lo difícil."""
    if not items:
        return 0.0
    num = sum(c * WEIGHT.get(d, 1.5) for c, d in items)
    den = sum(WEIGHT.get(d, 1.5) for _, d in items)
    return 100.0 * num / den


def update_mastery(db: Session, topic: Topic, session_score: float, weight: float, student_id: int,
                   n_answered: int = 0, n_correct: float = 0) -> None:
    if not topic.evaluated:
        topic.mastery = session_score
        topic.evaluated = True
    else:
        topic.mastery = round(topic.mastery * (1 - weight) + session_score * weight, 1)
    topic.mastery = max(0.0, min(100.0, topic.mastery))
    topic.answered += n_answered
    topic.correct += int(round(n_correct))
    topic.updated_at = datetime.utcnow()
    db.add(MasteryLog(topic_id=topic.id, subject_id=topic.subject_id, student_id=student_id,
                      mastery=topic.mastery))


def award(db: Session, student: Student, ratio: float, base: int = 5) -> int:
    """Suma puntos de experiencia y actualiza la racha de días."""
    gained = base + int(round(max(0.0, min(1.0, ratio)) * 20))
    student.xp += gained
    today = date.today()
    if student.last_active != today:
        student.streak = student.streak + 1 if student.last_active == today - timedelta(days=1) else 1
        student.last_active = today
    return gained


def level_of(xp: int) -> dict:
    lvl, need, acc = 1, 100, 0
    while xp >= acc + need:
        acc += need
        lvl += 1
        need = int(need * 1.25)
    return {"level": lvl, "progress": xp - acc, "needed": need}


# ---------------------------------------------------------------------------
# Repaso espaciado (Leitner)
# ---------------------------------------------------------------------------

def review_card(card: Flashcard, grade: str) -> None:
    card.reviews += 1
    if grade == "si":
        card.box = min(5, card.box + 1)
    elif grade == "casi":
        card.box = max(1, card.box)
    else:
        card.box = 1
        card.lapses += 1
    card.due = date.today() + timedelta(days=LEITNER_DAYS[card.box] or 0)


def due_cards(db: Session, subject_ids: list[int]) -> int:
    if not subject_ids:
        return 0
    return db.query(Flashcard).filter(Flashcard.subject_id.in_(subject_ids), Flashcard.due <= date.today()).count()


# ---------------------------------------------------------------------------
# Ruta del día
# ---------------------------------------------------------------------------

def daily_mission(db: Session, student: Student) -> list[dict]:
    items: list[dict] = []
    subjects = student.subjects
    sids = [s.id for s in subjects]
    done_today = {(a.subject_id, a.topic_id, a.type) for a in db.query(Activity).filter(
        Activity.student_id == student.id, Activity.status == "terminada",
        Activity.created_at >= datetime.combine(date.today(), datetime.min.time())).all()}

    # 1. Pruebas de nivel pendientes
    for s in subjects:
        if s.topics and not s.diagnosed:
            items.append({"kind": "diagnostico", "subject_id": s.id, "subject": s.name, "color": s.color,
                          "icon": s.icon, "title": f"Prueba de nivel de {s.name}",
                          "why": "Para saber por dónde empezar", "minutes": 10,
                          "done": (s.id, None, "diagnostico") in done_today})
    # 2. Tarjetas pendientes de repaso
    by_subject = defaultdict(int)
    for c in db.query(Flashcard).filter(Flashcard.subject_id.in_(sids or [-1]), Flashcard.due <= date.today()).all():
        by_subject[c.subject_id] += 1
    for s in subjects:
        if by_subject.get(s.id, 0) >= 3:
            items.append({"kind": "repaso", "subject_id": s.id, "subject": s.name, "color": s.color, "icon": s.icon,
                          "title": f"Repasa {by_subject[s.id]} tarjetas de {s.name}",
                          "why": "Tocan hoy para no olvidarlas", "minutes": 5, "done": False})
    # 3. Temas: primero los que están dando en clase, luego los más flojos
    candidates = []
    for s in subjects:
        if not s.diagnosed:
            continue
        for t in s.topics:
            if status_of(t) == "dominado" and not t.focus:
                continue
            candidates.append((not t.focus, t.mastery, s, t))
    candidates.sort(key=lambda x: (x[0], x[1]))
    per_subject: dict[int, int] = defaultdict(int)
    n_subjects = len({c[2].id for c in candidates})
    cap = 1 if n_subjects >= 3 else 2 if n_subjects == 2 else 3
    for _, _, s, t in candidates:
        if len([i for i in items if i["kind"] != "diagnostico"]) >= 4:
            break
        if per_subject[s.id] >= cap:
            continue
        per_subject[s.id] += 1
        if t.mastery < 40:
            kind, title, why, mins = "leccion", f"Aprende: {t.title}", "Empezamos por la base", 8
        elif t.mastery < 75:
            kind, title, why, mins = "test", f"Practica: {t.title}", "Ya vas cogiéndolo: a afianzar", 8
        else:
            kind, title, why, mins = "contrarreloj", f"Reto: {t.title}", "Lo dominas, ¡a por récord!", 3
        if t.focus:
            why = "Lo estáis dando en clase"
        items.append({"kind": kind, "subject_id": s.id, "subject": s.name, "color": s.color, "icon": s.icon,
                      "topic_id": t.id, "topic": t.title, "title": title, "why": why, "minutes": mins,
                      "done": (s.id, t.id, kind) in done_today})
    return items[:5]


# ---------------------------------------------------------------------------
# Logros
# ---------------------------------------------------------------------------

def badges(db: Session, student: Student) -> list[dict]:
    acts = db.query(Activity).filter(Activity.student_id == student.id, Activity.status == "terminada").all()
    types = defaultdict(int)
    for a in acts:
        types[a.type] += 1
    mastered = sum(1 for s in student.subjects for t in s.topics if status_of(t) == "dominado")
    perfect = any(a.max_score and a.score >= a.max_score and a.max_score >= 5 for a in acts)
    defs = [
        ("explorador", "Explorador", "Completa tu primera prueba de nivel", types["diagnostico"] >= 1),
        ("constante", "Constante", "Estudia 3 días seguidos", student.streak >= 3),
        ("imparable", "Imparable", "Estudia 7 días seguidos", student.streak >= 7),
        ("lector", "Buen lector", "Termina 3 lecciones", types["leccion"] >= 3),
        ("memoria", "Memoria de elefante", "Haz 5 repasos de tarjetas", types["tarjetas"] >= 5),
        ("rayo", "Rayo", "Juega 5 contrarrelojes", types["contrarreloj"] >= 5),
        ("perfecto", "Pleno", "Acierta todo en un test", perfect),
        ("maestro", "Maestro", "Domina 3 temas", mastered >= 3),
        ("curioso", "Curioso", "Pregunta al tutor 10 veces", types["tutor"] + types["deberes"] >= 10),
        ("cien", "100 puntos", "Consigue 100 puntos de experiencia", student.xp >= 100),
    ]
    return [{"id": i, "name": n, "desc": d, "earned": bool(e)} for i, n, d, e in defs]


# ---------------------------------------------------------------------------
# Estadísticas (panel de familia e informe del profesor)
# ---------------------------------------------------------------------------

def student_stats(db: Session, student: Student, days: int = 7) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    acts = db.query(Activity).filter(Activity.student_id == student.id, Activity.created_at >= since,
                                     Activity.status == "terminada").all()
    answers = db.query(Answer).filter(Answer.student_id == student.id, Answer.created_at >= since).all()
    minutes = round(sum(a.duration_s for a in acts) / 60)
    active_days = len({a.created_at.date() for a in acts})
    by_type = defaultdict(int)
    for a in acts:
        by_type[a.type] += 1

    subjects = []
    for s in student.subjects:
        topics = []
        for t in s.topics:
            prev = db.query(MasteryLog).filter(MasteryLog.topic_id == t.id, MasteryLog.created_at < since) \
                .order_by(MasteryLog.created_at.desc()).first()
            first_in_period = db.query(MasteryLog).filter(MasteryLog.topic_id == t.id, MasteryLog.created_at >= since) \
                .order_by(MasteryLog.created_at.asc()).first()
            base = prev.mastery if prev else (first_in_period.mastery if first_in_period else None)
            topics.append({"id": t.id, "title": t.title, "mastery": round(t.mastery), "status": status_of(t),
                           "status_label": STATUS_LABEL[status_of(t)], "focus": t.focus,
                           "change": round(t.mastery - base) if (base is not None and t.evaluated) else None})
        ans = [a for a in answers if a.subject_id == s.id]
        evaluated = [t for t in s.topics if t.evaluated]
        subjects.append({
            "id": s.id, "name": s.name, "color": s.color, "icon": s.icon, "diagnosed": s.diagnosed,
            "mastery": round(sum(t.mastery for t in evaluated) / len(evaluated)) if evaluated else None,
            "answered": len(ans), "accuracy": round(100 * sum(a.correct for a in ans) / len(ans)) if ans else None,
            "minutes": round(sum(a.duration_s for a in acts if a.subject_id == s.id) / 60),
            "topics": topics,
        })

    # Dificultades: destrezas con varios fallos en el periodo
    topic_names = {t.id: t.title for s in student.subjects for t in s.topics}
    subj_names = {s.id: s.name for s in student.subjects}
    groups = defaultdict(list)
    for a in answers:
        key = (a.subject_id, a.topic_id, (a.skill or topic_names.get(a.topic_id, "")).strip().lower())
        groups[key].append(a)
    difficulties = []
    for (sid, tid, skill), lst in groups.items():
        acc = sum(a.correct for a in lst) / len(lst)
        if len(lst) >= 2 and acc < 0.6:
            wrong = [a for a in lst if a.correct < 1][:2]
            difficulties.append({
                "subject": subj_names.get(sid, ""), "topic": topic_names.get(tid, ""), "skill": skill,
                "accuracy": round(100 * acc), "attempts": len(lst),
                "examples": [{"question": w.question[:200], "given": w.given[:120], "expected": w.expected[:120]}
                             for w in wrong],
            })
    difficulties.sort(key=lambda d: (d["accuracy"], -d["attempts"]))

    return {
        "student": student.name, "course": student.course, "days": days,
        "from": since.date().isoformat(), "to": date.today().isoformat(),
        "minutes": minutes, "sessions": len(acts), "active_days": active_days,
        "answered": len(answers),
        "accuracy": round(100 * sum(a.correct for a in answers) / len(answers)) if answers else None,
        "by_type": dict(by_type), "subjects": subjects, "difficulties": difficulties[:8],
        "xp": student.xp, "streak": student.streak,
    }


def activity_timeline(db: Session, student_id: int, days: int = 14) -> list[dict]:
    since = date.today() - timedelta(days=days - 1)
    acts = db.query(Activity).filter(Activity.student_id == student_id, Activity.status == "terminada",
                                     Activity.created_at >= datetime.combine(since, datetime.min.time())).all()
    per = defaultdict(int)
    for a in acts:
        per[a.created_at.date()] += a.duration_s
    return [{"day": (since + timedelta(days=i)).isoformat(),
             "minutes": round(per.get(since + timedelta(days=i), 0) / 60)} for i in range(days)]
