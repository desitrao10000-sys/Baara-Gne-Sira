# 📘 Référence Officielle Design Mobile - Baara Gnè - Sira

Ce document consigne les spécifications validées pour l'interface mobile du SAAS. Toute modification ultérieure doit faire référence à ce document et à la maquette associée.

---

## 🏗️ Maquette de Référence
- **Fichier Source :** `mobile_prototype.html`
- **Version :** 1.0 (Validée le 12 Mai 2026)
- **Concept :** Mobile-First, Android-Native, Hybrid Premium.

---

## 🎨 Design System (Couleurs & Styles)
### 1. Palettes de Couleurs
- **Header & Dock :** Bleu Marine Profond (`#1e3a8a`) avec texture de rayures diagonales (`rgba(255,255,255,0.05)`).
- **Fond de Page (Milieu) :** Bleu Pastel / Lavande (`#eef2ff`).
- **Composantes (Icônes) :**
  - **Bleu Vibrant :** `#3b82f6`
  - **Jaune Clair :** `#fef08a`
  - **Vert Clair :** `#bbf7d0`
- **Accents :** Jaune Or (`#fbbf24`) pour les icônes de navigation et les bordures utilisateur.

### 2. Typographie & Visibilité
- **Titres des Composants :** Taille **13px**, Style **Extra-Gras (800)**, Couleur `#334155`.
- **Nom de l'App :** "Baara Gnè - Sira" affiché en Header.

---

## 🧩 Composantes de la Grille (15 Modules)
La grille est organisée pour éviter toute adjacence de couleur identique :

1.  **Projet** (Bleu)
2.  **Calendrier** (Vert)
3.  **Risques** (Jaune)
4.  **Portefeuille** (Vert)
5.  **Ressources** (Jaune)
6.  **Bilan Projet** (Bleu)
7.  **Rapports** (Jaune)
8.  **IA Prédictive** (Bleu)
9.  **Coffre-fort** (Bleu)
10. **Radar Santé** (Vert)
11. **IA Import** (Jaune)
12. **Partenaires** (Vert)
13. **Messages** (Bleu)
14. **Paramètres** (Vert)
15. **Équipe** (Jaune)

---

## ⚓ Navigation (Dock)
Le dock fixe en bas contient 4 accès rapides prioritaires :
1.  **Todo-Projet** (Icône list-checks)
2.  **Accueil** (Icône home)
3.  **Todo-Perso** (Icône user-check)
4.  **Gantt** (Icône calendar-range)

---

## 🛠️ Instructions pour le Développement
- Le passage du prototype à l'application réelle (Next.js) doit respecter scrupuleusement ces couleurs et espacements.
- L'effet de **brillance (shine)** sur les icônes doit être implémenté via CSS pour conserver l'aspect Premium.
- La navigation entre les pages de la grille doit être un **swipe horizontal** fluide.
