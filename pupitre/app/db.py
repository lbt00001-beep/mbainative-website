"""Modelo de datos (SQLAlchemy). Funciona con SQLite en local y PostgreSQL en producción."""
from datetime import datetime, date
from pathlib import Path

from sqlalchemy import (Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text,
                        create_engine, JSON)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from . import config

_url = config.DATABASE_URL
if _url.startswith("postgres://"):
    _url = "postgresql+psycopg://" + _url[len("postgres://"):]
elif _url.startswith("postgresql://"):
    _url = "postgresql+psycopg://" + _url[len("postgresql://"):]

_kwargs = {"pool_pre_ping": True}
if _url.startswith("sqlite"):
    Path(_url.replace("sqlite:///", "")).parent.mkdir(parents=True, exist_ok=True)
    _kwargs["connect_args"] = {"check_same_thread": False}

SQLITE_PATH = Path(_url.replace("sqlite:///", "")) if _url.startswith("sqlite") else None

engine = create_engine(_url, **_kwargs)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def _after_commit(_session) -> None:
    from . import cloudsync
    cloudsync.mark_dirty()


from sqlalchemy import event  # noqa: E402

event.listen(SessionLocal, "after_commit", _after_commit)


class Base(DeclarativeBase):
    pass


def now() -> datetime:
    return datetime.utcnow()


class Family(Base):
    __tablename__ = "families"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(300))
    parent_pin_hash: Mapped[str] = mapped_column(String(300))
    openrouter_key_enc: Mapped[str] = mapped_column(Text, default="")  # clave de OpenRouter cifrada
    privacy_accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    students: Mapped[list["Student"]] = relationship(back_populates="family", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey("families.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    course: Mapped[str] = mapped_column(String(40))
    avatar: Mapped[str] = mapped_column(String(20), default="fox")
    notes: Mapped[str] = mapped_column(Text, default="")  # necesidades, intereses (lo escribe la familia)
    teacher_name: Mapped[str] = mapped_column(String(120), default="")
    teacher_email: Mapped[str] = mapped_column(String(200), default="")
    reports_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_report_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    family: Mapped[Family] = relationship(back_populates="students")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="student", cascade="all, delete-orphan",
                                                     order_by="Subject.position")


class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(20), default="book")
    color: Mapped[str] = mapped_column(String(10), default="#2563eb")
    position: Mapped[int] = mapped_column(Integer, default=0)
    diagnosed: Mapped[bool] = mapped_column(Boolean, default=False)
    student: Mapped[Student] = relationship(back_populates="subjects")
    documents: Mapped[list["Document"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    topics: Mapped[list["Topic"]] = relationship(back_populates="subject", cascade="all, delete-orphan",
                                                 order_by="Topic.position")


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), index=True)
    filename: Mapped[str] = mapped_column(String(250))
    kind: Mapped[str] = mapped_column(String(20), default="libro")  # libro, apuntes, ejercicios, examen, otro
    status: Mapped[str] = mapped_column(String(20), default="procesando")  # procesando, listo, error
    progress: Mapped[int] = mapped_column(Integer, default=0)
    pages: Mapped[int] = mapped_column(Integer, default=0)
    chars: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    subject: Mapped[Subject] = relationship(back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    idx: Mapped[int] = mapped_column(Integer)
    page: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)
    document: Mapped[Document] = relationship(back_populates="chunks")


class Topic(Base):
    __tablename__ = "topics"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    focus: Mapped[bool] = mapped_column(Boolean, default=False)  # lo están dando ahora en clase
    mastery: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100
    evaluated: Mapped[bool] = mapped_column(Boolean, default=False)
    answered: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    subject: Mapped[Subject] = relationship(back_populates="topics")


class Activity(Base):
    """Cada sesión de trabajo del alumno: prueba de nivel, test, lección, tarjetas, juego, tutor."""
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    topic_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    type: Mapped[str] = mapped_column(String(20))  # diagnostico, test, leccion, tarjetas, contrarreloj, parejas, tutor, deberes
    status: Mapped[str] = mapped_column(String(20), default="abierta")  # abierta, terminada
    score: Mapped[float] = mapped_column(Float, default=0)
    max_score: Mapped[float] = mapped_column(Float, default=0)
    duration_s: Mapped[int] = mapped_column(Integer, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)  # preguntas con soluciones, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Answer(Base):
    """Respuesta individual: base del seguimiento fino y de la detección de dificultades."""
    __tablename__ = "answers"
    id: Mapped[int] = mapped_column(primary_key=True)
    activity_id: Mapped[int] = mapped_column(Integer, index=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    topic_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    question: Mapped[str] = mapped_column(Text)
    given: Mapped[str] = mapped_column(Text, default="")
    expected: Mapped[str] = mapped_column(Text, default="")
    correct: Mapped[float] = mapped_column(Float, default=0)  # 0, 0.5, 1
    difficulty: Mapped[int] = mapped_column(Integer, default=2)
    skill: Mapped[str] = mapped_column(String(120), default="")
    feedback: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)


class Flashcard(Base):
    __tablename__ = "flashcards"
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    topic_id: Mapped[int] = mapped_column(Integer, index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    box: Mapped[int] = mapped_column(Integer, default=1)  # sistema Leitner 1-5
    due: Mapped[date] = mapped_column(Date, default=date.today)
    reviews: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    role: Mapped[str] = mapped_column(String(12))
    content: Mapped[str] = mapped_column(Text)
    has_image: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ReportLog(Base):
    __tablename__ = "report_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)
    sent_to: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20))  # enviado, error, sin_smtp
    detail: Mapped[str] = mapped_column(Text, default="")
    html: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class MasteryLog(Base):
    """Histórico del dominio por tema: permite ver la evolución en los informes."""
    __tablename__ = "mastery_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(Integer, index=True)
    subject_id: Mapped[int] = mapped_column(Integer, index=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)
    mastery: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)


class AiUsage(Base):
    __tablename__ = "ai_usage"
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(Integer, index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    calls: Mapped[int] = mapped_column(Integer, default=0)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)


def init_db() -> None:
    Base.metadata.create_all(engine)
    _add_missing_columns()


def _add_missing_columns() -> None:
    """Añade columnas nuevas a tablas ya existentes (bases de datos de versiones anteriores)."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not insp.has_table(table.name):
                continue
            have = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in have:
                    continue
                ddl = col.type.compile(dialect=engine.dialect)
                default = ""
                if col.default is not None and getattr(col.default, "is_scalar", False):
                    v = col.default.arg
                    default = f" DEFAULT {('TRUE' if v else 'FALSE') if isinstance(v, bool) else repr(v) if isinstance(v, str) else v}"
                conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {col.name} {ddl}{default}'))
