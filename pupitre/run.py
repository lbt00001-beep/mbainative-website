"""Arranque local de Pupitre (lo llama EJECUTAR.bat).

1. Cierra lo que dejaron abierto las ejecuciones anteriores de Pupitre: el servidor (PID),
   su ventana de terminal y el puerto que ocupaba. Solo toca procesos que Pupitre registró
   o que se identifican como Pupitre; nunca procesos de otras aplicaciones.
2. Usa un puerto poco habitual (48620 por defecto, o PORT en .env). Si lo ocupa otra
   aplicación, pasa al siguiente libre.
3. Avisa si falta la clave de OpenRouter y abre el navegador.
"""
from __future__ import annotations

import json
import os
import re
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))

from app import config  # noqa: E402  (lee .env)

STATE_FILE = ROOT / "data" / "ejecucion.json"
WINDOWS = os.name == "nt"
OWN_IMAGES = {"python.exe", "pythonw.exe", "cmd.exe", "conhost.exe", "windowsterminal.exe", "openconsole.exe"}


# ---------------------------------------------------------------------------
# Procesos
# ---------------------------------------------------------------------------

def _run(cmd: list[str]) -> str:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=15,
                              creationflags=0x08000000 if WINDOWS else 0).stdout  # sin ventana extra
    except Exception:  # noqa: BLE001
        return ""


def process_table() -> dict[int, tuple[int, str]]:
    """{pid: (pid_padre, ejecutable)} de todos los procesos."""
    table: dict[int, tuple[int, str]] = {}
    if WINDOWS:
        import ctypes
        from ctypes import wintypes

        class PROCESSENTRY32W(ctypes.Structure):
            _fields_ = [("dwSize", wintypes.DWORD), ("cntUsage", wintypes.DWORD), ("th32ProcessID", wintypes.DWORD),
                        ("th32DefaultHeapID", ctypes.c_size_t), ("th32ModuleID", wintypes.DWORD),
                        ("cntThreads", wintypes.DWORD), ("th32ParentProcessID", wintypes.DWORD),
                        ("pcPriClassBase", ctypes.c_long), ("dwFlags", wintypes.DWORD),
                        ("szExeFile", ctypes.c_wchar * 260)]
        k32 = ctypes.windll.kernel32
        snap = k32.CreateToolhelp32Snapshot(0x2, 0)
        entry = PROCESSENTRY32W()
        entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
        ok = k32.Process32FirstW(snap, ctypes.byref(entry))
        while ok:
            table[entry.th32ProcessID] = (entry.th32ParentProcessID, entry.szExeFile.lower())
            ok = k32.Process32NextW(snap, ctypes.byref(entry))
        k32.CloseHandle(snap)
        return table
    for d in Path("/proc").iterdir():
        if d.name.isdigit():
            try:
                stat = (d / "stat").read_text()
                name = stat[stat.index("(") + 1:stat.rindex(")")]
                ppid = int(stat[stat.rindex(")") + 2:].split()[1])
                table[int(d.name)] = (ppid, name.lower())
            except (OSError, ValueError):
                pass
    return table


def started_at(pid: int) -> int:
    """Instante de creación del proceso (para no confundirlo con otro que herede el mismo PID)."""
    if WINDOWS:
        import ctypes
        from ctypes import wintypes
        k32 = ctypes.windll.kernel32
        h = k32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
        if not h:
            return 0
        c, e, kt, ut = (wintypes.FILETIME() for _ in range(4))
        ok = k32.GetProcessTimes(h, ctypes.byref(c), ctypes.byref(e), ctypes.byref(kt), ctypes.byref(ut))
        k32.CloseHandle(h)
        return (c.dwHighDateTime << 32 | c.dwLowDateTime) if ok else 0
    try:
        return int((Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split())[19])
    except (OSError, ValueError, IndexError):
        return 0


def my_terminal() -> int:
    """PID de la terminal (cmd.exe) que ejecuta EJECUTAR.bat en esta ejecución."""
    table = process_table()
    pid = os.getpid()
    for _ in range(8):
        ppid, _name = table.get(pid, (0, ""))
        if not ppid or ppid not in table:
            break
        if table[ppid][1] in ("cmd.exe", "bash", "sh", "zsh"):
            return ppid
        pid = ppid
    return os.getppid()


def image_name(pid: int) -> str | None:
    """Nombre del ejecutable de un PID vivo, o None si ya no existe."""
    if pid <= 0:
        return None
    if WINDOWS:
        out = _run(["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"]).strip()
        m = re.match(r'"([^"]+)","(\d+)"', out)
        return m.group(1).lower() if m and int(m.group(2)) == pid else None
    try:
        os.kill(pid, 0)
    except OSError:
        return None
    try:
        return Path(f"/proc/{pid}/exe").resolve().name.lower()
    except OSError:
        return "?"


def kill_tree(pid: int, why: str, expected_start: int = 0) -> bool:
    name = image_name(pid)
    if not name:
        return False
    if expected_start and started_at(pid) and started_at(pid) != expected_start:
        print(f"  (El PID {pid} ya pertenece a otro proceso: no lo toco.)")
        return False
    if WINDOWS and name not in OWN_IMAGES:
        print(f"  (El PID {pid} ahora es «{name}», no es de Pupitre: no lo toco.)")
        return False
    print(f"  Cerrando {why} (PID {pid}, {name}).")
    if WINDOWS:
        _run(["taskkill", "/PID", str(pid), "/T", "/F"])
    else:
        try:
            os.kill(pid, 9)
        except OSError:
            pass
    for _ in range(20):
        if not image_name(pid):
            return True
        time.sleep(0.1)
    return True


def listening_pid(port: int) -> int | None:
    """PID que escucha en 127.0.0.1:port (solo Windows; en otros sistemas no se usa)."""
    if not WINDOWS:
        return None
    for line in _run(["netstat", "-ano", "-p", "TCP"]).splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[3].upper() in ("LISTENING", "ESCUCHANDO") and parts[1].endswith(f":{port}"):
            return int(parts[4])
    return None


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) != 0


def is_pupitre(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1.5) as r:
            return json.loads(r.read().decode()).get("app") == config.APP_NAME
    except Exception:  # noqa: BLE001
        return False


# ---------------------------------------------------------------------------
# 1. Limpieza de ejecuciones anteriores
# ---------------------------------------------------------------------------

def close_previous_runs() -> None:
    my_console = my_terminal()  # la ventana de EJECUTAR.bat de esta ejecución
    closed = False
    if STATE_FILE.exists():
        try:
            prev = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            prev = {}
        server_pid, console_pid, port = int(prev.get("server_pid", 0)), int(prev.get("console_pid", 0)), int(prev.get("port", 0))
        if server_pid and server_pid != os.getpid():
            closed |= kill_tree(server_pid, "el servidor de la ejecución anterior", int(prev.get("server_start", 0)))
        if console_pid and console_pid not in (my_console, os.getpid()):
            closed |= kill_tree(console_pid, "la terminal de la ejecución anterior", int(prev.get("console_start", 0)))
        if port and not port_free(port):
            pid = listening_pid(port)
            if pid and pid != os.getpid():
                closed |= kill_tree(pid, f"el proceso que seguía ocupando el puerto {port}")
        STATE_FILE.unlink(missing_ok=True)
    # Copias de Pupitre arrancadas sin registro (p. ej. a mano): se reconocen por /api/health.
    for port in range(config.PORT, config.PORT + 25):
        if not port_free(port) and is_pupitre(port):
            pid = listening_pid(port)
            if pid and pid != os.getpid():
                closed |= kill_tree(pid, f"otra copia de Pupitre en el puerto {port}")
    if closed:
        time.sleep(0.5)
        print("  Ejecuciones anteriores cerradas.\n")


def save_state(port: int) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    console = my_terminal()
    STATE_FILE.write_text(json.dumps({
        "server_pid": os.getpid(), "server_start": started_at(os.getpid()),
        "console_pid": console, "console_start": started_at(console),
        "port": port, "started": time.strftime("%Y-%m-%d %H:%M:%S")}), encoding="utf-8")


# ---------------------------------------------------------------------------
# 2-3. Puerto, aviso de clave y arranque
# ---------------------------------------------------------------------------

def choose_port() -> int:
    for port in range(config.PORT, config.PORT + 25):
        if port_free(port):
            return port
        print(f"  El puerto {port} lo usa otra aplicación; pruebo el siguiente.")
    print("  No he encontrado ningún puerto libre. Cambia PORT en el archivo .env.")
    sys.exit(1)


def main() -> None:
    close_previous_runs()
    port = choose_port()
    save_state(port)
    url = f"http://127.0.0.1:{port}"
    print("  ==============================================")
    print(f"   Pupitre  ->  {url}")
    print("   Para pararlo, cierra esta ventana (o Ctrl+C).")
    print("  ==============================================\n")
    if not config.AI_READY:
        print("  Aviso: no hay clave de OpenRouter en .env. Cada familia debe poner la suya en")
        print("  Ajustes › Clave de OpenRouter; mientras no la tenga, la app se lo indicará.\n")

    def open_browser_when_ready():
        for _ in range(60):
            time.sleep(0.25)
            if not port_free(port):
                webbrowser.open(url)
                return

    threading.Thread(target=open_browser_when_ready, daemon=True).start()
    import uvicorn
    # El registro se conserva al salir: si la ventana queda abierta (en pausa), la próxima ejecución la cierra.
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
