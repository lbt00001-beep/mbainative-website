"""Configuración central de Pupitre. Todo se lee de variables de entorno."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Lee el archivo .env (clave=valor) sin dependencias. Las variables ya definidas mandan."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.split(" #", 1)[0].strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)


_load_dotenv(BASE_DIR / ".env")


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _env_int(name: str, default: int) -> int:
    try:
        return int(_env(name, str(default)))
    except ValueError:
        return default


# --- Aplicación ---
APP_NAME = _env("APP_NAME", "Pupitre")
APP_CREDIT_MODEL = "Claude Opus 5.5"  # modelo con el que se creó la app (línea de créditos)
PORT = _env_int("PORT", 48620)  # puerto local poco habitual; se puede cambiar en .env
APP_URL = _env("APP_URL", f"http://127.0.0.1:{PORT}")  # URL pública, se usa en los emails
SECRET_KEY = _env("SECRET_KEY", "cambia-esta-clave-en-produccion")
PRIVACY_CONTACT = _env("PRIVACY_CONTACT")  # email de contacto que aparece en el aviso de privacidad
SIGNUP_CODE = _env("SIGNUP_CODE")  # si se define, hace falta para crear cuenta
DATABASE_URL = _env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'pupitre.db'}")

# --- IA (OpenRouter) ---
OPENROUTER_API_KEY = _env("OPENROUTER_API_KEY")
OPENROUTER_URL = _env("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
# Modelo principal: barato, multilingüe, con visión y salida JSON fiable.
MODEL_MAIN = _env("MODEL_MAIN", "google/gemini-3.1-flash-lite")
# Respaldo automático si el principal falla o no está disponible.
MODEL_FALLBACK = _env("MODEL_FALLBACK", "deepseek/deepseek-v4.1-flash")
# Modelo para leer fotos y páginas escaneadas (OCR) y ejercicios fotografiados.
MODEL_VISION = _env("MODEL_VISION", "google/gemini-3.1-flash-lite")
# Clave del servidor (opcional). Cada familia puede poner la suya en Ajustes; si una familia no tiene
# clave y el servidor tampoco, la app lo avisa en pantalla. No hay ningún modo simulado.
AI_READY = OPENROUTER_API_KEY.startswith("sk-")
AI_TIMEOUT = _env_int("AI_TIMEOUT", 120)
DAILY_AI_LIMIT = _env_int("DAILY_AI_LIMIT", 400)  # llamadas IA por familia y día

# --- Documentos ---
MAX_UPLOAD_MB = _env_int("MAX_UPLOAD_MB", 60)
MAX_OCR_PAGES = _env_int("MAX_OCR_PAGES", 600)
# A partir de cuántas páginas escaneadas se pide confirmación (y elegir páginas) antes de gastar.
OCR_CONFIRM_PAGES = _env_int("OCR_CONFIRM_PAGES", 15)
# Coste orientativo por página escaneada leída con IA (en $), medido con el modelo por defecto.
try:
    OCR_COST_PER_PAGE = float(os.environ.get("OCR_COST_PER_PAGE", "0.0015"))
except ValueError:
    OCR_COST_PER_PAGE = 0.0015
UPLOAD_DIR = BASE_DIR / "data" / "subidas"
OCR_WORKERS = _env_int("OCR_WORKERS", 4)

# --- Email (SMTP) ---
SMTP_HOST = _env("SMTP_HOST")
SMTP_PORT = _env_int("SMTP_PORT", 587)
SMTP_USER = _env("SMTP_USER")
SMTP_PASSWORD = _env("SMTP_PASSWORD")
SMTP_FROM = _env("SMTP_FROM", SMTP_USER)
SMTP_SSL = _env("SMTP_SSL", "0") == "1"

# --- Tareas programadas ---
CRON_TOKEN = _env("CRON_TOKEN")  # Cloud Scheduler lo envía en la cabecera X-Cron-Token

COURSES = [
    "Infantil 5 años",
    "1º Primaria", "2º Primaria", "3º Primaria", "4º Primaria", "5º Primaria", "6º Primaria",
    "1º ESO", "2º ESO", "3º ESO", "4º ESO",
    "1º Bachillerato", "2º Bachillerato",
]

DEFAULT_SUBJECTS = [
    ("Matemáticas", "calc", "#2563eb"),
    ("Lengua", "book", "#db2777"),
    ("Conocimiento del medio", "leaf", "#16a34a"),
    ("Historia", "castle", "#b45309"),
]

SUBJECT_COLORS = ["#2563eb", "#db2777", "#16a34a", "#b45309", "#7c3aed", "#0891b2", "#dc2626", "#4d7c0f"]
SUBJECT_ICONS = ["calc", "book", "leaf", "castle", "globe", "flask", "music", "palette", "lang", "star"]
