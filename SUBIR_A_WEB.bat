@echo off
chcp 65001 > nul
echo ========================================================
echo   PUBLICANDO ACTUALIZACION EN MBAINATIVE.COM
echo   (Se sincroniza con GitHub y se auto-despliega en Hostinger)
echo ========================================================
echo.
git status
echo.
echo Enviando cambios a GitHub master...
git push origin master
echo.
echo ========================================================
echo   ¡Completado! Hostinger actualizara mbainative.com en 1 minuto.
echo ========================================================
pause
