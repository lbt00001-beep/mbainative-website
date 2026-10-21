@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem --- 1. Cerrar terminales de ejecuciones anteriores de Pupitre (por su titulo).
rem     Esta ventana aun no tiene ese titulo, asi que no se cierra a si misma.
taskkill /FI "WINDOWTITLE eq Pupitre (servidor)*" /T /F >nul 2>nul
title Pupitre (servidor)

where python >nul 2>nul
if errorlevel 1 (
  echo No encuentro Python. Instala Python 3.11 o superior desde https://www.python.org
  echo y marca la casilla "Add python.exe to PATH".
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Primera vez: creando el entorno de Python. Tarda 1-2 minutos...
  python -m venv .venv || (pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
)

rem --- Instalar o actualizar dependencias solo si requirements.txt ha cambiado
fc /b "requirements.txt" ".venv\requirements.instalados.txt" >nul 2>nul
if errorlevel 1 (
  echo Instalando o actualizando dependencias...
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt || (pause & exit /b 1)
  copy /y "requirements.txt" ".venv\requirements.instalados.txt" >nul
)

if not exist ".env" (
  copy "plantilla-env.txt" ".env" >nul
  echo.
  echo  Se ha creado el archivo .env. Si quieres una clave de OpenRouter para todo el PC,
  echo  pegala detras de OPENROUTER_API_KEY= y guarda. Tambien puedes dejarla vacia y poner
  echo  la clave de cada familia dentro de la app: Ajustes ^> Clave de OpenRouter.
  echo.
  notepad ".env"
)

rem --- 2. run.py cierra el servidor, la terminal y el puerto de la ejecucion anterior
rem     (registrados en data\ejecucion.json) y arranca Pupitre.
".venv\Scripts\python.exe" run.py
pause
