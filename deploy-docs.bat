@echo off
title Deploy Baara Gne Sira - Section Documents IA
pushd "C:\Users\MR TRAORE\Desktop\Antigravity\baara-gne-sira"

echo ============================================
echo   DEPLOYEMENT - Section Documents IA
echo ============================================
echo.
echo Deploy en cours...
echo.

npx vercel --prod

echo.
echo ============================================
echo   DEPLOIEMENT TERMINE !
echo ============================================
echo.
pause