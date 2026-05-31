"use client";

import { useState, useRef, useEffect } from "react";
import {
    ArrowLeft, ArrowRight, Check, Calculator, Landmark, Percent,
    Receipt, TrendingUp, CreditCard, PiggyBank, CircleDollarSign,
    FileSpreadsheet, BarChart3, Info, Pencil, X, Save, FolderKanban,
    MessageCircle, Send, Lightbulb, Plus, Trash2,
} from "lucide-react";

export interface BusinessPlanData {
    investissementMateriel: string;
    investissementImateriel: string;
    fondsDeRoulement: string;
    fondsPropres: string;
    emprunt: string;
    tauxInteret: string;
    tauxSansRisque: string;
    primeSectorielle: string;
    primePays: string;
    tauxIS: string;
    dureeAmortissement: string;
    caAnnees: string;
    chargesVariables: string;
    chargesFixes: string;
    chargesFinancieres: string;
    lineItemsJson?: string;
    designations?: Record<string, string>;
    computed?: {
        investissementMateriel: number;
        investissementImateriel: number;
        fondsDeRoulement: number;
        fondsPropres: number;
        emprunt: number;
        tauxInteret: number;
        tauxSansRisque: number;
        primeSectorielle: number;
        primePays: number;
        tauxIS: number;
        dureeAmortissement: number;
        chargesVariables: number;
        chargesFixes: number;
        chargesFinancieres: number;
        investTotal: number;
        finTotal: number;
        tauxActu: number;
        amortAnnuel: number;
        van: number;
        roi: number;
        tri: number;
        ip: number;
        delaiRecup: number;
    };
}

interface BusinessPlanWizardProps {
    initialData?: BusinessPlanData;
    onComplete: (data: BusinessPlanData) => void;
    onBack: () => void;
}

// ─── Moteur d'assistance intelligent ─────────────────

// ① CLASSIFICATEUR : chaque objet a sa VRAIE catégorie
interface ItemClass {
    category: string; // id du champ correct
    label: string; // nom lisible
    reason: string; // pourquoi c'est dans cette catégorie
}

const itemClassifier: Record<string, ItemClass> = {
    // ══════════════════════════════════════════════════════════════
    // INVESTISSEMENT MATÉRIEL = Biens physiques DURABLES (>1 an), achetés UNE SEULE FOIS au démarrage
    // RÈGLE : Tu l'achètes, il dure des années, tu ne le rachètes pas chaque mois
    // ══════════════════════════════════════════════════════════════
    "machine à coudre": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une machine à coudre est un bien physique DURABLE acheté une fois. Elle dure des années." },
    "surjeteuse": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "machine": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une machine est un bien physique DURABLE acheté une fois. Elle dure des années." },
    "machines": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Des machines sont des biens physiques DURABLES achetés une fois." },
    "véhicule": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un véhicule est un bien physique DURABLE qui dure 5-10 ans." },
    "camion": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un camion est un bien physique DURABLE." },
    "voiture": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une voiture est un bien physique DURABLE." },
    "moto": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une moto est un bien physique DURABLE." },
    "tricycle": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un tricycle est un bien physique DURABLE." },
    "vélo": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un vélo est un bien physique DURABLE." },
    "tracteur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un tracteur est un bien physique DURABLE." },
    "motoculteur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un motoculteur est un bien physique DURABLE." },
    "brouette": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une brouette est un bien physique DURABLE." },
    "charrette": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une charrette est un bien physique DURABLE." },
    "ordinateur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un ordinateur est un bien physique DURABLE." },
    "ordinateurs": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Des ordinateurs sont des biens physiques DURABLES." },
    "imprimante": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une imprimante est un bien physique DURABLE." },
    "scanner": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un scanner est un bien physique DURABLE." },
    "photocopieur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un photocopieur est un bien physique DURABLE." },
    "réfrigérateur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un réfrigérateur est un bien physique DURABLE." },
    "frigo": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un frigo est un bien physique DURABLE." },
    "congélateur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un congélateur est un bien physique DURABLE." },
    "climatiseur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un climatiseur est un bien physique DURABLE." },
    "climatisation": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "La climatisation est un bien physique DURABLE." },
    "ventilateur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un ventilateur est un bien physique DURABLE." },
    "four": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un four est un bien physique DURABLE." },
    "four à pain": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un four à pain est un bien physique DURABLE." },
    "moulin": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un moulin est un bien physique DURABLE." },
    "moulin à maïs": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un moulin à maïs est un bien physique DURABLE." },
    "moulin à mil": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un moulin à mil est un bien physique DURABLE." },
    "table": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une table est un bien physique DURABLE." },
    "tables": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Des tables sont des biens physiques DURABLES." },
    "chaise": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une chaise est un bien physique DURABLE." },
    "chaises": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Des chaises sont des biens physiques DURABLES." },
    "banc": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un banc est un bien physique DURABLE." },
    "outil": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un outil est un bien physique DURABLE." },
    "outils": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Les outils sont des biens physiques DURABLES." },
    "générateur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un générateur est un bien physique DURABLE." },
    "groupe électrogène": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un groupe électrogène est un bien physique DURABLE." },
    "panneau solaire": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un panneau solaire est un bien physique DURABLE." },
    "onduleur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un onduleur est un bien physique DURABLE." },
    "batterie": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une batterie est un bien physique DURABLE." },
    "meuble": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un meuble est un bien physique DURABLE." },
    "rayonnage": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un rayonnage est un bien physique DURABLE." },
    "comptoir": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un comptoir est un bien physique DURABLE." },
    "étagère": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une étagère est un bien physique DURABLE." },
    "cuisinière": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une cuisinière est un bien physique DURABLE." },
    "plaque de cuisson": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une plaque de cuisson est un bien physique DURABLE." },
    "fer à repasser": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "étuve": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une étuve est un bien physique DURABLE." },
    "pétrin": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un pétrin est un bien physique DURABLE." },
    "balance": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une balance est un bien physique DURABLE." },
    "balance électronique": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "pèse": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un pèse est un bien physique DURABLE." },
    "caisse enregistreuse": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "terminal de paiement": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "construction": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "La construction d'un local est un investissement matériel." },
    "bâtiment": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un bâtiment est un bien physique DURABLE." },
    "local": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "L'aménagement d'un local est un investissement matériel." },
    "hangar": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un hangar est un bien physique DURABLE." },
    "magasin": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "L'aménagement d'un magasin est un investissement matériel." },
    "kiosque": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un kiosque est un bien physique DURABLE." },
    "barrique": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une barrique est un bien physique DURABLE." },
    "tonneau": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un tonneau est un bien physique DURABLE." },
    "cuve": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une cuve est un bien physique DURABLE." },
    "réservoir": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un réservoir est un bien physique DURABLE." },
    "pompe": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une pompe est un bien physique DURABLE." },
    "forage": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un forage est un investissement physique DURABLE." },
    "puits": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un puits est un investissement physique DURABLE." },
    "séchoir": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un séchoir est un bien physique DURABLE." },
    "téléviseur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un téléviseur est un bien physique DURABLE." },
    "écran": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un écran est un bien physique DURABLE." },
    "vidéoprojecteur": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un vidéoprojecteur est un bien physique DURABLE." },
    "enceinte": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une enceinte est un bien physique DURABLE." },
    "micro": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un micro est un bien physique DURABLE." },
    "camera": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une camera est un bien physique DURABLE." },
    "caméra": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Une caméra est un bien physique DURABLE." },
    "arme": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "C'est un bien physique DURABLE." },
    "couteau": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un couteau professionnel est un bien physique DURABLE." },
    "couteaux": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Des couteaux professionnels sont des biens physiques DURABLES." },
    "fusil": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un fusil de chasse est un bien physique DURABLE." },
    "filet": { category: "chargesVariables", label: "📊 Charges variables", reason: "Un filet de pêche peut être soit matériel (filet durable) soit consommable. Si c'est un gros filet durable → Investissement matériel. Si renouvelé souvent → Charge variable." },
    "piège": { category: "investissementMateriel", label: "📦 Investissement matériel", reason: "Un piège est un bien physique DURABLE." },

    // ══════════════════════════════════════════════════════════════
    // INVESTISSEMENT IMMATÉRIEL = Dépenses NON physiques ponctuelles au démarrage
    // RÈGLE : Tu ne peux PAS le toucher, c'est de la connaissance, des droits, ou du digital
    // ══════════════════════════════════════════════════════════════
    "formation": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une formation est une dépense NON physique (connaissance). Tu paies pour apprendre." },
    "stage": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un stage de formation est une dépense NON physique (apprentissage)." },
    "apprentissage": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "L'apprentissage est une dépense NON physique." },
    "cours": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Des cours sont une dépense NON physique (connaissance)." },
    "site web": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un site web est un bien NON physique (digital)." },
    "site internet": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un site internet est un bien NON physique (digital)." },
    "application": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une application est un bien NON physique (digital)." },
    "logiciel": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un logiciel est un bien NON physique (digital)." },
    "licence": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une licence est un droit NON physique." },
    "brevet": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un brevet est un droit NON physique." },
    "marque déposée": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une marque déposée est un droit NON physique." },
    "étude de marché": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une étude de marché est une dépense intellectuelle." },
    "étude": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une étude est une dépense intellectuelle NON physique." },
    "registre de commerce": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les frais administratifs sont non physiques." },
    "carte professionnelle": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une carte professionnelle est un droit NON physique." },
    "permis": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un permis est un droit NON physique." },
    "autorisation": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une autorisation est un droit NON physique." },
    "agrément": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Un agrément est un droit NON physique." },
    "consultant": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les honoraires d'un consultant ponctuel sont non physiques." },
    "expert": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les honoraires d'un expert ponctuel sont non physiques." },
    "notaire": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les frais de notaire sont non physiques." },
    "frais juridique": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les frais juridiques sont non physiques." },
    "avocat": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les honoraires d'avocat pour la création sont non physiques." },
    "frais de création": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Les frais de création d'entreprise sont non physiques." },
    "développement": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Le développement (digital, produit) est une dépense NON physique." },
    "design": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Le design est une dépense intellectuelle NON physique." },
    "logo": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "La création d'un logo est une dépense NON physique." },
    "charte graphique": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une charte graphique est un bien NON physique." },
    "certification": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "Une certification est un droit NON physique." },
    "norme": { category: "investissementImateriel", label: "📋 Investissement immatériel", reason: "L'obtention d'une norme est un droit NON physique." },

    // ══════════════════════════════════════════════════════════════
    // FONDS DE ROULEMENT = Trésorerie de départ pour les PREMIERS MOIS
    // RÈGLE : Ce sont les dépenses des 3-6 premiers mois, avant que l'entreprise décolle
    // ══════════════════════════════════════════════════════════════
    "stock de départ": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Le stock de départ est couvert par le fonds de rouement." },
    "premier stock": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Le premier stock est couvert par le fonds de rouement." },
    "approvisionnement": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Le premier approvisionnement fait partie du fonds de roulement." },
    "trésorerie": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "La trésorerie de départ = fonds de rouement." },
    "imprévu": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Les imprévus des premiers mois = fonds de roulement." },
    "réserve": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "La réserve de départ = fonds de roulement." },
    "fonds de caisse": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Le fonds de caisse de départ = fonds de rouement." },
    "argent de départ": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "L'argent de départ pour les premiers mois = fonds de rouement." },
    "capital circulant": { category: "fondsDeRoulement", label: "💰 Fonds de rouement", reason: "Le capital circulant de départ = fonds de rouement." },

    // ══════════════════════════════════════════════════════════════
    // FONDS PROPRES = Ton argent PERSONNEL, pas celui de la banque
    // RÈGLE : C'est TON argent, ou celui de tes associés/famille
    // ══════════════════════════════════════════════════════════════
    "épargne": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Tes épargnes personnelles = tes fonds propres." },
    "épargnes": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Tes épargnes personnelles = tes fonds propres." },
    "économies": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Tes économies personnelles = tes fonds propres." },
    "économie": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Ton économie personnelle = tes fonds propres." },
    "héritage": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Un héritage investi = fonds propres." },
    "don": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Un don reçu pour le projet = fonds propres." },
    "apport personnel": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Ton apport personnel = tes fonds propres." },
    "contribution": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Ta contribution personnelle = fonds propres." },
    "soutien familial": { category: "fondsPropres", label: "💵 Fonds propres", reason: "Le soutien de ta famille = fonds propres." },
    "aide familiale": { category: "fondsPropres", label: "💵 Fonds propres", reason: "L'aide de ta famille = fonds propres." },
    "tontine": { category: "fondsPropres", label: "💵 Fonds propres", reason: "L'argent de ta tontine = fonds propres." },
    "associé": { category: "fondsPropres", label: "💵 Fonds propres", reason: "L'apport d'un associé = fonds propres." },
    "actionnaire": { category: "fondsPropres", label: "💵 Fonds propres", reason: "L'apport d'un actionnaire = fonds propres." },

    // ══════════════════════════════════════════════════════════════
    // EMPRUNT = Argent de la BANQUE ou MICROFINANCE (à rembourser)
    // RÈGLE : C'est l'argent qu'on te PRÊTE, pas ton argent
    // ══════════════════════════════════════════════════════════════
    "prêt": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "Un prêt bancaire = un emprunt à rembourser avec intérêts." },
    "crédit": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "Un crédit bancaire = un emprunt à rembourser avec intérêts." },
    "emprunt bancaire": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "C'est un emprunt à rembourser avec intérêts." },
    "financement bancaire": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "C'est un emprunt à rembourser avec intérêts." },
    "microfinance": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "Un prêt de microfinance = un emprunt à rembourser." },
    "RCPB": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "Un prêt RCPB = un emprunt de microfinance." },
    "levée de fonds": { category: "emprunt", label: "🏦 Emprunt bancaire", reason: "Une levée de fonds externe = un financement à rembourser ou des parts à céder." },

    // ══════════════════════════════════════════════════════════════
    // CHARGES VARIABLES = CONSOMMABLES, varient avec les VENTES
    // RÈGLE : Tu le rachètes SANS ARRÊT. Plus tu vends, plus tu en achètes.
    // ⚠️ PIÈGE : Beaucoup de gens confondent avec investissement matériel !
    // ══════════════════════════════════════════════════════════════
    // --- Agriculture ---
    "engrais": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les engrais sont des CONSOMMABLES rachetés chaque saison. Ils NE SONT PAS durables → charges variables, PAS investissement matériel." },
    "engrais chimique": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les engrais chimiques sont des CONSOMMABLES. Pas des biens durables." },
    "engrais naturel": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les engrais naturels sont des CONSOMMABLES rachetés chaque saison." },
    "fertilisant": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les fertilisants sont des CONSOMMABLES. Ils ne durent pas." },
    "semence": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les semences sont des CONSOMMABLES renouvelés à CHAQUE cycle." },
    "semences": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les semences sont des CONSOMMABLES renouvelées à CHAQUE cycle." },
    "pesticide": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les pesticides sont des CONSOMMABLES rachetés régulièrement." },
    "herbicide": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les herbicides sont des CONSOMMABLES." },
    "fongicide": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les fongicides sont des CONSOMMABLES." },
    "insecticide": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les insecticides sont des CONSOMMABLES." },
    "intrant": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les intrants sont des CONSOMMABLES. Ils varient avec ta production." },
    "intrants": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les intrants sont des CONSOMMABLES. Pas des biens durables." },
    "fumier": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le fumier est un CONSOMMABLE renouvelé." },
    "compost": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le compost est un CONSOMMABLE renouvelé." },
    // --- Alimentation ---
    "matière première": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les matières premières sont des CONSOMMABLES renouvelés SANS ARRÊT. Pas des biens durables." },
    "matières premières": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Les matières premières sont des CONSOMMABLES renouvelés SANS ARRÊT." },
    "farine": { category: "chargesVariables", label: "📊 Charges variables", reason: "La farine est une matière première CONSOMMABLE. Tu la rachètes tout le temps." },
    "riz": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le riz est une matière première CONSOMMABLE." },
    "sucre": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le sucre est une matière première CONSOMMABLE." },
    "huile": { category: "chargesVariables", label: "📊 Charges variables", reason: "L'huile est une matière première CONSOMMABLE." },
    "sel": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le sel est un CONSOMMABLE." },
    "lait": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le lait est une matière première CONSOMMABLE." },
    "beurre": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le beurre est un CONSOMMABLE." },
    "œuf": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les œufs sont des CONSOMMABLES." },
    "œufs": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les œufs sont des CONSOMMABLES." },
    "viande": { category: "chargesVariables", label: "📊 Charges variables", reason: "La viande est une matière première CONSOMMABLE." },
    "poisson": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le poisson est une matière première CONSOMMABLE." },
    "poulet": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le poulet est une matière première CONSOMMABLE." },
    "légume": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les légumes sont des CONSOMMABLES." },
    "légumes": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les légumes sont des CONSOMMABLES." },
    "tomate": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les tomates sont des CONSOMMABLES." },
    "oignon": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les oignons sont des CONSOMMABLES." },
    "piment": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le piment est un CONSOMMABLE." },
    "céréale": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les céréales sont des CONSOMMABLES." },
    "mil": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le mil est une matière première CONSOMMABLE." },
    "sorgho": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le sorgho est un CONSOMMABLE." },
    "maïs": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le maïs est une matière première CONSOMMABLE." },
    "arachide": { category: "chargesVariables", label: "📊 Charges variables", reason: "L'arachide est une matière première CONSOMMABLE." },
    "niébé": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le niébé est un CONSOMMABLE." },
    "sésame": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le sésame est un CONSOMMABLE." },
    // --- Textile ---
    "coton": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Le coton est une matière première CONSOMMABLE, PAS un bien durable." },
    "tissu": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! Le tissu est une matière première CONSOMMABLE. Tu le rachètes sans arrêt." },
    "tissus": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les tissus sont des matières premières CONSOMMABLES." },
    "fil": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le fil est un CONSOMMABLE." },
    "bouton": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les boutons sont des CONSOMMABLES." },
    "fermeture": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les fermetures éclair sont des CONSOMMABLES." },
    "dentelle": { category: "chargesVariables", label: "📊 Charges variables", reason: "La dentelle est un CONSOMMABLE." },
    // --- Emballages ---
    "emballage": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les emballages sont des CONSOMMABLES." },
    "emballages": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les emballages sont des CONSOMMABLES." },
    "sac": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les sacs sont des emballages CONSOMMABLES." },
    "carton": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les cartons sont des emballages CONSOMMABLES." },
    "bouteille": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les bouteilles sont des CONSOMMABLES." },
    "pot": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les pots sont des emballages CONSOMMABLES." },
    "caisse": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les caisses d'emballage sont des CONSOMMABLES." },
    "boîte": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les boîtes sont des emballages CONSOMMABLES." },
    "bidon": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les bidons sont des CONSOMMABLES." },
    "sachet": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les sachets sont des CONSOMMABLES." },
    // --- Énergie (consommables) ---
    "carburant": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ Le carburant est un CONSOMMABLE racheté régulièrement, PAS un investissement." },
    "essence": { category: "chargesVariables", label: "📊 Charges variables", reason: "L'essence est un CONSOMMABLE." },
    "gazole": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le gazole est un CONSOMMABLE." },
    "gaz": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le gaz (bouteille) est un CONSOMMABLE racheté régulièrement." },
    "charbon": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le charbon est un CONSOMMABLE." },
    "bois de chauffe": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le bois de chauffe est un CONSOMMABLE." },
    // --- Élevage ---
    "aliment pour bétail": { category: "chargesVariables", label: "📊 Charges variables", reason: "⚠️ ERREUR COURANTE ! L'aliment pour bétail est un CONSOMMABLE renouvelé en permanence. PAS un investissement." },
    "aliment de bétail": { category: "chargesVariables", label: "📊 Charges variables", reason: "C'est un CONSOMMABLE renouvelé en permanence." },
    "provende": { category: "chargesVariables", label: "📊 Charges variables", reason: "La provende est un CONSOMMABLE renouvelé en permanence." },
    "tourteau": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le tourteau est un CONSOMMABLE." },
    "son": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le son est un CONSOMMABLE." },
    "concentré": { category: "chargesVariables", label: "📊 Charges variables", reason: "Le concentré pour animaux est un CONSOMMABLE." },
    "vitamine": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les vitamines pour animaux sont des CONSOMMABLES." },
    "vaccin": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les vaccins sont des CONSOMMABLES renouvelés." },
    "médicament vétérinaire": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les médicaments vétérinaires sont des CONSOMMABLES." },
    "produit vétérinaire": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les produits vétérinaires sont des CONSOMMABLES." },
    // --- Commerce ---
    "marchandise": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les marchandises pour la revente sont des charges variables." },
    "marchandises": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les marchandises pour la revente sont des charges variables." },
    "article": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les articles pour la revente sont des charges variables." },
    "produit": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les produits pour la revente sont des charges variables." },
    "commission": { category: "chargesVariables", label: "📊 Charges variables", reason: "Les commissions sur ventes sont des charges variables." },

    // ══════════════════════════════════════════════════════════════
    // CHARGES FIXES = Dépenses RÉGULIÈRES, même sans ventes
    // RÈGLE : Tu paies ça TOUS LES MOIS, que tu vendes ou pas
    // ══════════════════════════════════════════════════════════════
    "loyer": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "⚠️ Le loyer est une charge FIXE que tu paies chaque mois, même sans ventes. PAS un investissement." },
    "salaire": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les salaires sont des charges FIXES mensuelles." },
    "salaires": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les salaires sont des charges FIXES mensuelles." },
    "employé": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Le salaire d'un employé est une charge FIXE mensuelle." },
    "personnel": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les frais de personnel sont des charges FIXES." },
    "assurance": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "L'assurance est une charge FIXE annuelle." },
    "abonnement": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Un abonnement est une charge FIXE mensuelle." },
    "internet": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "L'abonnement internet est une charge FIXE mensuelle." },
    "électricité": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "L'électricité de base est une charge FIXE mensuelle." },
    "eau": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "L'eau est une charge FIXE mensuelle." },
    "téléphone": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Le téléphone est une charge FIXE mensuelle." },
    "comptable": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "⚠️ Les honoraires du comptable sont une charge FIXE annuelle, pas un investissement." },
    "publicité": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "La publicité régulière est une charge fixe annuelle." },
    "entretien": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "L'entretien régulier est une charge FIXE." },
    "maintenance": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "La maintenance régulière est une charge FIXE." },
    "taxe": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les taxes fixes (patente, licence) sont des charges FIXES." },
    "patente": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "La patente est une taxe FIXE annuelle." },
    "frais bancaire": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les frais bancaires récurrents sont des charges FIXES." },
    "gardiennage": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Le gardiennage est une charge FIXE mensuelle." },
    "nettoyage": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Le nettoyage régulier est une charge FIXE." },
    "sécurité": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "La sécurité est une charge FIXE mensuelle." },
    "location": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "La location d'un local est une charge FIXE mensuelle." },
    "fourniture de bureau": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les fournitures de bureau régulières sont des charges FIXES." },
    "honoraire": { category: "chargesFixes", label: "🏠 Charges fixes", reason: "Les honoraires récurrents (comptable, avocat) sont des charges FIXES." },
};

// ② Règles par section (pour les questions générales)
interface HelpRule {
    keywords: string[];
    response: string;
    relatedField?: string;
    suggestion?: string;
}

const helpDatabase: Record<string, HelpRule[]> = {
    investissementMateriel: [
        {
            keywords: ["machine", "équipement", "matériel", "appareil", "outil", "tracteur", "ordinateur", "véhicule", "camion", "frigo", "réfrigérateur", "table", "chaise", "four", "moulin"],
            response: "✅ Oui ! Tout ça fait partie de l'investissement matériel. Ce sont les objets physiques que tu achètes pour ton activité.",
            suggestion: "Additionne le prix de tous tes équipements et mets le total ici."
        },
        {
            keywords: ["bâtir", "construire", "construction", "local", "bâtiment", "magasin", "boutique", "hangar", "dépôt"],
            response: "✅ La construction ou l'aménagement d'un local fait partie de l'investissement matériel.",
            suggestion: "Calcule le coût total des travaux de construction ou d'aménagement."
        },
        {
            keywords: ["combien", "montant", "prix", "coût", "total"],
            response: "💡 Fais la liste de tous tes équipements et additionne leurs prix. N'oublie rien !",
            suggestion: "Exemple : 2 machines (2M) + 1 véhicule (3M) + outils (500K) = 5 500 000 FCFA"
        },
        {
            keywords: ["je ne sais pas", "je sais pas", "pas sûr", "incertain"],
            response: "💡 Pas de souci ! Fais une estimation. Tu pourras toujours modifier plus tard.",
            suggestion: "Pense à tout ce que tu dois acheter AVANT d'ouvrir. Liste-le et additionne."
        },
    ],
    investissementImateriel: [
        {
            keywords: ["formation", "étudier", "apprendre", "stage", "cours"],
            response: "✅ Oui ! Les frais de formation font partie de l'investissement immatériel.",
            suggestion: "Additionne tous les frais de formation, études et préparations."
        },
        {
            keywords: ["site web", "internet", "application", "digital", "en ligne"],
            response: "✅ La création de site web ou d'application est un investissement immatériel.",
            suggestion: "Inclus le coût de création et d'hébergement du site."
        },
        {
            keywords: ["licence", "brevet", "marque", "autorisation", "permis", "registre"],
            response: "✅ Oui ! Les frais de licences, brevets et autorisations sont immatériels.",
            suggestion: "Additionne tous les frais administratifs et de propriété intellectuelle."
        },
        {
            keywords: ["étude", " marché", "recherche", "consultant", "expert"],
            response: "✅ Les études de marché et frais de consultants sont des investissements immatériels.",
            suggestion: "Inclus le coût de l'étude de marché et des consultations."
        },
        {
            keywords: ["rien", "aucun", "0", "pas besoin"],
            response: "✅ C'est possible ! Si tu n'as pas de dépenses immatérielles, choisis 'Aucun' (0 FCFA).",
            suggestion: "Pense quand même aux frais de création d'entreprise ou de formation."
        },
    ],
    fondsDeRoulement: [
        {
            keywords: ["loyer", "charge", "salair", "dépannage", "urgence", "réserve"],
            response: "✅ Oui ! Le fonds de roulement sert à payer les charges des premiers mois (loyer, salaires, matières premières).",
            suggestion: "Calcule : (loyer + salaires + charges mensuelles) × 3 mois minimum."
        },
        {
            keywords: ["matière", "stock", "première", "approvisionnement", "achat"],
            response: "✅ L'achat des premières matières premières fait partie du fonds de roulement !",
            suggestion: "Estime le coût de ton stock de départ pour les 2-3 premiers mois."
        },
        {
            keywords: ["combien", "calculer", "calcul"],
            response: "💡 Règle simple : fonds de roulement = charges mensuelles × 3 à 6 mois.",
            suggestion: "Exemple : loyer 100K + salaires 300K + divers 100K = 500K/mois × 3 = 1 500 000 FCFA"
        },
    ],
    fondsPropres: [
        {
            keywords: ["épargne", "économies", "mon argent", "mes économies", "ma poche", "personnel"],
            response: "✅ Exactement ! Tes économies personnelles, c'est tes fonds propres.",
            suggestion: "Mets le montant total que toi et tes associés investissez personnellement."
        },
        {
            keywords: ["associé", "partenaire", "contribution", "apport"],
            response: "✅ L'argent de tes associés compte aussi comme fonds propres !",
            suggestion: "Additionne ta contribution + celle de tous tes associés."
        },
        {
            keywords: ["emprunt", "prêt", "banque", "microfinance"],
            response: "⚠️ Attention ! L'argent de la banque n'est PAS des fonds propres. C'est un emprunt (étape suivante).",
            suggestion: "Mets ici uniquement TON argent personnel. L'emprunt sera dans le champ suivant."
        },
        {
            keywords: ["combien", "pourcentage"],
            response: "💡 En général, les banques demandent au moins 20-30% de fonds propres.",
            suggestion: "Exemple : pour un projet de 10M, apporte au moins 2-3M de tes économies."
        },
    ],
    emprunt: [
        {
            keywords: ["banque", "prêt", "microfinance", "crédit", "emprunter", "financement"],
            response: "✅ Oui, c'est bien ici que tu mets le montant que tu demandes à la banque.",
            suggestion: "Mets le montant exact du prêt que tu demandes. Si tu n'empruntes pas, choisis 'Aucun emprunt'."
        },
        {
            keywords: ["pas besoin", "pas emprunter", "aucun", "0", "je n'emprunte pas"],
            response: "✅ Très bien ! Si tu n'as pas besoin d'emprunter, choisis 'Aucun emprunt'.",
            suggestion: "C'est un avantage : pas d'intérêts à payer !"
        },
        {
            keywords: ["combien", "montant"],
            response: "💡 Emprunt = Investissement total - Fonds propres - Fonds de roulement (si nécessaire).",
            suggestion: "N'emprunte que ce dont tu as besoin, pas plus. Les intérêts coûtent cher !"
        },
    ],
    tauxInteret: [
        {
            keywords: ["banque", "BIB", "BCEAO", "classique"],
            response: "💡 Les banques classiques au Burkina pratiquent 7-10%. Les microfinances sont plus chères (12-15%).",
            suggestion: "Renseigne-toi auprès de ta banque pour connaître leur taux exact."
        },
        {
            keywords: ["microfinance", "RCPB", "CSSPP", "caisse"],
            response: "💡 Les microfinances ont des taux plus élevés : généralement 12-15%.",
            suggestion: "Compare plusieurs offres avant de choisir !"
        },
        {
            keywords: ["pas emprunt", "aucun", "0"],
            response: "✅ Si tu n'as pas d'emprunt, le taux d'intérêt n'a pas d'importance. Mets 0%.",
            suggestion: "Choisis '5%' par défaut, ça n'aura pas d'impact si tu n'as pas d'emprunt."
        },
    ],
    tauxSansRisque: [
        {
            keywords: ["c'est quoi", "comprendre", "expliquer", "signifie"],
            response: "💡 C'est le rendement d'un placement 100% sûr (comme les obligations d'État). Ça sert de référence pour comparer ton projet.",
            suggestion: "Au Burkina Faso et zone UEMOA, c'est environ 3,5%. Choisis cette valeur."
        },
        {
            keywords: ["UEMOA", "BCEAO", "Burkina", "obligation"],
            response: "✅ Pour la zone UEMOA/Burkina Faso, le taux sans risque est d'environ 3,5%.",
            suggestion: "Choisis 3,5% si tu es au Burkina Faso."
        },
    ],
    primeSectorielle: [
        {
            keywords: ["agriculture", "élevage", "ferme", "champ", "culture"],
            response: "🌾 L'agriculture est un secteur risqué (aléas climatiques, prix variables). Prime recommandée : 5%.",
            suggestion: "Choisis '5% — Secteur risqué' pour l'agriculture."
        },
        {
            keywords: ["commerce", "vente", "boutique", "magasin", "marché"],
            response: "🛒 Le commerce a un risque modéré. Prime recommandée : 3%.",
            suggestion: "Choisis '3% — Secteur modéré' pour le commerce."
        },
        {
            keywords: ["technologie", "tech", "digital", "startup", "innovation"],
            response: "💻 La technologie est un secteur très risqué mais très rentable. Prime recommandée : 7%.",
            suggestion: "Choisis '7% — Secteur très risqué' pour la tech."
        },
        {
            keywords: ["service", "consulting", "conseil", "prestation"],
            response: "💼 Les services ont un risque modéré. Prime recommandée : 3%.",
            suggestion: "Choisis '3% — Secteur modéré' pour les services."
        },
        {
            keywords: ["restauration", "restaurant", "restaurant", "café", "cuisine"],
            response: "🍽️ La restauration a un risque modéré à élevé. Prime recommandée : 3-5%.",
            suggestion: "Choisis '3%' ou '5%' selon ton expérience."
        },
        {
            keywords: ["bâtiment", "construction", "BTP", "travaux"],
            response: "🏗️ Le BTP est un secteur risqué (retards, coûts imprévus). Prime recommandée : 5%.",
            suggestion: "Choisis '5% — Secteur risqué' pour le BTP."
        },
    ],
    primePays: [
        {
            keywords: ["Burkina", "Faso", "Ouaga", "Bobo"],
            response: "🇧🇫 Le Burkina Faso a un risque pays modéré à élevé. Prime recommandée : 4%.",
            suggestion: "Choisis '4% — Pays modéré' pour le Burkina Faso."
        },
        {
            keywords: ["Côte d'Ivoire", "Abidjan", "CI"],
            response: "🇨🇮 La Côte d'Ivoire est relativement stable. Prime recommandée : 3%.",
            suggestion: "Choisis '3%' mais tu peux mettre '4%' si tu es prudent."
        },
        {
            keywords: ["France", "Europe", "USA", "stable"],
            response: "💡 Les pays développés ont une prime faible : 1-2%.",
            suggestion: "Choisis '2% — Pays stable'."
        },
        {
            keywords: ["Mali", "Niger", "guerre", "conflit", "crise"],
            response: "⚠️ Les pays en crise ont une prime élevée : 6-8%.",
            suggestion: "Choisis '6%' ou '8%' selon le niveau de risque."
        },
    ],
    tauxIS: [
        {
            keywords: ["Burkina", "Faso", "impôt", "impôt sur les sociétés", "IS"],
            response: "🇧🇫 Au Burkina Faso, l'IS standard est de 25% (ou 27,5% avec les contributions additionnelles).",
            suggestion: "Choisis '25% — IS standard' pour le Burkina Faso."
        },
        {
            keywords: ["exonération", "exonéré", "nouveau", "start-up", "jeune entreprise"],
            response: "💡 Certaines entreprises bénéficient d'exonérations fiscales temporaires.",
            suggestion: "Si tu es exonéré, choisis '0%'. Sinon, mets 25%."
        },
        {
            keywords: ["comment", "calculer"],
            response: "💡 L'IS se calcule sur le bénéfice : Bénéfice × Taux IS = Impôt à payer.",
            suggestion: "Exemple : Bénéfice 1 000 000 × 25% = 250 000 FCFA d'impôt."
        },
    ],
    dureeAmortissement: [
        {
            keywords: ["véhicule", "camion", "voiture", "moto"],
            response: "🚗 Un véhicule s'amortit généralement sur 5 ans.",
            suggestion: "Choisis '5 ans' si ton investissement principal est un véhicule."
        },
        {
            keywords: ["machine", "équipement", "matériel"],
            response: "🔧 Les machines et équipements s'amortissent sur 5-7 ans en général.",
            suggestion: "Choisis '5 ans' pour du matériel standard, '7 ans' pour du lourd."
        },
        {
            keywords: ["bâtiment", "construction", "local", "immobilier"],
            response: "🏗️ Les bâtiments s'amortissent sur 10-20 ans.",
            suggestion: "Choisis '10 ans' pour un bâtiment."
        },
        {
            keywords: ["ordinateur", "informatique", "tech", "numérique"],
            response: "💻 Le matériel informatique s'use vite. Amortissement : 3 ans.",
            suggestion: "Choisis '3 ans' pour du matériel informatique."
        },
    ],
    chargesVariables: [
        {
            keywords: ["matière première", "ingrédient", "farine", "riz", "coton", "stock", "achat revente"],
            response: "✅ Les matières premières sont des charges variables ! Plus tu produis/vends, plus tu en achètes.",
            suggestion: "Calcule : coût des matières premières / prix de vente × 100 = ton % de charges variables."
        },
        {
            keywords: ["emballage", "conditionnement", "sac", "carton", "bouteille"],
            response: "✅ Les emballages sont des charges variables.",
            suggestion: "Ajoute-les dans ton calcul de charges variables."
        },
        {
            keywords: ["transport", "livraison", "frais de port"],
            response: "💡 Le transport de marchandises est souvent une charge variable.",
            suggestion: "Si le coût varie avec tes ventes, inclus-le ici."
        },
        {
            keywords: ["combien", "calculer", "pourcentage"],
            response: "💡 Charges variables = (coût des matières + emballages + transport lié aux ventes) / Chiffre d'affaires × 100",
            suggestion: "Exemple : si pour 1M de ventes tu dépenses 550K en matières → 55%"
        },
        {
            keywords: ["commerce", "achat", "revente"],
            response: "🛒 Dans le commerce d'achat-revente, les charges variables = coût d'achat des marchandises.",
            suggestion: "Typiquement 60-75% du CA pour un commerce classique."
        },
    ],
    chargesFixes: [
        {
            keywords: ["loyer", "bail", "location"],
            response: "✅ Le loyer est une charge fixe ! Tu le paies même si tu ne vends rien.",
            suggestion: "Calcule le loyer annuel = loyer mensuel × 12."
        },
        {
            keywords: ["salaire", "employé", "personnel", "travailleur"],
            response: "✅ Les salaires sont des charges fixes (sauf commission variable).",
            suggestion: "Calcule : salaire mensuel × 12 + charges sociales."
        },
        {
            keywords: ["assurance", "abonnement", "électricité", "eau", "internet"],
            response: "✅ Ces frais réguliers sont des charges fixes.",
            suggestion: "Additionne toutes tes charges mensuelles et multiplie par 12."
        },
        {
            keywords: ["comptable", "expert", "conseil", "honoraires"],
            response: "✅ Les honoraires du comptable ou de l'expert sont des charges fixes annuelles.",
            suggestion: "Inclus-les dans ton total de charges fixes."
        },
        {
            keywords: ["combien", "calculer", "total"],
            response: "💡 Charges fixes annuelles = (loyer + salaires + assurances + abonnements + honoraires) × 12",
            suggestion: "Exemple : loyer 50K + salaire 150K + divers 30K = 230K/mois × 12 = 2 760 000 FCFA/an"
        },
    ],
    chargesFinancieres: [
        {
            keywords: ["emprunt", "intérêt", "banque", "remboursement"],
            response: "✅ Les intérêts de ton emprunt sont des charges financières. Attention : seulement les INTÉRÊTS, pas le capital.",
            suggestion: "Intérêts annuels = Montant emprunté × Taux d'intérêt."
        },
        {
            keywords: ["pas emprunt", "aucun", "0", "je n'ai pas emprunté"],
            response: "✅ Si tu n'as pas d'emprunt, tes charges financières sont de 0 FCFA.",
            suggestion: "Choisis 'Aucune (pas d'emprunt)'."
        },
        {
            keywords: ["combien", "calculer"],
            response: "💡 Charges financières = Capital restant dû × Taux d'intérêt (chaque année).",
            suggestion: "En simplifiant : Emprunt × Taux. Ex: 5M × 8% = 400 000 FCFA/an"
        },
    ],
};

// Noms lisibles des champs
const fieldNames: Record<string, string> = {
    investissementMateriel: "📦 Investissement matériel",
    investissementImateriel: "📋 Investissement immatériel",
    fondsDeRoulement: "💰 Fonds de roulement",
    fondsPropres: "💵 Fonds propres",
    emprunt: "🏦 Emprunt bancaire",
    tauxInteret: "📊 Taux d'intérêt",
    tauxSansRisque: "📈 Taux sans risque",
    primeSectorielle: "🏢 Prime sectorielle",
    primePays: "🌍 Prime pays",
    tauxIS: "🧾 Impôt (IS)",
    dureeAmortissement: "📅 Durée amortissement",
    chargesVariables: "📊 Charges variables",
    chargesFixes: "🏠 Charges fixes",
    chargesFinancieres: "💳 Charges financières",
};

// Description intelligente de chaque champ (pour les explications dynamiques)
const fieldExplanations: Record<string, string> = {
    investissementMateriel:
        "📦 INVESTISSEMENT MATÉRIEL = Tout ce que tu achètes de PHYSIQUE et DURABLE avant d'ouvrir.\n\n" +
        "✅ ÇA VA ICI : Machines, véhicules, ordinateurs, réfrigérateurs, tables, chaises, four, moulin, tracteur, outils, rayonnages, comptoirs, cuisinières, générateurs, climatisation.\n\n" +
        "❌ ÇA NE VA PAS ICI : La formation (→ Immatériel), le loyer (→ Charges fixes), les matières premières (→ Fonds de roulement), l'argent de la banque (→ Emprunt).\n\n" +
        "📐 COMMENT CALCULER : Fais la liste de TOUT ce que tu dois acheter, note le prix de chaque objet et additionne.\n" +
        "Exemple : 2 machines à coudre (600 000) + 1 surjeteuse (250 000) + 1 fer (25 000) + 5 tables (100 000) + 1 ordinateur (300 000) = 1 275 000 FCFA.",
    investissementImateriel:
        "📋 INVESTISSEMENT IMMATÉRIEL = Dépenses NON physiques pour préparer ton projet.\n\n" +
        "✅ ÇA VA ICI : Formation professionnelle, création de site web, étude de marché, frais de création d'entreprise (registre de commerce), licences, brevets, honoraires d'expert-comptable, frais juridiques, dépôt de marque, conseil technique.\n\n" +
        "❌ ÇA NE VA PAS ICI : Les machines (→ Matériel), le stock de marchandises (→ Fonds de roulement).\n\n" +
        "💡 Si tu n'as vraiment aucune dépense de ce type, tu peux mettre 0. Mais la plupart des projets ont AU MOINS les frais de création d'entreprise.\n" +
        "Exemple : Registre de commerce (50 000) + Formation gestion (200 000) + Site web (150 000) = 400 000 FCFA.",
    fondsDeRoulement:
        "💰 FONDS DE ROULEMENT = L'argent pour survivre les premiers mois avant de gagner suffisamment.\n\n" +
        "✅ ÇA VA ICI : Le stock de départ (matières premières, marchandises), le loyer des premiers mois, les salaires des premiers mois, l'électricité et l'eau des premiers mois, les imprévus.\n\n" +
        "❌ ÇA NE VA PAS ICI : Les machines (→ Matériel), la formation (→ Immatériel), ton argent personnel (→ Fonds propres).\n\n" +
        "📐 COMMENT CALCULER : (Loyer + Salaires + Charges mensuelles + Stock mensuel) × 3 à 6 mois.\n" +
        "Exemple : Loyer 80 000 + Salaires 250 000 + Électricité 30 000 + Stock 400 000 = 760 000/mois × 3 mois = 2 280 000 FCFA.\n\n" +
        "⚠️ ATTENTION : Sous-estimer le fonds de roulement est la cause #1 d'échec des nouvelles entreprises !",
    fondsPropres:
        "💵 FONDS PROPRES = L'argent qui vient de TOI et de tes ASSOCIÉS. Pas de la banque !\n\n" +
        "✅ ÇA VA ICI : Tes économies personnelles, l'argent de tes associés, un héritage, un don reçu, l'argent d'un soutien familial.\n\n" +
        "❌ ÇA NE VA PAS ICI : L'argent de la banque (→ Emprunt), l'argent d'un investisseur qui veut des parts (→ voir avec un comptable).\n\n" +
        "📐 RÈGLE : Les banques exigent généralement 20 à 30% de fonds propres sur le coût total du projet.\n" +
        "Exemple : Projet de 10 000 000 FCFA → Il faut au MINIMUM 2 000 000 à 3 000 000 FCFA de tes économies.\n\n" +
        "💡 Plus tes fonds propres sont élevés, plus la banque fera confiance à ton projet !",
    emprunt:
        "🏦 EMPRUNT = Le montant que tu demandes à la BANQUE ou à la MICROFINANCE.\n\n" +
        "✅ ÇA VA ICI : Prêt bancaire (BIB, BCB, etc.), crédit de microfinance (RCPB, CSSPP), prêt de soutien familial avec intérêts.\n\n" +
        "❌ ÇA NE VA PAS ICI : Ton argent personnel (→ Fonds propres), un don qu'on te fait (→ Fonds propres).\n\n" +
        "📐 COMMENT CALCULER : Emprunt = Investissement total − Fonds propres.\n" +
        "Exemple : Projet de 8 000 000 − Tes économies 3 000 000 = Emprunt de 5 000 000 FCFA.\n\n" +
        "⚠️ ATTENTION : N'emprunte que ce dont tu as BESOIN. Chaque franc emprunté doit être remboursé AVEC des intérêts !\n" +
        "💡 Si tu as assez d'économies, tu n'as PAS besoin d'emprunter. Choisis 'Aucun emprunt' (0 FCFA).",
    tauxInteret:
        "📊 TAUX D'INTÉRÊT = Le pourcentage que la banque te facture CHAQUE ANNÉE en plus du remboursement.\n\n" +
        "💡 Plus le taux est élevé, plus ton emprunt coûte cher !\n\n" +
        "📋 VALEURS COURANTES AU BURKINA FASO :\n" +
        "• Banque classique (BIB, BCB, Ecobank) : 7 à 10%\n" +
        "• Microfinance (RCPB, CSSPP) : 12 à 15%\n" +
        "• Prêt spécial/gouvernemental : 3 à 5%\n\n" +
        "📐 EXEMPLE : Tu empruntes 5 000 000 FCFA à 10% → Tu paies 500 000 FCFA d'intérêts PAR AN, en plus du remboursement du capital.\n\n" +
        "⚠️ Si tu n'as pas d'emprunt, ce taux n'a pas d'importance. Mets 5% par défaut.",
    tauxSansRisque:
        "📈 TAUX SANS RISQUE = Le rendement d'un placement 100% sûr (obligations d'État, bons du Trésor).\n\n" +
        "💡 Pourquoi on l'utilise ? Ça permet de comparer : ton projet doit rapporter PLUS qu'un placement sans risque, sinon autant placer ton argent à la banque !\n\n" +
        "📋 VALEURS DE RÉFÉRENCE :\n" +
        "• Zone UEMOA (BCEAO) : environ 3,5%\n" +
        "• Burkina Faso (bons du Trésor) : 3 à 4%\n\n" +
        "💡 Si tu es au Burkina Faso ou en Afrique de l'Ouest, choisis 3,5%.",
    primeSectorielle:
        "🏢 PRIME SECTORIELLE = Un bonus de risque lié à TON SECTEUR D'ACTIVITÉ.\n\n" +
        "💡 Plus ton secteur est incertain, plus la prime est élevée.\n\n" +
        "📋 GUIDE PAR SECTEUR :\n" +
        "• 1% — Très stable : Services publics, éducation, santé privée\n" +
        "• 3% — Modéré : Commerce, restauration, services, transport\n" +
        "• 5% — Risqué : Agriculture, élevage, BTP, industrie\n" +
        "• 7% — Très risqué : Technologie, innovation, start-up, mines\n\n" +
        "💡 Si tu hésites entre deux valeurs, choisis la plus élevée pour être prudent.",
    primePays:
        "🌍 PRIME PAYS = Un bonus de risque lié au PAYS où tu opères.\n\n" +
        "💡 Un pays instable politiquement ou économiquement = prime plus élevée.\n\n" +
        "📋 GUIDE PAR PAYS :\n" +
        "• 2% — Pays stable : France, Europe, USA\n" +
        "• 3% — Assez stable : Côte d'Ivoire, Sénégal, Ghana\n" +
        "• 4% — Modéré : Burkina Faso, Bénin, Togo\n" +
        "• 6% — Risqué : Mali, Niger, Guinée\n" +
        "• 8% — Très risqué : Pays en guerre ou crise grave\n\n" +
        "💡 Si tu es au Burkina Faso, choisis 4%.",
    tauxIS:
        "🧾 IMPÔT SUR LES SOCIÉTÉS (IS) = Le % de tes bénéfices que tu paies à l'État chaque année.\n\n" +
        "📋 TAUX AU BURKINA FASO :\n" +
        "• IS standard : 25%\n" +
        "• IS avec contributions additionnelles : 27,5%\n" +
        "• Entreprise nouvelle (parfois exonérée) : 0% temporairement\n\n" +
        "📐 COMMENT ÇA MARCHE : Bénéfice × Taux IS = Impôt à payer.\n" +
        "Exemple : Bénéfice 2 000 000 × 25% = 500 000 FCFA d'impôt.\n\n" +
        "⚠️ Si ton entreprise fait des pertes, tu ne paies PAS d'IS.\n" +
        "💡 Certaines zones franches ou jeunes entreprises bénéficient d'exonérations. Renseigne-toi !",
    dureeAmortissement:
        "📅 DURÉE D'AMORTISSEMENT = Sur combien d'années tu répartis le coût de tes investissements.\n\n" +
        "💡 L'amortissement permet d'étaler une grosse dépense sur plusieurs années dans tes comptes.\n\n" +
        "📋 GUIDE PAR TYPE D'ÉQUIPEMENT :\n" +
        "• 3 ans — Matériel informatique (ordinateurs, imprimantes), logiciels\n" +
        "• 5 ans — Véhicules, machines, matériel de production, mobilier\n" +
        "• 7 ans — Équipements lourds, installations techniques\n" +
        "• 10 ans — Bâtiments, constructions, gros travaux d'aménagement\n\n" +
        "📐 EXEMPLE : Véhicule 5 000 000 amorti sur 5 ans = 1 000 000 FCFA/an dans tes charges.\n\n" +
        "💡 Choisis la durée la plus courte correspondant à ton investissement principal.",
    chargesVariables:
        "📊 CHARGES VARIABLES = Dépenses qui AUGMENTENT quand tu vends PLUS.\n\n" +
        "✅ CE SONT DES CHARGES VARIABLES : Matières premières, marchandises pour la revente, emballages, commissions sur ventes, transport de livraison.\n\n" +
        "❌ CE NE SONT PAS DES CHARGES VARIABLES : Le loyer (→ fixe), les salaires de base (→ fixe), l'assurance (→ fixe).\n\n" +
        "📐 COMMENT CALCULER EN % DU CA : (Coût des matières premières annuel / Chiffre d'affaires annuel) × 100.\n\n" +
        "📋 VALEURS COURANTES :\n" +
        "• Commerce d'achat-revente : 60 à 75%\n" +
        "• Restauration : 30 à 40%\n" +
        "• Services : 10 à 25%\n" +
        "• Production/Transformation : 40 à 60%\n\n" +
        "💡 Exemple : Tu vends 10 000 000 FCFA/an et tu dépenses 5 500 000 en matières → 55%.",
    chargesFixes:
        "🏠 CHARGES FIXES = Dépenses que tu paies MÊME SI TU NE VENDS RIEN.\n\n" +
        "✅ CE SONT DES CHARGES FIXES : Loyer, salaires des employés, assurances, abonnements (internet, téléphone), électricité de base, eau, honoraires du comptable, frais bancaires, publicité fixe.\n\n" +
        "❌ CE NE SONT PAS DES CHARGES FIXES : Les matières premières (→ variables), les emballages (→ variables).\n\n" +
        "📐 COMMENT CALCULER : Additionne TOUTES tes charges mensuelles et multiplie par 12.\n\n" +
        "Exemple : Loyer 80 000 + Salaire employé 1 : 100 000 + Salaire employé 2 : 100 000 + Électricité 25 000 + Internet 15 000 + Assurance 10 000 + Comptable 30 000 = 360 000/mois × 12 = 4 320 000 FCFA/an.",
    chargesFinancieres:
        "💳 CHARGES FINANCIÈRES = Les INTÉRÊTS de ton emprunt (PAS le capital !).\n\n" +
        "⚠️ TRÈS IMPORTANT : On ne met QUE les intérêts, pas le remboursement du prêt lui-même.\n\n" +
        "📐 COMMENT CALCULER : Montant emprunté × Taux d'intérêt = Intérêts annuels.\n" +
        "Exemple : Emprunt 5 000 000 × 8% = 400 000 FCFA d'intérêts par an.\n\n" +
        "💡 Si tu n'as pas d'emprunt, tes charges financières sont de 0 FCFA. Choisis 'Aucune'.\n\n" +
        "📋 NOTE : En réalité les intérêts diminuent chaque année (car tu rembourses le capital). Mais pour simplifier, on utilise le même montant chaque année.",
};

// Détection du type de question
type QuestionType = "explanation" | "proposition" | "calculation" | "unknown";

function detectQuestionType(input: string): QuestionType {
    const lower = input.toLowerCase().trim();
    const explanationWords = ["quoi", "comment", "expliq", "comprend", "signifie", "définition", "c'est", "aide", "comprendre", "sens", "parler", "veut dire", "différence", "pourquoi"];
    const calculationWords = ["calcul", "combien", "montant", "formule", "pourcentage", "%", "total"];
    if (explanationWords.some(w => lower.includes(w))) return "explanation";
    if (calculationWords.some(w => lower.includes(w))) return "calculation";
    // Si l'input contient des mots liés à une activité/projet, c'est une proposition
    const propositionWords = ["je ", "mon ", "ma ", "mes ", "j'ai ", "je veux", "je vends", "je fais", "restaurant", "boutique", "commerce", "agricult", "machine", "véhicule", "emprunt", "banque", "loyer", "salaire", "formation", "site", "stock"];
    if (propositionWords.some(w => lower.includes(w))) return "proposition";
    return "unknown";
}

// Scoring : trouve le meilleur champ correspondant à l'input
function findBestField(input: string): { fieldId: string; score: number; rule: HelpRule | null } {
    const lower = input.toLowerCase().trim();
    let bestField = "";
    let bestScore = 0;
    let bestRule: HelpRule | null = null;

    for (const [fieldId, rules] of Object.entries(helpDatabase)) {
        for (const rule of rules) {
            const matchedKw = rule.keywords.filter(kw => lower.includes(kw)).length;
            const score = matchedKw * 10 + rule.keywords.filter(kw => lower.includes(kw)).reduce((acc, kw) => acc + kw.length, 0);
            if (score > bestScore) {
                bestScore = score;
                bestField = fieldId;
                bestRule = rule;
            }
        }
    }
    return { fieldId: bestField, score: bestScore, rule: bestRule };
}

// Fonction de lookup dans le classificateur d'objets
function classifyItem(input: string): { item: string; cls: ItemClass } | null {
    const lower = input.toLowerCase().trim();
    // Trier par longueur décroissante pour matcher les termes les plus longs d'abord
    const sortedItems = Object.keys(itemClassifier).sort((a, b) => b.length - a.length);
    for (const item of sortedItems) {
        if (lower.includes(item)) {
            return { item, cls: itemClassifier[item] };
        }
    }
    return null;
}

// Fonction d'analyse de la question — MOTEUR INTELLIGENT avec CLASSIFICATEUR
function analyzeQuestion(input: string, currentField: string): { answer: string; relatedField?: string } {
    const lower = input.toLowerCase().trim();
    const qType = detectQuestionType(input);
    const explanation = fieldExplanations[currentField] || "";

    // ★ ÉTAPE 0 : Vérifier le CLASSIFICATEUR en PREMIER (priorité absolue)
    const classified = classifyItem(lower);

    if (classified) {
        const { item, cls } = classified;
        const isCorrectField = cls.category === currentField;

        if (isCorrectField) {
            // L'objet appartient BIEN au champ actuel
            return {
                answer: `✅ **Oui, les ${item} font bien partie de ${cls.label}.**\n\n📌 **Pourquoi ?** ${cls.reason}\n\n📝 Tu peux saisir le montant dans le champ ci-dessus.`,
            };
        } else {
            // L'objet NE correspond PAS au champ actuel → CORRECTION
            const correctExplanation = fieldExplanations[cls.category] || "";
            return {
                answer: `❌ **Non, les ${item} ne font PAS partie de cette section.**\n\n📌 **C'est une erreur courante !** Les ${item} appartiennent à : **${cls.label}**\n\n**Pourquoi ?** ${cls.reason}\n\n${correctExplanation}`,
                relatedField: cls.category,
            };
        }
    }

    // ★ ÉTAPE 1 : Chercher le meilleur match dans la base (pour questions générales)
    const bestMatch = findBestField(lower);
    const matchedCurrentField = bestMatch.fieldId === currentField && bestMatch.score > 0;
    const matchedOtherField = bestMatch.fieldId && bestMatch.fieldId !== currentField && bestMatch.score > 0;

    // ★ ÉTAPE 2 : TYPE = EXPLICATION
    if (qType === "explanation") {
        if (matchedCurrentField && bestMatch.rule) {
            return {
                answer: `📖 **Explication :**\n${explanation}\n\n${bestMatch.rule.response}${bestMatch.rule.suggestion ? "\n\n💡 " + bestMatch.rule.suggestion : ""}`,
            };
        }
        return {
            answer: `📖 **Voici ce que signifie cette étape :**\n\n${explanation}\n\n💡 Si tu as une question plus précise, décris ton projet ou ta situation !`,
        };
    }

    // ★ ÉTAPE 3 : TYPE = PROPOSITION / CALCULATION
    if (qType === "proposition" || qType === "calculation") {
        if (matchedCurrentField && bestMatch.rule) {
            return {
                answer: `✅ **Bonne réponse !**\n\n${bestMatch.rule.response}${bestMatch.rule.suggestion ? "\n\n💡 " + bestMatch.rule.suggestion : ""}\n\n📝 Tu peux maintenant remplir le champ ci-dessus.`,
            };
        }
        if (matchedOtherField && bestMatch.rule) {
            const otherExplanation = fieldExplanations[bestMatch.fieldId] || "";
            return {
                answer: `🔄 **Pas tout à fait !** Ce que tu décris correspond plutôt à :\n\n**${fieldNames[bestMatch.fieldId]}**\n\n${otherExplanation}\n\n${bestMatch.rule.response}`,
                relatedField: bestMatch.fieldId,
            };
        }
        return {
            answer: `🤔 **Je ne suis pas sûr de comprendre.** Voici ce qu'il faut savoir :\n\n${explanation}\n\n💡 Reformule ta question, ou décris précisément ce que tu veux acheter ou faire.`,
        };
    }

    // ★ ÉTAPE 4 : TYPE = UNKNOWN → tenter un match
    if (bestMatch.score > 0 && bestMatch.rule) {
        if (bestMatch.fieldId === currentField) {
            return {
                answer: `${bestMatch.rule.response}${bestMatch.rule.suggestion ? "\n\n💡 " + bestMatch.rule.suggestion : ""}`,
            };
        } else {
            const otherExplanation = fieldExplanations[bestMatch.fieldId] || "";
            return {
                answer: `🔍 **Ce que tu décris correspond à :** ${fieldNames[bestMatch.fieldId]}\n\n${otherExplanation}\n\n${bestMatch.rule.response}`,
                relatedField: bestMatch.fieldId,
            };
        }
    }

    // ★ ÉTAPE 5 : Aucun match → explication par défaut
    return {
        answer: `ℹ️ **Aide pour cette étape :**\n\n${explanation}\n\n💡 Pose une question précise ou décris ton projet pour avoir une réponse adaptée !`,
    };
}

// ─── Étapes du wizard ─────────────────────────────────
interface StepDef {
    id: string;
    title: string;
    explanation: string;
    example: string;
    icon: React.ReactNode;
    suggestions: { value: string; label: string }[];
}

const stepDefs: StepDef[] = [
    {
        id: "investissementMateriel", title: "Investissement matériel",
        explanation: "C'est tout ce que tu dois acheter en équipements physiques pour démarrer ton activité. Ce sont les biens que tu peux toucher.",
        example: "Exemple : machines, véhicule de livraison, ordinateurs, réfrigérateurs, tables, chaises, outils...",
        icon: <Calculator size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "1000000", label: "1 000 000 FCFA" }, { value: "3000000", label: "3 000 000 FCFA" }, { value: "5000000", label: "5 000 000 FCFA" }, { value: "10000000", label: "10 000 000 FCFA" }, { value: "25000000", label: "25 000 000 FCFA" }],
    },
    {
        id: "investissementImateriel", title: "Investissement immatériel",
        explanation: "Ce sont les dépenses que tu fais mais qui ne sont pas des objets physiques. C'est de la connaissance, des droits ou des préparations.",
        example: "Exemple : formation professionnelle, site web, étude de marché, licences, brevets...",
        icon: <FileSpreadsheet size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "0", label: "Aucun" }, { value: "500000", label: "500 000 FCFA" }, { value: "1000000", label: "1 000 000 FCFA" }, { value: "2000000", label: "2 000 000 FCFA" }],
    },
    {
        id: "fondsDeRoulement", title: "Fonds de roulement de départ",
        explanation: "C'est l'argent liquide pour faire tourner ton activité pendant les premiers mois, avant de gagner de l'argent.",
        example: "Exemple : payer le loyer et les salaires des 3 premiers mois, premières matières premières...",
        icon: <PiggyBank size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "500000", label: "500 000 FCFA" }, { value: "1000000", label: "1 000 000 FCFA" }, { value: "2000000", label: "2 000 000 FCFA" }, { value: "5000000", label: "5 000 000 FCFA" }],
    },
    {
        id: "fondsPropres", title: "Fonds propres (ton argent)",
        explanation: "C'est l'argent que toi ou tes associés mettez personnellement dans le projet.",
        example: "Exemple : tes économies de 3 000 000 FCFA que tu investis dans ton projet...",
        icon: <CircleDollarSign size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "500000", label: "500 000 FCFA" }, { value: "1000000", label: "1 000 000 FCFA" }, { value: "3000000", label: "3 000 000 FCFA" }, { value: "5000000", label: "5 000 000 FCFA" }, { value: "10000000", label: "10 000 000 FCFA" }],
    },
    {
        id: "emprunt", title: "Montant de l'emprunt bancaire",
        explanation: "C'est le montant que tu demandes à la banque ou la microfinance. Tu devras rembourser avec des intérêts.",
        example: "Exemple : un prêt de 5 000 000 FCFA à la BIB pour acheter tes équipements...",
        icon: <Landmark size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "0", label: "Aucun emprunt" }, { value: "1000000", label: "1 000 000 FCFA" }, { value: "3000000", label: "3 000 000 FCFA" }, { value: "5000000", label: "5 000 000 FCFA" }, { value: "10000000", label: "10 000 000 FCFA" }],
    },
    {
        id: "tauxInteret", title: "Taux d'intérêt de l'emprunt (%)",
        explanation: "Le pourcentage que la banque te prend en plus quand tu rembourses. Plus le taux est élevé, plus tu paies cher.",
        example: "Exemple : si tu empruntes 1M FCFA à 10%, tu paies 100 000 FCFA d'intérêts par an.",
        icon: <Percent size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "5", label: "5% — Banque préférentiel" }, { value: "8", label: "8% — Banque standard" }, { value: "10", label: "10% — Taux courant" }, { value: "12", label: "12% — Microfinance" }, { value: "15", label: "15% — Taux élevé" }],
    },
    {
        id: "tauxSansRisque", title: "Taux sans risque (%)",
        explanation: "Ce que tu pourrais gagner sans risque, en plaçant ton argent en toute sécurité. Sert de base pour les calculs.",
        example: "Exemple : les obligations BCEAO rapportent ~3,5%/an. C'est le minimum à dépasser.",
        icon: <TrendingUp size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "2.5", label: "2.5%" }, { value: "3", label: "3%" }, { value: "3.5", label: "3.5%" }, { value: "4", label: "4%" }],
    },
    {
        id: "primeSectorielle", title: "Prime de risque secteur (%)",
        explanation: "Un bonus de risque lié à ton secteur. Un secteur instable (agriculture) a besoin d'une prime plus élevée.",
        example: "Exemple : commerce = 3%, agriculture = 5%, technologie = 7%.",
        icon: <BarChart3 size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "1", label: "1% — Très stable" }, { value: "3", label: "3% — Modéré" }, { value: "5", label: "5% — Risqué" }, { value: "7", label: "7% — Très risqué" }],
    },
    {
        id: "primePays", title: "Prime de risque pays (%)",
        explanation: "Un bonus qui tient compte du risque du pays (instabilité, inflation, change...).",
        example: "Exemple : France = 1-2%, Burkina Faso = 4%, pays en crise = 8%.",
        icon: <CreditCard size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "2", label: "2% — Pays stable" }, { value: "4", label: "4% — Pays modéré" }, { value: "6", label: "6% — Risqué" }, { value: "8", label: "8% — Très risqué" }],
    },
    {
        id: "tauxIS", title: "Impôt sur les sociétés — IS (%)",
        explanation: "Le pourcentage de tes bénéfices que tu paies à l'État. Obligatoire si ton entreprise fait du bénéfice.",
        example: "Exemple : bénéfice 1M FCFA, IS 25% → tu paies 250 000 FCFA d'impôt.",
        icon: <Receipt size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "25", label: "25% — IS standard" }, { value: "30", label: "30% — IS élevé" }, { value: "20", label: "20% — IS réduit" }, { value: "0", label: "0% — Exonéré" }],
    },
    {
        id: "dureeAmortissement", title: "Durée d'amortissement (années)",
        explanation: "Le nombre d'années pour répartir le coût de tes investissements dans tes comptes.",
        example: "Exemple : véhicule 5M amorti sur 5 ans = 1M/an dans tes charges.",
        icon: <Calculator size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "3", label: "3 ans" }, { value: "5", label: "5 ans" }, { value: "7", label: "7 ans" }, { value: "10", label: "10 ans" }],
    },
    {
        id: "chargesVariables", title: "Charges variables (% du CA)",
        explanation: "Les dépenses qui changent avec tes ventes. Plus tu vends, plus elles augmentent.",
        example: "Exemple : CA 10M, charges variables 55% = 5,5M (matières premières, emballages...).",
        icon: <TrendingUp size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "30", label: "30% — Faible" }, { value: "45", label: "45% — Modéré" }, { value: "55", label: "55% — Standard" }, { value: "65", label: "65% — Élevé" }, { value: "75", label: "75% — Très élevé" }],
    },
    {
        id: "chargesFixes", title: "Charges fixes annuelles (FCFA)",
        explanation: "Les dépenses que tu paies chaque année, que tu vendes beaucoup ou peu.",
        example: "Exemple : loyer 600K + salaires 1,2M + assurance 200K = 2M FCFA/an.",
        icon: <CreditCard size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "500000", label: "500 000 FCFA" }, { value: "1000000", label: "1 000 000 FCFA" }, { value: "2000000", label: "2 000 000 FCFA" }, { value: "5000000", label: "5 000 000 FCFA" }],
    },
    {
        id: "chargesFinancieres", title: "Charges financières annuelles (FCFA)",
        explanation: "Ce que tu paies chaque année à la banque pour ton emprunt (intérêts seulement).",
        example: "Exemple : emprunt 5M à 8% = charges financières ~400 000 FCFA/an.",
        icon: <Landmark size={28} className="text-primary-yellow" />,
        suggestions: [{ value: "0", label: "Aucune" }, { value: "200000", label: "200 000 FCFA" }, { value: "400000", label: "400 000 FCFA" }, { value: "800000", label: "800 000 FCFA" }],
    },
];

// ─── Instructions spécifiques par section ─────────────────
const stepHints: Record<string, { inputHint: string; helpTitle: string; helpPlaceholder: string }> = {
    investissementMateriel: {
        inputHint: "📝 Écris le nom puis le montant. Ex: Machine à coudre — 500000",
        helpTitle: "📦 Assistant — Investissement matériel",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « j'ai un restaurant, quels équipements ? »",
    },
    investissementImateriel: {
        inputHint: "📝 Écris le nom puis le montant. Ex: Formation comptabilité — 300000",
        helpTitle: "📋 Assistant — Investissement immatériel",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « je veux créer un site web, ça coûte combien ? »",
    },
    fondsDeRoulement: {
        inputHint: "📝 Écris le nom puis le montant. Ex: Stock de départ — 1000000",
        helpTitle: "💰 Assistant — Fonds de roulement",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « loyer 100K + salaires 300K, combien prévoir ? »",
    },
    fondsPropres: {
        inputHint: "📝 Écris le nom puis le montant. Ex: Mes économies — 3000000",
        helpTitle: "💵 Assistant — Fonds propres",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « j'ai 2M d'économies, c'est assez ? »",
    },
    emprunt: {
        inputHint: "📝 Écris le nom puis le montant. Ex: Prêt BIB — 5000000",
        helpTitle: "🏦 Assistant — Emprunt bancaire",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « combien je peux emprunter ? »",
    },
    tauxInteret: {
        inputHint: "📝 Écris le taux proposé par ta banque. Ex: 8",
        helpTitle: "📊 Assistant — Taux d'intérêt",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « ma banque propose 10%, c'est normal ? »",
    },
    tauxSansRisque: {
        inputHint: "📝 Écris le taux sans risque. Ex: 3.5",
        helpTitle: "📈 Assistant — Taux sans risque",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « quel taux pour le Burkina ? »",
    },
    primeSectorielle: {
        inputHint: "📝 Écris ton secteur puis la prime. Ex: Agriculture — 5",
        helpTitle: "🏢 Assistant — Prime sectorielle",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « j'ai un restaurant, quelle prime ? »",
    },
    primePays: {
        inputHint: "📝 Écris ton pays puis la prime. Ex: Burkina Faso — 4",
        helpTitle: "🌍 Assistant — Prime pays",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « je suis au Mali, quelle prime ? »",
    },
    tauxIS: {
        inputHint: "📝 Écris le taux d'IS. Ex: 25",
        helpTitle: "🧾 Assistant — Impôt (IS)",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « je suis exonéré, je mets combien ? »",
    },
    dureeAmortissement: {
        inputHint: "📝 Écris l'équipement puis la durée. Ex: Véhicule — 5",
        helpTitle: "📅 Assistant — Durée d'amortissement",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « j'ai un camion, combien d'années ? »",
    },
    chargesVariables: {
        inputHint: "📝 Écris le nom puis le pourcentage. Ex: Matières premières — 55",
        helpTitle: "📊 Assistant — Charges variables",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « je vends du tissu, quel pourcentage ? »",
    },
    chargesFixes: {
        inputHint: "📝 Écris le nom puis le montant annuel. Ex: Loyer + salaires — 2000000",
        helpTitle: "🏠 Assistant — Charges fixes",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « loyer 50K + 2 employés 150K chacun, ça fait combien ? »",
    },
    chargesFinancieres: {
        inputHint: "📝 Écris le nom puis le montant annuel. Ex: Intérêts emprunt — 400000",
        helpTitle: "💳 Assistant — Charges financières",
        helpPlaceholder: "Pose ta question : « c'est quoi ? » ou « j'ai emprunté 5M à 8%, ça fait combien ? »",
    },
};

// ─── Composant principal ─────────────────────────────────
export default function BusinessPlanWizard({ initialData, onComplete, onBack }: BusinessPlanWizardProps) {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [nbAnnees, setNbAnnees] = useState(3);
    const [caAnnees, setCaAnnees] = useState<number[]>(initialData?.caAnnees ? JSON.parse(initialData.caAnnees) : [0, 0, 0]);
    const [data, setData] = useState<BusinessPlanData>(initialData || {
        investissementMateriel: "", investissementImateriel: "", fondsDeRoulement: "",
        fondsPropres: "", emprunt: "", tauxInteret: "", tauxSansRisque: "",
        primeSectorielle: "", primePays: "", tauxIS: "", dureeAmortissement: "",
        caAnnees: "[]", chargesVariables: "", chargesFixes: "", chargesFinancieres: "",
    });
    const [mode, setMode] = useState<"wizard" | "review">("wizard");
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editLineItems, setEditLineItems] = useState<Array<{ desig: string; montant: string }>>([]);
    // Assistant
    const [showHelp, setShowHelp] = useState(false);
    const [helpQuery, setHelpQuery] = useState("");
    const [helpResponse, setHelpResponse] = useState<{ text: string; relatedField?: string } | null>(null);
    const [helpLoading, setHelpLoading] = useState(false);
    const helpResponseRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [lineItems, setLineItems] = useState<Record<string, Array<{ desig: string; montant: string }>>>({});

    // Auto-scroll vers la réponse quand elle apparaît
    useEffect(() => {
        if (helpResponse && !helpLoading && helpResponseRef.current) {
            helpResponseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [helpResponse, helpLoading]);

    const totalInputSteps = stepDefs.length;
    const caStepIndex = totalInputSteps;
    const totalWizardSteps = caStepIndex + 1;
    const progress = ((step + 1) / (totalWizardSteps + 1)) * 100;
    const currentStep = step < totalInputSteps ? stepDefs[step] : null;
    const isCAStep = step === caStepIndex;

    const getVal = (field: string) => (data as unknown as Record<string, string>)[field] || "";
    const setVal = (field: string, value: string) => setData((prev) => ({ ...prev, [field]: value }));
    const num = (v: string) => parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

    const canGoNext = () => {
        if (isCAStep) return caAnnees.some((v) => v > 0);
        if (!currentStep) return false;
        return getVal(currentStep.id).trim() !== "";
    };

    const handleHelpSubmit = async () => {
        if (!helpQuery.trim()) return;
        setHelpLoading(true);
        const currentField = currentStep?.id || "";
        const currentTitle = currentStep?.title || "";
        try {
            const res = await fetch("/api/gemini-help", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: helpQuery, sectionId: currentField, sectionTitle: currentTitle }),
            });
            if (res.ok) {
                const data = await res.json();
                setHelpResponse({ text: data.response });
            } else {
                // Fallback vers le moteur local
                const result = analyzeQuestion(helpQuery, currentField);
                setHelpResponse({ text: result.answer, relatedField: result.relatedField });
            }
        } catch {
            // Fallback vers le moteur local
            const result = analyzeQuestion(helpQuery, currentField);
            setHelpResponse({ text: result.answer, relatedField: result.relatedField });
        }
        setHelpLoading(false);
    };

    const resetHelp = () => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); };
    const handleNext = () => { setDirection("forward"); resetHelp(); if (isCAStep) setMode("review"); else setStep(step + 1); };
    const handlePrev = () => { setDirection("backward"); resetHelp(); if (mode === "review") setMode("wizard"); else if (step > 0) setStep(step - 1); };

    // Calculs
    const calc = () => {
        const investTotal = num(data.investissementMateriel) + num(data.investissementImateriel) + num(data.fondsDeRoulement);
        const finTotal = num(data.fondsPropres) + num(data.emprunt);
        const tauxActu = num(data.tauxSansRisque) + num(data.primeSectorielle) + num(data.primePays);
        const amortAnnuel = investTotal / (num(data.dureeAmortissement) || 5);
        const txVar = num(data.chargesVariables) / 100;
        const txFixe = num(data.chargesFixes);
        const txFi = num(data.chargesFinancieres);
        const txIS = num(data.tauxIS) / 100;
        const txActu = tauxActu / 100;
        let cumulFNT = 0;
        let delaiRecup = -1;
        const yearlyResults = caAnnees.map((ca, i) => {
            const cv = ca * txVar;
            const margeBrute = ca - cv;
            const bai = margeBrute - txFixe - txFi - amortAnnuel;
            const impot = bai > 0 ? bai * txIS : 0;
            const benefNet = bai - impot;
            const fnt = benefNet + amortAnnuel;
            const fntActu = fnt / Math.pow(1 + txActu, i + 1);
            cumulFNT += fntActu;
            if (delaiRecup === -1 && cumulFNT >= investTotal) delaiRecup = i + 1;
            return { annee: i + 1, ca, cv, margeBrute, bai, impot, benefNet, fnt, fntActu, cumulFNT, tauxMarge: ca > 0 ? (benefNet / ca * 100) : 0 };
        });
        const van = cumulFNT - investTotal;
        const benefTotal = yearlyResults.reduce((s, r) => s + r.benefNet, 0);
        const roi = investTotal > 0 ? (benefTotal / investTotal * 100) : 0;
        const ip = investTotal > 0 ? cumulFNT / investTotal : 0;
        let tri = 0;
        for (let t = 1; t <= 100; t += 0.5) {
            let npv = -investTotal;
            caAnnees.forEach((ca, i) => {
                const cv2 = ca * txVar;
                const bai2 = ca - cv2 - txFixe - txFi - amortAnnuel;
                const impot2 = bai2 > 0 ? bai2 * txIS : 0;
                npv += ((bai2 - impot2) + amortAnnuel) / Math.pow(1 + t / 100, i + 1);
            });
            if (npv < 0) { tri = t; break; }
        }
        return { investTotal, finTotal, tauxActu, amortAnnuel, van, roi, tri, ip, delaiRecup, benefTotal, yearlyResults };
    };

    const reviewFields = [
        { id: "investissementMateriel", label: "Investissement matériel", icon: <Calculator size={16} className="text-primary-yellow" /> },
        { id: "investissementImateriel", label: "Investissement immatériel", icon: <FileSpreadsheet size={16} className="text-primary-yellow" /> },
        { id: "fondsDeRoulement", label: "Fonds de roulement", icon: <PiggyBank size={16} className="text-primary-yellow" /> },
        { id: "fondsPropres", label: "Fonds propres", icon: <CircleDollarSign size={16} className="text-primary-yellow" /> },
        { id: "emprunt", label: "Montant de l'emprunt", icon: <Landmark size={16} className="text-primary-yellow" /> },
        { id: "tauxInteret", label: "Taux d'intérêt", icon: <Percent size={16} className="text-primary-yellow" />, suffix: "%" },
        { id: "tauxSansRisque", label: "Taux sans risque", icon: <TrendingUp size={16} className="text-primary-yellow" />, suffix: "%" },
        { id: "primeSectorielle", label: "Prime sectorielle", icon: <BarChart3 size={16} className="text-primary-yellow" />, suffix: "%" },
        { id: "primePays", label: "Prime pays", icon: <CreditCard size={16} className="text-primary-yellow" />, suffix: "%" },
        { id: "tauxIS", label: "Impôt (IS)", icon: <Receipt size={16} className="text-primary-yellow" />, suffix: "%" },
        { id: "dureeAmortissement", label: "Durée amortissement", icon: <Calculator size={16} className="text-primary-yellow" />, suffix: " ans" },
        { id: "chargesVariables", label: "Charges variables", icon: <TrendingUp size={16} className="text-primary-yellow" />, suffix: " % du CA" },
        { id: "chargesFixes", label: "Charges fixes annuelles", icon: <CreditCard size={16} className="text-primary-yellow" /> },
        { id: "chargesFinancieres", label: "Charges financières", icon: <Landmark size={16} className="text-primary-yellow" /> },
    ];

    const displayVal = (id: string) => {
        const v = getVal(id); const n = num(v); const field = reviewFields.find(f => f.id === id);
        if (field?.suffix) return `${v}${field.suffix}`;
        if (n > 0) return `${fmt(n)} FCFA`;
        return v || "—";
    };
    const monetaryFieldIds = ["investissementMateriel", "investissementImateriel", "fondsDeRoulement", "fondsPropres", "emprunt", "chargesFixes", "chargesFinancieres"];
    const isMonetaryField = (id: string) => monetaryFieldIds.includes(id);

    const startEdit = (fieldId: string) => {
        setEditingField(fieldId);
        const v = getVal(fieldId);
        setEditValue(v);
        const stored = lineItems[fieldId];
        if (stored && stored.length > 0 && stored.some(it => it.desig || it.montant)) {
            setEditLineItems(stored.map(it => ({ ...it })));
        } else {
            setEditLineItems([{ desig: "", montant: v || "" }]);
        }
    };
    const confirmEdit = () => {
        if (editingField) {
            if (isMonetaryField(editingField)) {
                const sum = editLineItems.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0);
                setVal(editingField, sum > 0 ? sum.toString() : "");
                setLineItems(prev => ({ ...prev, [editingField!]: editLineItems.map(it => ({ ...it })) }));
            } else {
                if (editValue.trim()) setVal(editingField, editValue);
            }
        }
        setEditingField(null); setEditValue(""); setEditLineItems([]);
    };

    // ═══════════════════════════════════════════════════════
    //  MODE REVIEW
    // ═══════════════════════════════════════════════════════
    if (mode === "review") {
        const results = calc();
        return (
            <div className="fixed inset-0 bg-pastel flex flex-col z-50">
                <div className="relative overflow-hidden shrink-0">
                    <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                        <button onClick={handlePrev} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-black text-white tracking-wide">Plan d'affaires</h1>
                            <p className="text-white/70 text-xs font-bold">Section 2 — Résumé & Modification</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <FolderKanban size={22} className="text-primary-yellow" />
                        </div>
                    </div>
                    <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
                </div>
                <div className="flex-1 overflow-y-auto px-5 pt-2 pb-5">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Invest. total</p>
                            <p className="text-sm font-black text-slate-800">{fmt(results.investTotal)}</p>
                            <p className="text-[10px] text-slate-500">FCFA</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Financement</p>
                            <p className="text-sm font-black text-slate-800">{fmt(results.finTotal)}</p>
                            <p className="text-[10px] text-slate-500">FCFA</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Taux actualisation</p>
                            <p className="text-sm font-black text-vibrant-blue">{results.tauxActu.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Amort. annuel</p>
                            <p className="text-sm font-black text-slate-800">{fmt(results.amortAnnuel)}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-vibrant-blue to-blue-700 rounded-2xl p-4 mb-4 text-white shadow-lg">
                        <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-white/80">📊 Indicateurs clés</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] text-white/70 font-bold">VAN</p>
                                <p className={`text-lg font-black ${results.van >= 0 ? "text-green-300" : "text-red-300"}`}>{results.van >= 0 ? "+" : ""}{fmt(results.van)}</p>
                                <p className="text-[9px] text-white/50">{results.van >= 0 ? "✅ Rentable" : "⚠️ Non rentable"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/70 font-bold">TRI</p>
                                <p className="text-lg font-black text-primary-yellow">{results.tri.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/70 font-bold">ROI</p>
                                <p className="text-lg font-black">{results.roi.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/70 font-bold">IP</p>
                                <p className="text-lg font-black">{results.ip.toFixed(2)}</p>
                                <p className="text-[9px] text-white/50">{results.ip >= 1 ? "✅ IP>1 = bon" : "⚠️ IP<1"}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20">
                            <p className="text-[10px] text-white/70 font-bold">⏱ Délai récupération</p>
                            <p className="text-sm font-black">{results.delaiRecup > 0 ? `${results.delaiRecup} an(s)` : "Non atteint"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-blue-200" />
                        <span className="text-xs font-black text-vibrant-blue uppercase tracking-widest">Données (✏️ pour modifier)</span>
                        <div className="h-px flex-1 bg-blue-200" />
                    </div>
                    <div className="space-y-2">
                        {reviewFields.map((field) => {
                            const isEditing = editingField === field.id;
                            const isMon = isMonetaryField(field.id);
                            const fieldItems = lineItems[field.id] || [];
                            const hasDetail = isMon && fieldItems.some(it => it.desig.trim() || parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) > 0);
                            return (
                                <div key={field.id} className="bg-white rounded-2xl p-3 shadow-sm border border-black/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">{field.icon}</div>
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{field.label}</span>
                                        </div>
                                        {!isEditing && <button onClick={() => startEdit(field.id)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 group" aria-label="Modifier"><Pencil size={13} className="text-slate-400 group-hover:text-vibrant-blue" /></button>}
                                    </div>
                                    {isEditing ? (
                                        isMon ? (
                                            <div className="space-y-2 mt-1">
                                                {editLineItems.map((item, idx) => (
                                                    <div key={idx} className="flex gap-1.5">
                                                        <input type="text" value={item.desig} onChange={(e) => { const n = editLineItems.map((it, i) => i === idx ? { ...it, desig: e.target.value } : it); setEditLineItems(n); }} placeholder="Désignation" className="flex-1 p-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-vibrant-blue" />
                                                        <input type="text" inputMode="decimal" value={item.montant} onChange={(e) => { const n = editLineItems.map((it, i) => i === idx ? { ...it, montant: e.target.value } : it); setEditLineItems(n); }} placeholder="Montant" className="w-24 p-2 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-vibrant-blue text-center" />
                                                        {editLineItems.length > 1 && (
                                                            <button onClick={() => { const n = editLineItems.filter((_, i) => i !== idx); if (n.length === 0) n.push({ desig: "", montant: "" }); setEditLineItems(n); }} className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 active:scale-95 transition-all" title="Supprimer"><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => setEditLineItems([...editLineItems, { desig: "", montant: "" }])} className="w-full py-1.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-[10px] font-bold text-vibrant-blue flex items-center justify-center gap-1 active:scale-95 transition-all"><Plus size={12} /> Ajouter</button>
                                                {editLineItems.some(it => parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) > 0) && (
                                                    <div className="flex items-center justify-between bg-green-50 rounded-xl p-2 border border-green-200">
                                                        <span className="text-[10px] font-black text-green-700 uppercase">Total</span>
                                                        <span className="text-sm font-black text-green-700">{fmt(editLineItems.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0))} FCFA</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={confirmEdit} className="flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 bg-green-500 text-white"><Check size={13} /> OK</button>
                                                    <button onClick={() => { setEditingField(null); setEditLineItems([]); }} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"><X size={13} /> Annuler</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 mt-1">
                                                <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Valeur" className="w-full p-2.5 rounded-xl border-2 border-vibrant-blue bg-blue-50/50 text-sm font-bold text-slate-800 outline-none" autoFocus />
                                                <div className="flex gap-2">
                                                    <button onClick={confirmEdit} disabled={!editValue.trim()} className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 ${editValue.trim() ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}><Check size={13} /> OK</button>
                                                    <button onClick={() => setEditingField(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"><X size={13} /> Annuler</button>
                                                </div>
                                            </div>
                                        )
                                    ) : hasDetail ? (
                                        <div className="pl-8 space-y-0.5">
                                            {fieldItems.map((item, idx) => (
                                                (item.desig || item.montant) ? (
                                                    <div key={idx} className="flex justify-between text-[11px]">
                                                        <span className="text-slate-500 font-semibold truncate mr-2">{item.desig || "—"}</span>
                                                        <span className="font-bold text-slate-800 whitespace-nowrap">{item.montant ? (() => { const n = parseFloat(item.montant.replace(/[^\d.,]/g, "").replace(",", ".")); return n > 0 ? `${fmt(n)} FCFA` : item.montant; })() : "—"}</span>
                                                    </div>
                                                ) : null
                                            ))}
                                            <div className="flex justify-between border-t border-slate-100 pt-1 mt-1">
                                                <span className="text-[10px] font-black text-green-700 uppercase">Total</span>
                                                <span className="text-sm font-black text-vibrant-blue">{displayVal(field.id)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pl-8 flex items-center justify-between">
                                            <p className="text-[11px] text-slate-500 font-semibold">{getVal(field.id)}</p>
                                            <p className="text-sm font-black text-vibrant-blue">{displayVal(field.id)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-black/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp size={16} className="text-primary-yellow" /></div>
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">CA par année</span>
                            </div>
                            <div className="space-y-1.5 pl-8">
                                {caAnnees.map((val, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-[11px] font-black text-white bg-vibrant-blue rounded-full w-6 h-6 flex items-center justify-center shrink-0">A{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-800">{fmt(val)} FCFA</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 mt-5">
                        <div className="h-px flex-1 bg-blue-200" />
                        <span className="text-xs font-black text-vibrant-blue uppercase tracking-widest">Détail par année</span>
                        <div className="h-px flex-1 bg-blue-200" />
                    </div>
                    <div className="space-y-2">
                        {results.yearlyResults.map((r) => (
                            <div key={r.annee} className="bg-white rounded-2xl p-3 shadow-sm border border-black/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black text-white bg-vibrant-blue rounded-full w-7 h-7 flex items-center justify-center">A{r.annee}</span>
                                    <span className="text-[11px] font-bold text-slate-700">CA : {fmt(r.ca)} FCFA</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                    <span className="text-slate-600">Marge brute : <b className="text-slate-800">{fmt(r.margeBrute)}</b></span>
                                    <span className="text-slate-600">BAI : <b className="text-slate-800">{fmt(r.bai)}</b></span>
                                    <span className="text-slate-600">Impôt : <b className="text-red-500">{fmt(r.impot)}</b></span>
                                    <span className="text-slate-600">Bénéfice net : <b className={r.benefNet >= 0 ? "text-green-600" : "text-red-500"}>{fmt(r.benefNet)}</b></span>
                                    <span className="text-slate-600">Taux marge : <b className="text-vibrant-blue">{r.tauxMarge.toFixed(1)}%</b></span>
                                    <span className="text-slate-600">FNT actu. : <b className="text-slate-800">{fmt(r.fntActu)}</b></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 flex gap-4 shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
                    <button onClick={handlePrev} className="flex-1 py-3.5 rounded-2xl font-extrabold text-slate-700 bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"><ArrowLeft size={20} /> Modifier</button>
                    <button onClick={() => {
                        const c = calc();
                        onComplete({
                            ...data,
                            caAnnees: JSON.stringify(caAnnees),
                            lineItemsJson: JSON.stringify(lineItems),
                            computed: {
                                investissementMateriel: num(data.investissementMateriel),
                                investissementImateriel: num(data.investissementImateriel),
                                fondsDeRoulement: num(data.fondsDeRoulement),
                                fondsPropres: num(data.fondsPropres),
                                emprunt: num(data.emprunt),
                                tauxInteret: num(data.tauxInteret),
                                tauxSansRisque: num(data.tauxSansRisque),
                                primeSectorielle: num(data.primeSectorielle),
                                primePays: num(data.primePays),
                                tauxIS: num(data.tauxIS),
                                dureeAmortissement: num(data.dureeAmortissement),
                                chargesVariables: num(data.chargesVariables),
                                chargesFixes: num(data.chargesFixes),
                                chargesFinancieres: num(data.chargesFinancieres),
                                investTotal: c.investTotal,
                                finTotal: c.finTotal,
                                tauxActu: c.tauxActu,
                                amortAnnuel: c.amortAnnuel,
                                van: c.van,
                                roi: c.roi,
                                tri: c.tri,
                                ip: c.ip,
                                delaiRecup: c.delaiRecup,
                            }
                        });
                    }} className="flex-1 py-3.5 rounded-2xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-500/30"><Save size={20} /> Enregistrer</button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════
    //  MODE WIZARD
    // ═══════════════════════════════════════════════════════
    return (
        <div className="fixed inset-0 bg-pastel flex flex-col z-50">
            <div className="textured-navy p-4 flex items-center gap-3 shrink-0">
                <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-white tracking-wide">Plan d'affaires</h1>
                    <p className="text-white/70 text-xs font-bold">Section 2 — Plan d'affaires chiffré</p>
                </div>
                <span className="text-primary-yellow font-extrabold text-sm">{step + 1}/{totalWizardSteps + 1}</span>
            </div>
            <div className="h-2 bg-white/50 shrink-0">
                <div className="h-full bg-gradient-to-r from-primary-yellow to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div key={step} className={`flex-1 flex flex-col p-5 overflow-y-auto ${direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>

                    {isCAStep && (
                        <>
                            <div className="flex justify-center mb-3">
                                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"><TrendingUp size={28} className="text-primary-yellow" /></div>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 text-center mb-1">Chiffre d'affaires prévisionnel</h2>
                            <p className="text-center text-slate-700 text-xs font-semibold mb-1">C'est ce que tu penses gagner chaque année.</p>
                            <div className="flex items-center gap-2 mb-4 justify-center">
                                <span className="text-xs font-bold text-slate-700">Années :</span>
                                {[2, 3, 5, 7, 10].map((n) => (
                                    <button key={n} onClick={() => { setNbAnnees(n); setCaAnnees(Array(n).fill(0)); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${nbAnnees === n ? "border-vibrant-blue bg-blue-50 text-vibrant-blue" : "border-slate-200 bg-white text-slate-600"}`}>{n}</button>
                                ))}
                            </div>
                            <div className="space-y-3">
                                {caAnnees.map((val, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-black/5">
                                        <span className="text-xs font-black text-white bg-vibrant-blue rounded-full w-8 h-8 flex items-center justify-center shrink-0">A{i + 1}</span>
                                        <input type="text" inputMode="numeric" value={val || ""} placeholder="0" onChange={(e) => { const v = parseInt(e.target.value.replace(/[^\d]/g, "")) || 0; const arr = [...caAnnees]; arr[i] = v; setCaAnnees(arr); }} className="flex-1 p-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-vibrant-blue" />
                                        <span className="text-xs text-slate-600 font-bold">FCFA</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {currentStep && !isCAStep && (
                        <>
                            <div className="flex justify-center mb-3">
                                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">{currentStep.icon}</div>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 text-center mb-2">{currentStep.title}</h2>

                            <div className="bg-blue-50 rounded-2xl p-4 mb-3 border border-blue-100">
                                <div className="flex items-start gap-2">
                                    <Info size={16} className="text-vibrant-blue shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[13px] text-slate-800 font-semibold leading-relaxed">{currentStep.explanation}</p>
                                        <p className="text-[12px] text-vibrant-blue font-bold mt-2 leading-relaxed">{currentStep.example}</p>
                                    </div>
                                </div>
                            </div>

                            {currentStep.suggestions.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-bold text-slate-600 mb-2">💡 Choisis ou tape ta valeur :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currentStep.suggestions.map((sug) => (
                                            <button key={sug.value} onClick={() => { setVal(currentStep.id, sug.value); setLineItems(prev => ({ ...prev, [currentStep.id]: [{ desig: "", montant: sug.value }] })); }} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${getVal(currentStep.id) === sug.value ? "border-vibrant-blue bg-blue-50 text-vibrant-blue shadow-md shadow-blue-500/20" : "border-slate-200 bg-white text-slate-700"}`}>{sug.label}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Aide IA (bouton compact au-dessus du champ) ── */}
                            <div className="mb-3">
                                {!showHelp ? (
                                    <button onClick={() => { setShowHelp(true); setHelpQuery(""); setHelpResponse(null); }} className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-xs font-bold text-amber-600 flex items-center justify-center gap-2 transition-colors active:scale-95">
                                        <Lightbulb size={14} /> 💡 Obtenir de l'aide IA
                                    </button>
                                ) : (
                                    <div className="bg-amber-50 rounded-xl border-2 border-amber-200 overflow-hidden">
                                        <div className="bg-amber-100/80 px-3 py-1.5 flex items-center justify-between border-b border-amber-200">
                                            <div className="flex items-center gap-1.5">
                                                <Lightbulb size={12} className="text-primary-yellow" />
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{stepHints[currentStep.id]?.helpTitle || "Assistant"}</span>
                                            </div>
                                            <button onClick={() => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); }} className="text-amber-400 hover:text-amber-600" title="Fermer"><X size={12} /></button>
                                        </div>
                                        <div className="p-2.5">
                                            <div className="flex gap-1.5">
                                                <input type="text" value={helpQuery} onChange={(e) => { setHelpQuery(e.target.value); setHelpResponse(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleHelpSubmit(); }} placeholder={stepHints[currentStep.id]?.helpPlaceholder || "Pose ta question..."} className="flex-1 p-2 rounded-lg border-2 border-slate-200 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400" />
                                                <button onClick={handleHelpSubmit} disabled={!helpQuery.trim()} className={`px-3 py-2 rounded-lg flex items-center justify-center ${helpQuery.trim() ? "bg-amber-400 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}><Send size={14} /></button>
                                            </div>
                                            {helpLoading && (
                                                <div className="mt-2 p-2 rounded-lg text-[10px] font-semibold flex items-center gap-2 bg-amber-50 border border-amber-200">
                                                    <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-amber-700">🤖 L'IA réfléchit...</span>
                                                </div>
                                            )}
                                            {helpResponse && !helpLoading && (
                                                <div ref={helpResponseRef} className={`help-response-scroll mt-2 p-3 rounded-lg text-[12px] font-semibold leading-relaxed ${helpResponse.relatedField ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"}`} style={{ maxHeight: '150px', overflow: 'scroll', scrollbarWidth: 'thin' }}>
                                                    <p className="whitespace-pre-line text-slate-800">{helpResponse.text}</p>
                                                    {helpResponse.relatedField && (
                                                        <p className="mt-1 text-[10px] font-bold text-vibrant-blue">📌 Pas le champ actuel → continue le wizard pour le trouver.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(() => {
                                const isTauxField = ["tauxInteret", "tauxSansRisque", "primeSectorielle", "primePays", "tauxIS"].includes(currentStep.id);
                                const isAnneesField = currentStep.id === "dureeAmortissement";
                                const isPourcentageField = currentStep.id === "chargesVariables";
                                const unit = isTauxField || isPourcentageField ? "%" : isAnneesField ? "ans" : "FCFA";
                                const isMonetaryField = !isTauxField && !isAnneesField && !isPourcentageField;
                                const placeholder = isTauxField || isPourcentageField ? "Taux" : isAnneesField ? "Durée" : "Montant";

                                // Get or initialize items for this field
                                const stored = lineItems[currentStep.id];
                                const items: Array<{ desig: string; montant: string }> = (stored && stored.length > 0)
                                    ? stored
                                    : (() => {
                                        const v = getVal(currentStep.id);
                                        if (!v) return [{ desig: "", montant: "" }];
                                        if (v.includes(" — ")) {
                                            const p = v.split(" — ");
                                            return [{ desig: p[0].trim(), montant: p.slice(1).join(" — ").trim() }];
                                        }
                                        return [{ desig: "", montant: v }];
                                    })();

                                const syncToData = (newItems: Array<{ desig: string; montant: string }>) => {
                                    if (isMonetaryField) {
                                        const sum = newItems.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0);
                                        setVal(currentStep.id, sum > 0 ? sum.toString() : "");
                                    } else {
                                        setVal(currentStep.id, newItems[0]?.montant || "");
                                    }
                                };

                                const updateItem = (idx: number, key: "desig" | "montant", value: string) => {
                                    const newItems = items.map((it, i) => i === idx ? { ...it, [key]: value } : it);
                                    setLineItems(prev => ({ ...prev, [currentStep.id]: newItems }));
                                    syncToData(newItems);
                                };

                                const addItem = () => {
                                    const newItems = [...items, { desig: "", montant: "" }];
                                    setLineItems(prev => ({ ...prev, [currentStep.id]: newItems }));
                                };

                                const removeItem = (idx: number) => {
                                    const newItems = items.filter((_: { desig: string; montant: string }, i: number) => i !== idx);
                                    if (newItems.length === 0) newItems.push({ desig: "", montant: "" });
                                    setLineItems(prev => ({ ...prev, [currentStep.id]: newItems }));
                                    syncToData(newItems);
                                };

                                return (
                                    <div className="space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.desig}
                                                    onChange={(e) => updateItem(idx, "desig", e.target.value)}
                                                    placeholder="Désignation"
                                                    className="flex-1 p-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-vibrant-blue transition-all"
                                                    autoFocus={idx === 0}
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.montant}
                                                    onChange={(e) => updateItem(idx, "montant", e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (isMonetaryField && idx === items.length - 1) addItem();
                                                            else if (canGoNext()) handleNext();
                                                        }
                                                    }}
                                                    placeholder={placeholder}
                                                    className="w-32 p-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-vibrant-blue transition-all text-center"
                                                />
                                                {items.length > 1 && (
                                                    <button onClick={() => removeItem(idx)} className="p-3 rounded-2xl bg-red-50 text-red-400 hover:bg-red-100 active:scale-95 transition-all" title="Supprimer">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {isMonetaryField && (
                                            <button onClick={addItem} className="w-full py-2.5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-xs font-bold text-vibrant-blue flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-blue-100/50">
                                                <Plus size={14} /> Ajouter un élément
                                            </button>
                                        )}
                                        {isMonetaryField && items.some(it => parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) > 0) && (() => {
                                            const totalSum = items.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0);
                                            return (
                                                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-3 border-2 border-green-200">
                                                    <span className="text-xs font-black text-green-700 uppercase tracking-wider">💰 Total</span>
                                                    <span className="text-base font-black text-green-700">{fmt(totalSum)} FCFA</span>
                                                </div>
                                            );
                                        })()}
                                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase">{unit}</p>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>

            <div className="p-5 flex gap-4 shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
                {step > 0 ? (
                    <button onClick={handlePrev} className="flex-1 py-3.5 rounded-2xl font-extrabold text-slate-700 bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"><ArrowLeft size={20} /> Précédent</button>
                ) : (
                    <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl font-extrabold text-slate-700 bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"><ArrowLeft size={20} /> Retour</button>
                )}
                <button onClick={handleNext} disabled={!canGoNext()} className={`flex-1 py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all ${canGoNext() ? "bg-gradient-to-r from-primary-yellow to-amber-400 text-white shadow-lg shadow-amber-500/30" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                    {isCAStep ? "Voir le résumé" : "Suivant"} <ArrowRight size={20} />
                </button>
            </div>

        </div>
    );
}
