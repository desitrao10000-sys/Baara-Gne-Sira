@echo off
title Baara Gne Sira - Serveur Local
echo ============================================
echo   Baara Gne Sira - Serveur Local
echo   Le serveur reste actif en permanence
echo   URL: http://localhost:3000
echo ============================================
echo.
echo Demarrage du serveur...
echo.

cd /d "C:\Users\MR TRAORE\Desktop\Antigravity\baara-gne-sira"

:RESTART
echo [%date% %time%] Demarrage du serveur...
npx next dev -H 0.0.0.0 -p 3000
echo [%date% %time%] Le serveur s'est arrete. Redemarrage dans 3 secondes...
timeout /t 3 /nobreak >nul
goto RESTART