@echo off
chcp 65001 >nul
title Publicar Pupitre en Cloud Run
cd /d "%~dp0"

set "PY=python"
if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"

"%PY%" desplegar.py
pause
