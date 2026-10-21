"""Informe periódico para el profesor o tutor: datos + redacción por IA + email HTML."""
from __future__ import annotations

import html
import logging
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage

from sqlalchemy.orm import Session

from . import ai, config
from .db import ReportLog, Student
from .learning import student_stats

log = logging.getLogger("pupitre.reports")

STATUS_COLORS = {"dominado": "#15803d", "en_progreso": "#b45309", "reforzar": "#b91c1c", "sin_evaluar": "#64748b"}


def build_report(db: Session, student: Student, days: int = 7) -> dict:
    stats = student_stats(db, student, days)
    try:
        narrative = ai.report_narrative(stats, family_id=student.family_id)
    except ai.AiError as e:
        narrative = {"summary": f"No se pudo generar el resumen automático ({e}). Los datos de abajo están completos.",
                     "strengths": [], "difficulties": [], "recommendations": []}
    return {"stats": stats, "narrative": narrative, "html": render_html(student, stats, narrative)}


def _li(items: list[str]) -> str:
    return "".join(f"<li style='margin:0 0 6px'>{html.escape(i)}</li>" for i in items) or \
        "<li style='color:#64748b'>Sin datos suficientes en este periodo.</li>"


def render_html(student: Student, stats: dict, nar: dict) -> str:
    e = html.escape
    family = student.family
    teacher = e(student.teacher_name or "profesor/a")
    acc = f"{stats['accuracy']} %" if stats["accuracy"] is not None else "—"
    kpis = [("Tiempo de estudio", f"{stats['minutes']} min"), ("Días activos", f"{stats['active_days']} de {stats['days']}"),
            ("Preguntas respondidas", str(stats["answered"])), ("Acierto global", acc)]
    kpi_html = "".join(
        f"<td style='padding:12px;background:#f8fafc;border-radius:10px;text-align:center;width:25%'>"
        f"<div style='font-size:20px;font-weight:700;color:#0f172a'>{e(v)}</div>"
        f"<div style='font-size:12px;color:#64748b;margin-top:2px'>{e(k)}</div></td>" for k, v in kpis)

    subj_html = ""
    for s in stats["subjects"]:
        if not s["topics"]:
            continue
        rows = ""
        for t in s["topics"]:
            ch = t["change"]
            arrow = "" if ch in (None, 0) else (f"<span style='color:#15803d'>▲ {ch}</span>" if ch > 0
                                               else f"<span style='color:#b91c1c'>▼ {abs(ch)}</span>")
            focus = " <span style='font-size:11px;color:#6d28d9'>(en clase)</span>" if t["focus"] else ""
            bar = "" if t["status"] == "sin_evaluar" else (
                f"<div style='background:#e2e8f0;border-radius:4px;height:6px;width:120px;display:inline-block;vertical-align:middle'>"
                f"<div style='background:{STATUS_COLORS[t['status']]};height:6px;border-radius:4px;width:{max(3, t['mastery']) * 1.2:.0f}px'></div></div>"
                f" <b>{t['mastery']}</b>")
            rows += (f"<tr><td style='padding:6px 8px;border-bottom:1px solid #f1f5f9'>{e(t['title'])}{focus}</td>"
                     f"<td style='padding:6px 8px;border-bottom:1px solid #f1f5f9;white-space:nowrap'>{bar}</td>"
                     f"<td style='padding:6px 8px;border-bottom:1px solid #f1f5f9;color:{STATUS_COLORS[t['status']]};font-size:12px'>{e(t['status_label'])}</td>"
                     f"<td style='padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:12px'>{arrow}</td></tr>")
        meta = f"{s['minutes']} min · {s['answered']} respuestas" + (f" · {s['accuracy']} % acierto" if s["accuracy"] is not None else "")
        subj_html += (f"<h3 style='margin:22px 0 4px;font-size:15px;color:{s['color']}'>{e(s['name'])}</h3>"
                      f"<div style='font-size:12px;color:#64748b;margin-bottom:6px'>{e(meta)}</div>"
                      f"<table style='width:100%;border-collapse:collapse;font-size:13px'>{rows}</table>")

    diff_html = ""
    for d in stats["difficulties"][:6]:
        ex = d["examples"][0] if d["examples"] else None
        ex_html = (f"<div style='font-size:12px;color:#475569;margin-top:4px'>Ejemplo: «{e(ex['question'])}» — respondió "
                   f"«{e(ex['given'] or 'en blanco')}», correcto «{e(ex['expected'])}»</div>") if ex else ""
        diff_html += (f"<div style='padding:10px 12px;border-left:3px solid #b91c1c;background:#fef2f2;margin:8px 0;border-radius:6px'>"
                      f"<b>{e(d['subject'])} · {e(d['topic'])}</b> — {e(d['skill'])} "
                      f"<span style='color:#b91c1c'>({d['accuracy']} % de acierto en {d['attempts']} intentos)</span>{ex_html}</div>")

    return f"""<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:680px;margin:0 auto;padding:24px 16px">
<div style="background:#fff;border-radius:16px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
<div style="font-size:13px;color:#6d28d9;font-weight:700;letter-spacing:.04em">{e(config.APP_NAME.upper())} · INFORME DE SEGUIMIENTO</div>
<h1 style="margin:6px 0 2px;font-size:22px">{e(student.name)} · {e(student.course)}</h1>
<div style="font-size:13px;color:#64748b">Del {e(stats['from'])} al {e(stats['to'])} · Enviado por {e(family.name)}</div>
<p style="font-size:14px;line-height:1.6;margin:18px 0 6px">Estimado/a {teacher}:</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 16px">{e(nar.get('summary', ''))}</p>
<table style="width:100%;border-spacing:6px;margin:0 -6px">{''.join([f'<tr>{kpi_html}</tr>'])}</table>
<table style="width:100%;margin-top:14px"><tr>
<td style="vertical-align:top;width:50%;padding-right:10px"><h3 style="font-size:14px;margin:8px 0;color:#15803d">Fortalezas</h3><ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0">{_li(nar.get('strengths', []))}</ul></td>
<td style="vertical-align:top;width:50%;padding-left:10px"><h3 style="font-size:14px;margin:8px 0;color:#b91c1c">Dificultades</h3><ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0">{_li(nar.get('difficulties', []))}</ul></td>
</tr></table>
<h3 style="font-size:14px;margin:18px 0 8px">Sugerencias</h3><ul style="padding-left:18px;font-size:13px;line-height:1.5;margin:0">{_li(nar.get('recommendations', []))}</ul>
<h2 style="font-size:16px;margin:26px 0 0;padding-top:18px;border-top:1px solid #e2e8f0">Dominio por tema (0-100)</h2>
{subj_html or "<p style='font-size:13px;color:#64748b'>Aún no hay temas evaluados.</p>"}
{('<h2 style="font-size:16px;margin:26px 0 4px;padding-top:18px;border-top:1px solid #e2e8f0">Errores detectados</h2>' + diff_html) if diff_html else ''}
<p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:26px;padding-top:14px;border-top:1px solid #e2e8f0">
El dominio se calcula a partir de las respuestas del alumno en pruebas, prácticas y juegos, ponderando la dificultad.
Puede responder a este correo para escribir directamente a la familia.</p>
</div></div></body></html>"""


def send_email(to: str, subject: str, html_body: str, reply_to: str = "") -> tuple[bool, str]:
    if not config.SMTP_HOST:
        return False, "SMTP no configurado"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{config.APP_NAME} <{config.SMTP_FROM}>"
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content("Este informe está en formato HTML. Ábrelo con un cliente de correo compatible.")
    msg.add_alternative(html_body, subtype="html")
    try:
        ctx = ssl.create_default_context()
        if config.SMTP_SSL:
            with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, context=ctx, timeout=30) as s:
                if config.SMTP_USER:
                    s.login(config.SMTP_USER, config.SMTP_PASSWORD)
                s.send_message(msg)
        else:
            with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=30) as s:
                s.starttls(context=ctx)
                if config.SMTP_USER:
                    s.login(config.SMTP_USER, config.SMTP_PASSWORD)
                s.send_message(msg)
        return True, "enviado"
    except Exception as e:  # noqa: BLE001
        log.exception("Error enviando email")
        return False, f"{type(e).__name__}: {e}"


def send_report(db: Session, student: Student, days: int = 7) -> ReportLog:
    rep = build_report(db, student, days)
    to = student.teacher_email.strip()
    subject = f"Seguimiento de {student.name} ({student.course}) · semana del {rep['stats']['from']}"
    if not to:
        status, detail = "error", "El alumno no tiene email de profesor"
    else:
        ok, detail = send_email(to, subject, rep["html"], reply_to=student.family.email)
        status = "enviado" if ok else ("sin_smtp" if detail == "SMTP no configurado" else "error")
    entry = ReportLog(student_id=student.id, sent_to=to, status=status, detail=detail, html=rep["html"])
    db.add(entry)
    if status == "enviado":
        student.last_report_at = datetime.utcnow()
    db.commit()
    return entry


def due_students(db: Session) -> list[Student]:
    limit = datetime.utcnow() - timedelta(days=6)
    return [s for s in db.query(Student).filter(Student.reports_enabled.is_(True)).all()
            if s.teacher_email and (s.last_report_at is None or s.last_report_at < limit)]
