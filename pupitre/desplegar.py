"""Publica Pupitre en Google Cloud Run (lo llama DESPLEGAR.bat).

Lee produccion.txt, comprueba que está todo, genera los secretos que falten, despliega,
fija la dirección pública (APP_URL) y programa el informe semanal al profesor.
Solo usa la biblioteca estándar de Python y el comando gcloud ya configurado en el PC.
"""
from __future__ import annotations

import json
import os
import secrets
import shutil
import subprocess
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONF = ROOT / "produccion.txt"
TEMPLATE = ROOT / "plantilla-produccion.txt"
WINDOWS = os.name == "nt"


def fail(msg: str) -> None:
    print("\n  ✗ " + msg + "\n")
    sys.exit(1)


def read_conf() -> dict[str, str]:
    data = {}
    for line in CONF.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            data[k.strip()] = v.strip().strip('"').strip("'")
    return data


def write_value(key: str, value: str) -> None:
    lines = CONF.read_text(encoding="utf-8-sig").splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith(key + "="):
            lines[i] = f"{key}={value}"
            break
    else:
        lines.append(f"{key}={value}")
    CONF.write_text("\n".join(lines) + "\n", encoding="utf-8")


def gcloud(args: list[str], capture: bool = False) -> subprocess.CompletedProcess:
    exe = shutil.which("gcloud") or shutil.which("gcloud.cmd")
    if not exe:
        fail("No encuentro el comando gcloud. Instala Google Cloud SDK y ejecuta «gcloud auth login».")
    cmd = [exe, *args]
    if WINDOWS:  # gcloud es un .cmd en Windows
        return subprocess.run(subprocess.list2cmdline(cmd), shell=True, text=True,
                              capture_output=capture)
    return subprocess.run(cmd, text=True, capture_output=capture)


def main() -> None:
    print("\n  ==============================================")
    print("   Publicar Pupitre en Google Cloud Run")
    print("  ==============================================\n")
    if not CONF.exists():
        shutil.copy(TEMPLATE, CONF)
        print("  He creado «produccion.txt». Rellénalo (sobre todo DATABASE_URL y SIGNUP_CODE),")
        print("  guárdalo y vuelve a ejecutar DESPLEGAR.bat.\n")
        if WINDOWS:
            os.startfile(CONF)  # noqa: S606 - abre el Bloc de notas
        sys.exit(0)

    c = read_conf()
    # Secretos estables: se generan una vez y se guardan (si cambiaran, se cerrarían las sesiones
    # y las claves de OpenRouter guardadas por las familias dejarían de poder leerse).
    for key in ("SECRET_KEY", "CRON_TOKEN"):
        if not c.get(key):
            c[key] = secrets.token_urlsafe(40)
            write_value(key, c[key])
            print(f"  Generado {key} y guardado en produccion.txt.")

    db = c.get("DATABASE_URL", "")
    if not db.startswith(("postgresql://", "postgres://")):
        fail("Falta DATABASE_URL (PostgreSQL) en produccion.txt. Sin base de datos los datos se borrarían "
             "en cada reinicio de Cloud Run. Créala gratis en https://neon.tech.")
    if not c.get("SIGNUP_CODE"):
        fail("Falta SIGNUP_CODE en produccion.txt: sin código de invitación cualquiera podría registrarse.")

    project = c.get("GCP_PROJECT") or gcloud(["config", "get-value", "project"], capture=True).stdout.strip()
    if not project or project == "(unset)":
        fail("No sé en qué proyecto de Google Cloud publicar. Pon GCP_PROJECT en produccion.txt.")
    region, service = c.get("REGION") or "europe-west1", c.get("SERVICE") or "pupitre"
    print(f"  Proyecto: {project} · Región: {region} · Servicio: {service}\n")

    env_keys = ["DATABASE_URL", "SECRET_KEY", "CRON_TOKEN", "SIGNUP_CODE", "PRIVACY_CONTACT", "DAILY_AI_LIMIT",
                "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"]
    env = {k: c[k] for k in env_keys if c.get(k)}
    env_file = ROOT / "data" / "despliegue-env.yaml"
    env_file.parent.mkdir(exist_ok=True)
    # json.dumps produce cadenas entre comillas válidas en YAML con cualquier carácter
    env_file.write_text("".join(f"{k}: {json.dumps(v, ensure_ascii=False)}\n" for k, v in env.items()),
                        encoding="utf-8")
    try:
        print("  Subiendo y construyendo la app en Google Cloud (tarda 3-6 minutos)...\n")
        r = gcloud(["run", "deploy", service, "--source", str(ROOT), "--region", region, "--project", project,
                    "--allow-unauthenticated", "--memory", "1Gi", "--cpu", "1", "--no-cpu-throttling",
                    "--timeout", "900", "--min-instances", "0", "--max-instances", "2",
                    "--env-vars-file", str(env_file), "--quiet"])
    finally:
        env_file.unlink(missing_ok=True)  # contiene contraseñas: no se deja en el disco
    if r.returncode != 0:
        fail("El despliegue ha fallado (mira el mensaje de gcloud de arriba). Si es la primera vez, puede que "
             "falte ejecutar «gcloud auth login» o activar las APIs que gcloud propone.")

    url = gcloud(["run", "services", "describe", service, "--region", region, "--project", project,
                  "--format", "value(status.url)"], capture=True).stdout.strip()
    if not url:
        fail("Desplegado, pero no he podido leer la dirección pública del servicio.")
    gcloud(["run", "services", "update", service, "--region", region, "--project", project,
            "--update-env-vars", f"APP_URL={url}", "--quiet"])

    # Informe semanal al profesor: viernes a las 18:00 (hora de Madrid)
    job = f"{service}-informes"
    args = ["--location", region, "--project", project, "--schedule", "0 18 * * 5",
            "--time-zone", "Europe/Madrid", "--uri", f"{url}/api/cron/weekly-reports",
            "--http-method", "POST", "--headers", f"X-Cron-Token={c['CRON_TOKEN']}", "--quiet"]
    exists = gcloud(["scheduler", "jobs", "describe", job, "--location", region, "--project", project],
                    capture=True).returncode == 0
    s = gcloud(["scheduler", "jobs", "update" if exists else "create", "http", job, *args], capture=True)
    sched = "programado (viernes, 18:00)" if s.returncode == 0 else \
        "NO programado: activa Cloud Scheduler en el proyecto y vuelve a ejecutar DESPLEGAR.bat"

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "url-publicada.txt").write_text(url + "\n", encoding="utf-8")
    print("\n  ==============================================")
    print("   ✓ Pupitre publicado")
    print(f"   {url}")
    print(f"   Informe semanal: {sched}")
    print(f"   Código de invitación para tus amigos: {c['SIGNUP_CODE']}")
    print("  ==============================================\n")
    webbrowser.open(url)


if __name__ == "__main__":
    main()
