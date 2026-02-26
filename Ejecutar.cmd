@echo off
echo ==============================
echo Radar de Calidad Periodistica
echo ==============================

echo.
echo [1/3] Instalando backend...
cd /d "%~dp0backend"
call npm install --cache .npm-cache 2>nul
echo.

echo [2/3] Instalando frontend...
cd /d "%~dp0frontend"
call npm install --cache .npm-cache 2>nul
echo.

echo [3/3] Arrancando servidores...
cd /d "%~dp0backend"
start "Backend" cmd /c "node server.js"

cd /d "%~dp0frontend"
start "Frontend" cmd /c "npx http-server -p 5173 -c-1"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Abierto en http://localhost:5173
echo Backend en http://localhost:5174
echo.
pause
