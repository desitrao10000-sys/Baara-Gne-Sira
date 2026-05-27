@echo off
title Baara Gne Sira - Serveur Robuste
echo ============================================
echo   Baara Gne Sira - Serveur Auto-Restart
echo ============================================
echo.
echo Le serveur va se lancer sur http://localhost:3000
echo Si le serveur plante, il redemarre automatiquement.
echo.
echo Pour arreter : ferme cette fenetre ou appuie sur Ctrl+C
echo ============================================
echo.

:RESTART
echo [%date% %time%] Demarrage du serveur...
cd /d "C:\Users\MR TRAORE\Desktop\Antigravity\baara-gne-sira"

REM Tuer l'ancien serveur s'il existe
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Baara*" 2>nul

REM Attendre 2 secondes
timeout /t 2 /nobreak >nul

REM Lancer le serveur
npx next dev -H 0.0.0.0 -p 3000

echo.
echo [%date% %time%] Le serveur s'est arrete. Redemarrage dans 3 secondes...
timeout /t 3 /nobreak >nul
goto RESTART