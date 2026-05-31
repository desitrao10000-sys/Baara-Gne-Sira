/**
 * Script de seed : Crée 2 projets complets pour tester le SAAS Baara Gnè Sira
 * 
 * Projet 1 : Djiguifa Agro-Business (Agriculture/Élevage - Sikasso, Mali)
 * Projet 2 : Sahel Tech Solutions (Technologie - Ouagadougou, Burkina Faso)
 * 
 * Usage : node scripts/seed-projects.js
 */

// Lire les variables depuis .env.local
const fs = require("fs");
const path = require("path");

function loadEnv() {
    const envPath = path.join(__dirname, "..", ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const vars = {};
    for (const line of content.split("\n")) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) vars[match[1].trim()] = match[2].trim();
    }
    return vars;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Variables manquantes dans .env.local");
    process.exit(1);
}

async function supabaseInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Prefer": "return=representation",
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.text();
        console.error(`❌ Error inserting into ${table}:`, err);
        return null;
    }
    return res.json();
}

async function supabaseDelete(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "DELETE",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
    });
    return res.ok;
}

// ═══════════════════════════════════════════════════════════════
// PROJET 1 : DJIGUIFA AGRO-BUSINESS
// Secteur : Agriculture / Élevage
// Localisation : Sikasso, Mali
// ═══════════════════════════════════════════════════════════════

const projet1 = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Djiguifa Agro-Business",
    description: "Élevage moderne de volailles (poulets de chair et pondeuses) et culture de maïs sur 5 hectares à Sikasso. Production intégrée avec transformation des résidus de maïs en aliments pour volailles. Vente sur les marchés locaux de Sikasso, Bamako et export vers le Burkina Faso voisin.",
    status: "En cours",
    type: "standard",
    icon: "🌾",
    color: "green",
    sector: "Agriculture",
    target: "Atteindre un CA de 25 000 000 FCFA en année 3, créer 8 emplois permanents et devenir le premier fournisseur de volailles de la région de Sikasso",
    budget: "15 500 000 FCFA",
    team: "Amadou Traoré, Fatoumata Diarra, Moussa Konaté",
    extra_info: {
        // ProjectInfo
        name: "Djiguifa Agro-Business",
        sector: "Agriculture",
        location: "Sikasso, Quartier Bougouni, Mali",
        zone: "Région de Sikasso et marchés de Bamako",
        startDate: "2025-07-01",
        duration: "5 ans",
        description: "Élevage moderne de volailles (poulets de chair et pondeuses) et culture de maïs sur 5 hectares à Sikasso. Production intégrée avec transformation des résidus de maïs en aliments pour volailles. Vente sur les marchés locaux de Sikasso, Bamako et export vers le Burkina Faso voisin. Le projet combine agriculture et élevage pour maximiser les revenus et réduire les coûts d'alimentation des volailles.",
        objectives: "Objectifs sur 5 ans :\n1. Produire 15 000 poulets de chair par cycle (6 cycles/an) soit 90 000 poulets/an\n2. Maintenir 2 000 pondeuses pour une production de 1 800 œufs/jour\n3. Cultiver 5 hectares de maïs avec un rendement de 3 tonnes/hectare\n4. Atteindre un chiffre d'affaires de 25 000 000 FCFA en année 3\n5. Créer 8 emplois permanents et 15 emplois saisonniers\n6. Devenir le premier fournisseur de volailles de Sikasso",

        // Manager
        _manager: {
            nomComplet: "Amadou Traoré",
            contact: "+223 76 34 56 78",
            role: "Promoteur et Directeur Général",
            niveauAcces: "administrateur",
            membres: [
                { id: "m1-p1-1", nom: "Diarra", prenom: "Fatoumata", contact: "+223 77 12 34 56", role: "Responsable Production Élevage" },
                { id: "m1-p1-2", nom: "Konaté", prenom: "Moussa", contact: "+223 78 98 76 54", role: "Responsable Agriculture" },
                { id: "m1-p1-3", nom: "Sissoko", prenom: "Awa", contact: "+223 76 55 44 33", role: "Comptable" },
            ],
            partenaires: [
                { id: "pt1-1", nom: "Coulibaly", prenom: "Ibrahim", contact: "+223 70 11 22 33", role: "Fournisseur d'aliments pour bétail" },
                { id: "pt1-2", nom: "Keita", prenom: "Modibo", contact: "+223 79 88 77 66", role: "Transporteur" },
            ]
        },

        // Tâches
        _tasks: [
            {
                id: "t1-001",
                designation: "Acquisition du terrain et aménagement",
                description: "Acheter ou louer 5 hectares de terrain agricole à Bougouni, Sikasso. Clôturer le périmètre, creuser un forage et installer un système d'irrigation goutte-à-goutte.",
                objectifs: "Avoir un terrain fonctionnel avec accès à l'eau pour le démarrage des activités",
                responsable: "Amadou Traoré",
                dateDebut: "2025-07-01",
                dateFin: "2025-09-30",
                statut: "termine",
                budgetEntreesPrev: [{ id: "b1-1", designation: "Budget terrain", montant: 5000000 }],
                budgetSortiesPrev: [
                    { id: "b1-2", designation: "Terrain 5ha", montant: 2500000 },
                    { id: "b1-3", designation: "Clôture", montant: 800000 },
                    { id: "b1-4", designation: "Forage + irrigation", montant: 1500000 },
                ],
                budgetEntreesReel: [{ id: "b1-5", designation: "Budget terrain", montant: 5000000 }],
                budgetSortiesReel: [
                    { id: "b1-6", designation: "Terrain 5ha", montant: 2300000 },
                    { id: "b1-7", designation: "Clôture", montant: 750000 },
                    { id: "b1-8", designation: "Forage + irrigation", montant: 1400000 },
                ],
                risques: "Risque de retard dans les démarches administratives pour l'acquisition du terrain",
                suggestionResolution: "Engager un géomètre expérimenté et entamer les démarches administratives en parallèle",
                commentaires: "Terrain identifié et négociation en cours avec le propriétaire"
            },
            {
                id: "t1-002",
                designation: "Construction des bâtiments d'élevage",
                description: "Construire 3 poulaillers de 200m² chacun avec ventilation, abreuvoirs automatiques et mangeoires. Construire aussi un magasin de stockage pour les aliments et un local administratif.",
                objectifs: "Disposer de 600m² de poulaillers fonctionnels pour accueillir les premières volailles",
                responsable: "Fatoumata Diarra",
                dateDebut: "2025-08-15",
                dateFin: "2025-11-30",
                statut: "en-cours",
                budgetEntreesPrev: [{ id: "b2-1", designation: "Budget construction", montant: 4500000 }],
                budgetSortiesPrev: [
                    { id: "b2-2", designation: "3 poulaillers", montant: 3000000 },
                    { id: "b2-3", designation: "Magasin stockage", montant: 1000000 },
                    { id: "b2-4", designation: "Bureau administratif", montant: 500000 },
                ],
                budgetEntreesReel: [{ id: "b2-5", designation: "Budget construction", montant: 4500000 }],
                budgetSortiesReel: [
                    { id: "b2-6", designation: "2 poulaillers (terminés)", montant: 2100000 },
                    { id: "b2-7", designation: "Matériaux 3e poulailler", montant: 600000 },
                ],
                risques: "Hausse du prix des matériaux de construction (ciment, fer)",
                suggestionResolution: "Acheter les matériaux en gros dès le début et négocier avec les fournisseurs locaux",
                commentaires: "2 poulaillers terminés, 3e en cours de construction"
            },
            {
                id: "t1-003",
                designation: "Achat des équipements et matériel agricole",
                description: "Acheter les équipements : abreuvoirs, mangeoires, lampes chauffantes, Intrants agricoles (semences maïs, engrais, pesticides), motoculteur, charrette, outils agricoles divers.",
                objectifs: "Équiper complètement l'exploitation pour démarrer la production",
                responsable: "Moussa Konaté",
                dateDebut: "2025-10-01",
                dateFin: "2025-12-15",
                statut: "todo",
                budgetEntreesPrev: [{ id: "b3-1", designation: "Budget équipements", montant: 3000000 }],
                budgetSortiesPrev: [
                    { id: "b3-2", designation: "Motoculteur", montant: 1200000 },
                    { id: "b3-3", designation: "Équipements volailles", montant: 800000 },
                    { id: "b3-4", designation: "Intrants maïs (semences+engrais)", montant: 600000 },
                    { id: "b3-5", designation: "Outils divers", montant: 400000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Disponibilité limitée du motoculteur en saison",
                suggestionResolution: "Commander le motoculteur 2 mois à l'avance chez un fournisseur à Bamako",
                commentaires: ""
            },
            {
                id: "t1-004",
                designation: "Premier cycle d'élevage poulets de chair",
                description: "Lancer le premier élevage de 5 000 poulets de chair. Acheter les poussins d'un jour, assurer la vaccination, l'alimentation et le suivi vétérinaire pendant 45 jours jusqu'à la commercialisation.",
                objectifs: "Produire 4 500 poulets commercialisables (90% de taux de survie) pour un CA de 4 500 000 FCFA",
                responsable: "Fatoumata Diarra",
                dateDebut: "2025-12-01",
                dateFin: "2026-01-15",
                statut: "todo",
                budgetEntreesPrev: [
                    { id: "b4-1", designation: "Vente poulets (4500 x 1000F)", montant: 4500000 },
                ],
                budgetSortiesPrev: [
                    { id: "b4-2", designation: "5000 poussins", montant: 750000 },
                    { id: "b4-3", designation: "Aliments (45 jours)", montant: 1500000 },
                    { id: "b4-4", designation: "Vaccinations + vétérinaire", montant: 200000 },
                    { id: "b4-5", designation: "Chauffage + électricité", montant: 150000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Maladies aviaires, mortalité élevée des poussins",
                suggestionResolution: "Respecter strictement le calendrier vaccinal et maintenir une température constante dans les poulaillers",
                commentaires: "Premier cycle prévu pour décembre 2025"
            },
            {
                id: "t1-005",
                designation: "Semis de maïs saisonnière",
                description: "Préparer 5 hectares, semer le maïs amélioré (variété EVDT), appliquer les engrais NPK et urée, assurer le sarclage et la lutte contre les ravageurs jusqu'à la récolte.",
                objectifs: "Produire 15 tonnes de maïs (3T/ha) pour l'alimentation des volailles et la vente",
                responsable: "Moussa Konaté",
                dateDebut: "2026-06-01",
                dateFin: "2026-10-30",
                statut: "todo",
                budgetEntreesPrev: [
                    { id: "b5-1", designation: "Vente maïs excédent (5T x 200F/kg)", montant: 1000000 },
                ],
                budgetSortiesPrev: [
                    { id: "b5-2", designation: "Semences maïs améliorées", montant: 200000 },
                    { id: "b5-3", designation: "Engrais NPK + Urée", montant: 350000 },
                    { id: "b5-4", designation: "Main d'œuvre saisonnière", montant: 300000 },
                    { id: "b5-5", designation: "Pesticides", montant: 100000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Sécheresse, invasion de chenilles légionnaires",
                suggestionResolution: "Utiliser des semences précoces (90 jours) et installer un système d'irrigation d'appoint",
                commentaires: ""
            },
            {
                id: "t1-006",
                designation: "Commercialisation et marketing",
                description: "Développer un réseau de distribution : marchés de Sikasso, restaurants, hôtels, supermarchés. Créer une page Facebook et WhatsApp Business. Établir des contrats avec les acheteurs réguliers.",
                objectifs: "Écouler 100% de la production et fidéliser au moins 20 clients réguliers",
                responsable: "Amadou Traoré",
                dateDebut: "2026-01-01",
                dateFin: "2026-12-31",
                statut: "todo",
                budgetEntreesPrev: [],
                budgetSortiesPrev: [
                    { id: "b6-1", designation: "Communication (Facebook, affiches)", montant: 150000 },
                    { id: "b6-2", designation: "Transport livraison", montant: 300000 },
                    { id: "b6-3", designation: "Étals sur les marchés", montant: 100000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Concurrence des importations de poulets congelés",
                suggestionResolution: "Miser sur la fraîcheur et la qualité du poulet local, prix compétitif",
                commentaires: ""
            }
        ],

        // Documents
        _documents: []
    },
    created_at: "2025-07-01T08:00:00.000Z",
};

const businessPlan1 = {
    investissementMateriel: "7500000",
    investissementImateriel: "1500000",
    fondsDeRoulement: "3000000",
    fondsPropres: "5500000",
    emprunt: "6500000",
    tauxInteret: "10",
    tauxSansRisque: "3.5",
    primeSectorielle: "5",
    primePays: "6",
    tauxIS: "25",
    dureeAmortissement: "5",
    caAnnees: "[12000000, 18000000, 25000000, 32000000, 40000000]",
    chargesVariables: "55",
    chargesFixes: "4800000",
    chargesFinancieres: "650000",
};

// ═══════════════════════════════════════════════════════════════
// PROJET 2 : SAHEL TECH SOLUTIONS
// Secteur : Technologie / Services IT
// Localisation : Ouagadougou, Burkina Faso
// ═══════════════════════════════════════════════════════════════

const projet2 = {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "Sahel Tech Solutions",
    description: "Entreprise de services technologiques à Ouagadougou : développement web et mobile, maintenance informatique, vente de matériel informatique reconditionné et formation digitale. Cible : PME, administrations, ONG et particuliers du Burkina Faso.",
    status: "En cours",
    type: "standard",
    icon: "💻",
    color: "blue",
    sector: "Technologie",
    target: "Atteindre un CA de 35 000 000 FCFA en année 3, former 500 personnes et devenir la référence IT au Burkina Faso",
    budget: "12 000 000 FCFA",
    team: "Désiré Traoré, Aminata Ouédraogo, Boureima Zoungrana, Pascal Nikiéma",
    extra_info: {
        // ProjectInfo
        name: "Sahel Tech Solutions",
        sector: "Technologie",
        location: "Ouagadougou, Zone Commerciale, Burkina Faso",
        zone: "Ouagadougou et grandes villes du Burkina Faso (Bobo-Dioulasso, Koudougou)",
        startDate: "2025-09-01",
        duration: "5 ans",
        description: "Entreprise de services technologiques complète basée à Ouagadougou. Nos activités principales :\n1. Développement web et mobile : sites vitrines, e-commerce, applications mobiles\n2. Maintenance informatique : contrats de maintenance pour PME et administrations\n3. Vente de matériel informatique reconditionné (ordinateurs, imprimantes, accessoires)\n4. Formation digitale : initiation informatique, bureautique, programmation, marketing digital\nNous ciblons les PME, ONG, administrations locales et particuliers du Burkina Faso.",
        objectives: "Objectifs sur 5 ans :\n1. Réaliser 50 projets web/mobile par an à partir de l'année 2\n2. Signer 20 contrats de maintenance annuels avec des PME\n3. Vendre 200 ordinateurs reconditionnés par an\n4. Former 500 personnes par an en compétences digitales\n5. Atteindre un CA de 35 000 000 FCFA en année 3\n6. Ouvrir une antenne à Bobo-Dioulasso en année 4\n7. Créer 12 emplois permanents",

        // Manager
        _manager: {
            nomComplet: "Désiré Traoré",
            contact: "+226 70 45 67 89",
            role: "Directeur Général et Lead Developer",
            niveauAcces: "administrateur",
            membres: [
                { id: "m2-1", nom: "Ouédraogo", prenom: "Aminata", contact: "+226 71 23 45 67", role: "Responsable Commercial et Marketing" },
                { id: "m2-2", nom: "Zoungrana", prenom: "Boureima", contact: "+226 76 98 76 54", role: "Développeur Full-Stack Senior" },
                { id: "m2-3", nom: "Nikiéma", prenom: "Pascal", contact: "+226 70 55 44 33", role: "Technicien Maintenance et Réseau" },
                { id: "m2-4", nom: "Sawadogo", prenom: "Mariam", contact: "+226 75 22 33 44", role: "Responsable Formation" },
            ],
            partenaires: [
                { id: "pt2-1", nom: "Compaoré", prenom: "Jean", contact: "+226 70 99 88 77", role: "Fournisseur matériel IT (Distributeur agréé)" },
                { id: "pt2-2", nom: "Tapsoba", prenom: "Florence", contact: "+226 71 66 55 44", role: "Consultante en gestion de projet" },
            ]
        },

        // Tâches
        _tasks: [
            {
                id: "t2-001",
                designation: "Aménagement local et installation",
                description: "Louer et aménager un local de 120m² dans la Zone Commerciale de Ouagadougou : espace de travail open-space (8 postes), salle de formation (15 places), salle serveur, accueil clients. Installer la fibre optique et le réseau interne.",
                objectifs: "Avoir un local professionnel fonctionnel avec connexion haut débit",
                responsable: "Désiré Traoré",
                dateDebut: "2025-09-01",
                dateFin: "2025-10-15",
                statut: "termine",
                budgetEntreesPrev: [{ id: "b2-1-1", designation: "Budget aménagement", montant: 3500000 }],
                budgetSortiesPrev: [
                    { id: "b2-1-2", designation: "Loyer 6 mois (200 000/mois)", montant: 1200000 },
                    { id: "b2-1-3", designation: "Aménagement intérieur", montant: 800000 },
                    { id: "b2-1-4", designation: "Installation fibre + réseau", montant: 500000 },
                    { id: "b2-1-5", designation: "Meubles et matériel bureau", montant: 700000 },
                    { id: "b2-1-6", designation: "Enseigne et signalétique", montant: 300000 },
                ],
                budgetEntreesReel: [{ id: "b2-1-7", designation: "Budget aménagement", montant: 3500000 }],
                budgetSortiesReel: [
                    { id: "b2-1-8", designation: "Loyer 6 mois", montant: 1200000 },
                    { id: "b2-1-9", designation: "Aménagement intérieur", montant: 750000 },
                    { id: "b2-1-10", designation: "Installation fibre + réseau", montant: 450000 },
                    { id: "b2-1-11", designation: "Meubles bureau", montant: 650000 },
                    { id: "b2-1-12", designation: "Enseigne", montant: 280000 },
                ],
                risques: "Retard d'installation de la fibre optique",
                suggestionResolution: "Prévoir une solution 4G de secours en attendant la fibre",
                commentaires: "Local opérationnel depuis le 15 octobre"
            },
            {
                id: "t2-002",
                designation: "Équipement informatique",
                description: "Acheter 8 ordinateurs portables (pour les développeurs et techniciens), 5 ordinateurs reconditionnés (pour la salle de formation), un serveur, une imprimante multifonction, vidéoprojecteur et accessoires divers.",
                objectifs: "Équiper tous les postes de travail et la salle de formation",
                responsable: "Pascal Nikiéma",
                dateDebut: "2025-10-01",
                dateFin: "2025-11-15",
                statut: "en-cours",
                budgetEntreesPrev: [{ id: "b2-2-1", designation: "Budget équipement IT", montant: 4500000 }],
                budgetSortiesPrev: [
                    { id: "b2-2-2", designation: "8 laptops (350 000 chacun)", montant: 2800000 },
                    { id: "b2-2-3", designation: "5 PC formation reconditionnés", montant: 500000 },
                    { id: "b2-2-4", designation: "Serveur + NAS", montant: 600000 },
                    { id: "b2-2-5", designation: "Imprimante + vidéoprojecteur", montant: 350000 },
                    { id: "b2-2-6", designation: "Accessoires (câbles, onduleurs, etc.)", montant: 250000 },
                ],
                budgetEntreesReel: [{ id: "b2-2-7", designation: "Budget équipement IT", montant: 4500000 }],
                budgetSortiesReel: [
                    { id: "b2-2-8", designation: "6 laptops reçus", montant: 2100000 },
                    { id: "b2-2-9", designation: "5 PC formation", montant: 500000 },
                    { id: "b2-2-10", designation: "Accessoires", montant: 230000 },
                ],
                risques: "Douane sur le matériel importé, délais de livraison",
                suggestionResolution: "Utiliser des fournisseurs locaux certifiés et négocier les délais",
                commentaires: "6 laptops livrés, 2 en attente, serveur commandé"
            },
            {
                id: "t2-003",
                designation: "Création du site web et identité digitale",
                description: "Concevoir et développer le site web de l'entreprise (portfolio, services, blog, formulaire de contact). Créer les comptes réseaux sociaux (Facebook, LinkedIn, Instagram). Concevoir le logo, cartes de visite et supports visuels.",
                objectifs: "Avoir une présence en ligne professionnelle et générer les premiers leads",
                responsable: "Boureima Zoungrana",
                dateDebut: "2025-10-15",
                dateFin: "2025-12-01",
                statut: "en-cours",
                budgetEntreesPrev: [],
                budgetSortiesPrev: [
                    { id: "b2-3-1", designation: "Nom de domaine + hébergement 2 ans", montant: 50000 },
                    { id: "b2-3-2", designation: "Logo et charte graphique", montant: 150000 },
                    { id: "b2-3-3", designation: "Cartes de visite (500 ex)", montant: 50000 },
                    { id: "b2-3-4", designation: "Publicité Facebook/Google (3 mois)", montant: 300000 },
                ],
                budgetEntreesReel: [
                    { id: "b2-3-5", designation: "Économie (fait en interne)", montant: 0 },
                ],
                budgetSortiesReel: [
                    { id: "b2-3-6", designation: "Nom de domaine + hébergement", montant: 45000 },
                    { id: "b2-3-7", designation: "Cartes de visite", montant: 45000 },
                ],
                risques: "Site pas assez visible sur les moteurs de recherche",
                suggestionResolution: "Optimiser le SEO dès la conception et publier du contenu régulièrement",
                commentaires: "Site en cours de développement, design finalisé"
            },
            {
                id: "t2-004",
                designation: "Prospection et premiers contrats",
                description: "Démarcher les PME, ONG, administrations et particuliers pour signer les premiers contrats. Proposer des offres de lancement : site web à prix réduit, première maintenance gratuite, etc. Partenariats avec les écoles et universités.",
                objectifs: "Signer au moins 10 contrats web, 5 contrats maintenance et vendre 30 PC en année 1",
                responsable: "Aminata Ouédraogo",
                dateDebut: "2025-11-01",
                dateFin: "2026-06-30",
                statut: "en-cours",
                budgetEntreesPrev: [
                    { id: "b2-4-1", designation: "CA prévu contrats web (10 x 200 000)", montant: 2000000 },
                    { id: "b2-4-2", designation: "CA maintenance (5 x 100 000)", montant: 500000 },
                    { id: "b2-4-3", designation: "CA vente PC (30 x 80 000)", montant: 2400000 },
                ],
                budgetSortiesPrev: [
                    { id: "b2-4-4", designation: "Déplacements et repas", montant: 200000 },
                    { id: "b2-4-5", designation: "Documentation commerciale", montant: 100000 },
                    { id: "b2-4-6", designation: "Achat PC reconditionnés", montant: 1500000 },
                ],
                budgetEntreesReel: [
                    { id: "b2-4-7", designation: "3 contrats web signés", montant: 550000 },
                    { id: "b2-4-8", designation: "8 PC vendus", montant: 640000 },
                ],
                budgetSortiesReel: [
                    { id: "b2-4-9", designation: "Déplacements", montant: 85000 },
                    { id: "b2-4-10", designation: "Achat 15 PC reconditionnés", montant: 750000 },
                    { id: "b2-4-11", designation: "Fiches commerciales", montant: 45000 },
                ],
                risques: "Difficulté à convaincre les PME traditionnelles de l'utilité du digital",
                suggestionResolution: "Offrir des démonstrations gratuites et montrer des cas de succès locaux",
                commentaires: "3 contrats web signés, 2 contrats maintenance en négociation"
            },
            {
                id: "t2-005",
                designation: "Programme de formation digitale",
                description: "Lancer un programme de formation continue : initiation informatique (2 semaines), bureautique avancée (1 mois), développement web (3 mois), marketing digital (1 mois). Préparer le contenu pédagogique, les certificats de fin de formation.",
                objectifs: "Former 200 personnes en année 1 avec un taux de satisfaction > 90%",
                responsable: "Mariam Sawadogo",
                dateDebut: "2026-01-15",
                dateFin: "2026-12-31",
                statut: "todo",
                budgetEntreesPrev: [
                    { id: "b2-5-1", designation: "Formation initiation (50 x 25 000F)", montant: 1250000 },
                    { id: "b2-5-2", designation: "Formation bureautique (80 x 50 000F)", montant: 4000000 },
                    { id: "b2-5-3", designation: "Formation dev web (40 x 150 000F)", montant: 6000000 },
                    { id: "b2-5-4", designation: "Formation marketing digital (30 x 75 000F)", montant: 2250000 },
                ],
                budgetSortiesPrev: [
                    { id: "b2-5-5", designation: "Formateurs (2)", montant: 1200000 },
                    { id: "b2-5-6", designation: "Supports pédagogiques", montant: 200000 },
                    { id: "b2-5-7", designation: "Certificats et diplômes", montant: 100000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Pouvoir d'achat limité des apprenants",
                suggestionResolution: "Proposer des facilités de paiement et des réductions de groupe. Partenariats avec les entreprises qui financent la formation de leurs employés.",
                commentaires: "Programme en cours de préparation, contenu pédagogique à 60%"
            },
            {
                id: "t2-006",
                designation: "Développement application mobile SaaS",
                description: "Développer une application mobile (Android) de gestion simplifiée pour les petits commerçants et artisans : facturation, gestion de stock, suivi des dettes. Version freemium et version premium à 5000F/mois.",
                objectifs: "Lancer la V1 avec 1000 téléchargements en 6 mois et 50 abonnés premium",
                responsable: "Boureima Zoungrana",
                dateDebut: "2026-03-01",
                dateFin: "2026-09-30",
                statut: "todo",
                budgetEntreesPrev: [
                    { id: "b2-6-1", designation: "Abonnements premium (50 x 5000F x 6 mois)", montant: 1500000 },
                ],
                budgetSortiesPrev: [
                    { id: "b2-6-2", designation: "Serveurs cloud (6 mois)", montant: 300000 },
                    { id: "b2-6-3", designation: "Google Play Store registration", montant: 25000 },
                    { id: "b2-6-4", designation: "Tests et QA", montant: 150000 },
                ],
                budgetEntreesReel: [],
                budgetSortiesReel: [],
                risques: "Concurrence d'applications existantes, adoption lente",
                suggestionResolution: "Impliquer les utilisateurs dès la phase beta, adapter aux besoins réels du marché burkinabè",
                commentaires: "Cahier des charges en cours de rédaction"
            }
        ],

        // Documents
        _documents: []
    },
    created_at: "2025-09-01T08:00:00.000Z",
};

const businessPlan2 = {
    investissementMateriel: "6000000",
    investissementImateriel: "2500000",
    fondsDeRoulement: "2000000",
    fondsPropres: "5000000",
    emprunt: "5500000",
    tauxInteret: "8",
    tauxSansRisque: "3.5",
    primeSectorielle: "7",
    primePays: "4",
    tauxIS: "27.5",
    dureeAmortissement: "4",
    caAnnees: "[8000000, 18000000, 35000000, 50000000, 70000000]",
    chargesVariables: "40",
    chargesFixes: "7200000",
    chargesFinancieres: "440000",
};

// ═══════════════════════════════════════════════════════════════
// EXÉCUTION
// ═══════════════════════════════════════════════════════════════

async function main() {
    console.log("\n🚀 Seed Baara Gnè Sira — Création de 2 projets complets\n");
    console.log("════════════════════════════════════════════════════════\n");

    // Nettoyage des anciens seed data
    console.log("🧹 Nettoyage des anciens projets de test...");
    await fetch(`${SUPABASE_URL}/rest/v1/business_plans?project_id=in.(a1b2c3d4-e5f6-7890-abcd-ef1234567890,b2c3d4e5-f6a7-8901-bcde-f12345678901)`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    await fetch(`${SUPABASE_URL}/rest/v1/projects?id=in.(a1b2c3d4-e5f6-7890-abcd-ef1234567890,b2c3d4e5-f6a7-8901-bcde-f12345678901)`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    console.log("✅ Anciens projets nettoyés\n");

    // Projet 1
    console.log("🌾 Création du Projet 1 : Djiguifa Agro-Business...");
    const p1Result = await supabaseInsert("projects", projet1);
    if (p1Result) {
        console.log("✅ Projet 1 créé :", p1Result[0]?.id);

        console.log("   📊 Ajout du business plan...");
        const bp1Result = await supabaseInsert("business_plans", {
            project_id: projet1.id,
            data: businessPlan1,
            updated_at: new Date().toISOString(),
        });
        if (bp1Result) console.log("   ✅ Business plan ajouté");
    }

    console.log("");

    // Projet 2
    console.log("💻 Création du Projet 2 : Sahel Tech Solutions...");
    const p2Result = await supabaseInsert("projects", projet2);
    if (p2Result) {
        console.log("✅ Projet 2 créé :", p2Result[0]?.id);

        console.log("   📊 Ajout du business plan...");
        const bp2Result = await supabaseInsert("business_plans", {
            project_id: projet2.id,
            data: businessPlan2,
            updated_at: new Date().toISOString(),
        });
        if (bp2Result) console.log("   ✅ Business plan ajouté");
    }

    console.log("\n════════════════════════════════════════════════════════");
    console.log("🎉 SEED TERMINÉ AVEC SUCCÈS !");
    console.log("");
    console.log("🌾 Projet 1 : Djiguifa Agro-Business");
    console.log("   - Secteur : Agriculture / Élevage");
    console.log("   - Localisation : Sikasso, Mali");
    console.log("   - Investissement total : 15 500 000 FCFA");
    console.log("   - Manager : Amadou Traoré (+223 76 34 56 78)");
    console.log("   - Membres : 3 + 2 partenaires");
    console.log("   - Tâches : 6 (1 terminée, 1 en cours, 4 à faire)");
    console.log("   - Business plan : Complet");
    console.log("");
    console.log("💻 Projet 2 : Sahel Tech Solutions");
    console.log("   - Secteur : Technologie / Services IT");
    console.log("   - Localisation : Ouagadougou, Burkina Faso");
    console.log("   - Investissement total : 12 000 000 FCFA");
    console.log("   - Manager : Désiré Traoré (+226 70 45 67 89)");
    console.log("   - Membres : 4 + 2 partenaires");
    console.log("   - Tâches : 6 (1 terminée, 2 en cours, 3 à faire)");
    console.log("   - Business plan : Complet");
    console.log("════════════════════════════════════════════════════════\n");
}

main().catch(err => {
    console.error("❌ Erreur fatale:", err);
    process.exit(1);
});
