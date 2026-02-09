@echo off
setlocal

REM Start BACKEND and FRONTEND with double click.
REM Requires: Node.js + npm installed.

set ROOT=%~dp0

echo Root: %ROOT%

REM Check Node.js + npm
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no encontrado en PATH.
  echo Instala Node.js y vuelve a ejecutar.
  goto :end
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm no encontrado en PATH.
  echo Instala Node.js y vuelve a ejecutar.
  goto :end
)

REM Backend
if exist "%ROOT%backend" (
  start "Backend" /D "%ROOT%backend" cmd /k "npm install --cache .npm-cache && npm run dev"
) else (
  echo Missing folder: backend
)

REM Frontend
if exist "%ROOT%frontend" (
  start "Frontend" /D "%ROOT%frontend" cmd /k "npm install --cache .npm-cache && npm run dev"
) else (
  echo Missing folder: frontend
)

ping -n 4 127.0.0.1 >nul
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
) else (
  start "" "http://localhost:5173"
)

echo.
echo If it does not open, wait a bit and open: http://localhost:5173
echo.
endlocal
:end
