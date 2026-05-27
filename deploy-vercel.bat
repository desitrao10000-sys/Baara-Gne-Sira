@echo off
title Deploy Baara Gne Sira sur Vercel
cd /d "C:\Users\MR TRAORE\Desktop\Antigravity\baara-gne-sira"

echo ============================================
echo   DEPLOYEMENT BAARA GNE SIRA SUR VERCEL
echo ============================================
echo.

echo Etape 1 : Connexion a Vercel...
echo Une fenetre navigateur va s'ouvrir.
echo Connecte-toi avec GitHub !
echo.
vercel login

echo.
echo Etape 2 : Configuration des variables...
vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo https://pariusdrlzmznimsaidw.supabase.co

echo.
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo sb_publishable_dLsc0F21UY-B1Q9F12wNLg_u_phncan

echo.
echo Etape 3 : Deploiement...
vercel --prod

echo.
echo ============================================
echo   DEPLOIEMENT TERMINE !
echo   Ouvre l'URL Vercel sur ton telephone !
echo ============================================
echo.
pause