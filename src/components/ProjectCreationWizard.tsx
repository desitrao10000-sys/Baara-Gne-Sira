"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Building2,
    MapPin,
    Globe2,
    Calendar,
    Clock,
    FileText,
    Target,
    Sparkles,
    Pencil,
    Lightbulb,
    Send,
    X,
} from "lucide-react";

// Types
export interface ProjectInfo {
    name: string;
    sector: string;
    location: string;
    zone: string;
    startDate: string;
    duration: string;
    description: string;
    objectives: string;
    clientsJson?: string;
}

interface Suggestion {
    value: string;
    label: string;
}

interface Question {
    id: keyof ProjectInfo;
    question: string;
    subtitle: string;
    type: "text" | "date" | "textarea";
    icon: React.ReactNode;
    placeholder: string;
    suggestions: Suggestion[];
}

const questions: Question[] = [
    {
        id: "name",
        question: "Comment s'appelle ton projet ?",
        subtitle: "Donne un nom clair et reconnaissable à ton projet",
        type: "text",
        icon: <Sparkles size={32} className="text-primary-yellow" />,
        placeholder: "Tape le nom de ton projet...",
        suggestions: [
            { value: "Unité de transformation agroalimentaire", label: "Unité de transformation agroalimentaire" },
            { value: "Ferme moderne intégrée", label: "Ferme moderne intégrée" },
            { value: "Boutique de vente en ligne", label: "Boutique de vente en ligne" },
            { value: "Atelier de production artisanale", label: "Atelier de production artisanale" },
            { value: "Service de conseil et formation", label: "Service de conseil et formation" },
        ],
    },
    {
        id: "sector",
        question: "Dans quel secteur travailles-tu ?",
        subtitle: "Choisis le secteur qui correspond le mieux à ton activité",
        type: "text",
        icon: <Building2 size={32} className="text-primary-yellow" />,
        placeholder: "Tape ton secteur d'activité...",
        suggestions: [
            { value: "Commerce", label: "🛒 Commerce" },
            { value: "Agriculture", label: "🌾 Agriculture" },
            { value: "Service", label: "💼 Service" },
            { value: "Industrie", label: "🏭 Industrie" },
            { value: "Élevage", label: "🐄 Élevage" },
            { value: "Artisanat", label: "🪵 Artisanat" },
            { value: "Transport", label: "🚚 Transport" },
            { value: "Technologie", label: "💻 Technologie" },
            { value: "Santé", label: "🏥 Santé" },
            { value: "Éducation", label: "📚 Éducation" },
            { value: "Restauration", label: "🍽️ Restauration" },
            { value: "Bâtiment & Travaux", label: "🏗️ Bâtiment & Travaux" },
        ],
    },
    {
        id: "location",
        question: "Où est basé ton projet ?",
        subtitle: "Indique la ville ou le lieu principal de ton projet",
        type: "text",
        icon: <MapPin size={32} className="text-primary-yellow" />,
        placeholder: "Tape la localisation...",
        suggestions: [
            { value: "Ouagadougou, Burkina Faso", label: "🏙️ Ouagadougou" },
            { value: "Abidjan, Côte d'Ivoire", label: "🏙️ Abidjan" },
            { value: "Bamako, Mali", label: "🏙️ Bamako" },
            { value: "Dakar, Sénégal", label: "🏙️ Dakar" },
            { value: "Conakry, Guinée", label: "🏙️ Conakry" },
            { value: "Lomé, Togo", label: "🏙️ Lomé" },
            { value: "Cotonou, Bénin", label: "🏙️ Cotonou" },
            { value: "Niamey, Niger", label: "🏙️ Niamey" },
        ],
    },
    {
        id: "zone",
        question: "Dans quelle zone interviens-tu ?",
        subtitle: "Quartier, commune, région ou nationale",
        type: "text",
        icon: <Globe2 size={32} className="text-primary-yellow" />,
        placeholder: "Tape ta zone d'intervention...",
        suggestions: [
            { value: "Quartier / Village", label: "📍 Quartier / Village" },
            { value: "Commune", label: "🏘️ Commune" },
            { value: "Régionale", label: "🗺️ Régionale" },
            { value: "Nationale", label: "🌍 Nationale" },
            { value: "Sous-régionale (UEMOA)", label: "🌐 Sous-régionale" },
        ],
    },
    {
        id: "startDate",
        question: "Quand commence le projet ?",
        subtitle: "Indique la date de démarrage prévue",
        type: "date",
        icon: <Calendar size={32} className="text-primary-yellow" />,
        placeholder: "",
        suggestions: [],
    },
    {
        id: "duration",
        question: "Sur combien de temps prévois-tu ce projet ?",
        subtitle: "La durée globale de ton projet",
        type: "text",
        icon: <Clock size={32} className="text-primary-yellow" />,
        placeholder: "Tape la durée...",
        suggestions: [
            { value: "3 mois", label: "📅 3 mois" },
            { value: "6 mois", label: "📅 6 mois" },
            { value: "1 an", label: "📅 1 an" },
            { value: "2 ans", label: "📅 2 ans" },
            { value: "3 ans", label: "📅 3 ans" },
            { value: "5 ans", label: "📅 5 ans" },
            { value: "10 ans", label: "📅 10 ans" },
        ],
    },
    {
        id: "description",
        question: "Décris ton projet en quelques mots",
        subtitle: "Explique brièvement ce que tu vas faire",
        type: "textarea",
        icon: <FileText size={32} className="text-primary-yellow" />,
        placeholder: "Décris ton projet ici...",
        suggestions: [
            { value: "Transformation et vente de produits locaux de qualité", label: "🔄 Transformation et vente de produits locaux" },
            { value: "Élevage moderne et commercialisation de bétail", label: "🐄 Élevage moderne et commercialisation" },
            { value: "Service de livraison rapide dans les zones urbaines", label: "🚚 Service de livraison rapide" },
            { value: "Formation et accompagnement des jeunes entrepreneurs", label: "📚 Formation jeunes entrepreneurs" },
        ],
    },
    {
        id: "objectives",
        question: "Quels sont tes grands objectifs ?",
        subtitle: "Les résultats majeurs que tu veux atteindre",
        type: "textarea",
        icon: <Target size={32} className="text-primary-yellow" />,
        placeholder: "Décris tes objectifs ici...",
        suggestions: [
            { value: "Atteindre un chiffre d'affaires de 10 millions FCFA la première année", label: "💰 CA de 10M FCFA/an" },
            { value: "Créer au moins 5 emplois permanents", label: "👥 5 emplois permanents" },
            { value: "Devenir leader sur le marché local en 3 ans", label: "🏆 Leader marché local" },
            { value: "Exporter vers les pays voisins sous 2 ans", label: "🌐 Export sous-régional" },
        ],
    },
];

// ─── Moteur d'aide LOCAL (fonctionne sans API) ─────────────────
const localHelpDB: Record<string, { keywords: string[]; answer: string }[]> = {
    name: [
        { keywords: ["nom", "appelle", "comment", "choisir"], answer: "📛 **Comment bien nommer ton projet :**\n\n• Choisis un nom **court et mémorable**\n• Il doit refléter ton activité\n• Évite les noms trop compliqués\n\n💡 **Exemples :**\n• Commerce → « Djiguifa Commerce »\n• Agriculture → « Sahel Agro »\n• Tech → « Mali Tech Solutions »\n• Restaurant → « Saveurs du Burkina »" },
        { keywords: ["exemple", "suggestion", "idée"], answer: "💡 **Exemples de noms par secteur :**\n\n🛒 Commerce : « Afrika Market », « Terroir Distribution »\n🌾 Agriculture : « Sahel Agro », « Fertilland »\n💼 Service : « ProConsult Africa », « Expert Plus »\n🍽️ Restauration : « Saveurs d'Afrique », « Déguster »\n💻 Tech : « Digital Mali », « InnovaTech BF »\n🐄 Élevage : « Ranch Moderne », « Bétail Plus »" },
    ],
    sector: [
        { keywords: ["secteur", "domaine", "activité", "quoi"], answer: "🏢 **Comment choisir ton secteur :**\n\nChoisis le domaine **principal** de ton activité :\n\n🛒 **Commerce** → Achat-revente de marchandises\n🌾 **Agriculture** → Culture de produits agricoles\n💼 **Service** → Conseil, formation, prestation\n🏭 **Industrie** → Transformation, production\n🐄 **Élevage** → Animaux, volailles, poissons\n🪵 **Artisanat** → Fabrication artisanale\n🚚 **Transport** → Livraison, déplacement\n💻 **Technologie** → Digital, IT, web\n🏥 **Santé** → Pharmacie, clinique, soins\n📚 **Éducation** → Formation, école\n🍽️ **Restauration** → Restaurant, cantine\n🏗️ **Bâtiment** → Construction, travaux" },
        { keywords: ["hésite", "sais pas", "confon"], answer: "🤔 **Tu hésites entre deux secteurs ?**\n\nChoisis celui qui représente **ta principale source de revenus** :\n\n• Si tu **achètes et revends** → 🛒 Commerce\n• Si tu **produis/transformes** → 🏭 Industrie\n• Si tu **cultives** → 🌾 Agriculture\n• Si tu **conseilles/formes** → 💼 Service" },
    ],
    location: [
        { keywords: ["où", "localisation", "ville", "lieu", "emplacement"], answer: "📍 **Où baser ton projet ?**\n\nIndique la **ville principale** où ton activité sera basée.\n\n💡 **Conseils :**\n• Sois précis : « Ouagadougou, Ouaga 2000 »\n• Inclis le pays si nécessaire\n• Choisis là où tes **clients** sont nombreux\n\n📋 **Exemples :**\n• « Ouagadougou, Burkina Faso »\n• « Bamako, ACI 2000, Mali »\n• « Abidjan, Cocody, Côte d'Ivoire »" },
        { keywords: ["chez", "domicile", "maison", "quartier"], answer: "🏠 **Travailler chez soi, c'est possible !**\n\nBeaucoup d'entrepreneurs commencent à domicile.\nIndique simplement ton quartier ou ville.\n\n💡 Exemple : « Ouagadougou, Koulouba »" },
    ],
    zone: [
        { keywords: ["zone", "territoire", "couverture", "intervention"], answer: "🌍 **Quelle zone d'intervention ?**\n\nC'est la zone géographique que tu couvres :\n\n📍 **Quartier/Village** → Activité très locale\n🏘️ **Commune** → Rayonnement communal\n🗺️ **Régionale** → Plusieurs villes d'une région\n🌍 **Nationale** → Tout le pays\n🌐 **Sous-régionale** → Plusieurs pays (UEMOA)\n\n💡 **Conseil :** Commence petit et élargis ta zone ensuite !" },
    ],
    startDate: [
        { keywords: ["quand", "date", "commencer", "démarrer", "début"], answer: "📅 **Quand démarrer ton projet ?**\n\nChoisis une date réaliste en tenant compte de :\n\n⏰ **Préparation** → Temps pour trouver local, équipements\n💰 **Financement** → Délai pour obtenir un prêt\n📄 **Administratif** → Registre de commerce, autorisations\n\n💡 **Conseil :** Prévois 1 à 3 mois de préparation avant le démarrage réel." },
    ],
    duration: [
        { keywords: ["combien", "temps", "durée", "long", "années"], answer: "⏱️ **Quelle durée pour ton projet ?**\n\n📋 **Guide par type de projet :**\n\n• **Commerce** → 1 à 3 ans\n• **Agriculture** → 3 à 5 ans (cycle des récoltes)\n• **Élevage** → 2 à 5 ans\n• **Service** → 1 à 3 ans\n• **Industrie** → 3 à 5 ans\n• **Tech** → 1 à 3 ans\n\n💡 **Conseil :** Les banques préfèrent les projets de **3 à 5 ans**. C'est assez long pour montrer la rentabilité." },
    ],
    description: [
        { keywords: ["décrir", "expliquer", "quoi", "comment", "expliq"], answer: "📝 **Comment décrire ton projet :**\n\nUtilise cette formule simple :\n\n1️⃣ **Quoi** → Ton activité principale\n2️⃣ **Comment** → Ta méthode/produit\n3️⃣ **Pour qui** → Tes clients cibles\n\n💡 **Exemple :**\n« Transformation de fruits locaux en jus naturels, vendus en bouteilles dans les marchés et supermarchés de Ouagadougou. Clients : ménages et restaurants. »\n\n✅ **Sois précis et concret !**" },
        { keywords: ["restaurant", "restauration", "manger", "cuisine"], answer: "🍽️ **Exemple de description pour un restaurant :**\n\n« Restaurant de cuisine locale et moderne, proposant des repas traditionnels burkinabè à des prix abordables. Situé en centre-ville, nous servons 50-80 couverts par jour avec un service rapide et de qualité. Clientèle : employés de bureau et étudiants. »" },
        { keywords: ["commerce", "vendre", "vente", "boutique"], answer: "🛒 **Exemple de description pour un commerce :**\n\n« Boutique de vente de produits de première nécessité et de boissons dans le quartier Koulouba. Approvisionnement depuis les grossistes de Ouagadougou. Vente au détail et demi-gros. Clientèle locale : ménages et petits commerces. »" },
        { keywords: ["agricult", "ferme", "culture", "champ"], answer: "🌾 **Exemple de description pour l'agriculture :**\n\n« Exploitation agricole de 5 hectares dédiée à la culture du maïs et du niébé en saison des pluies, avec un système d'irrigation pour le maraîchage en saison sèche. Production vendue aux marchés locaux et aux revendeurs. »" },
    ],
    objectives: [
        { keywords: ["objectif", "but", "atteindre", "résultat", "quoi"], answer: "🎯 **Comment fixer tes objectifs :**\n\nPense à 3-4 objectifs **mesurables** :\n\n💰 **Financier** → Chiffre d'affaires visé\n👥 **Social** → Emplois créés\n🏆 **Marché** → Position concurrentielle\n🌐 **Expansion** → Croissance géographique\n\n💡 **Exemple :**\n1. Atteindre 10M FCFA de CA la 1ère année\n2. Créer 5 emplois permanents\n3. Devenir leader local en 3 ans\n4. Exporter vers la Côte d'Ivoire en année 2" },
        { keywords: ["chiffre", "affaires", "CA", "million", "argent"], answer: "💰 **Quel chiffre d'affaires viser ?**\n\n📋 **Guide par secteur (1ère année) :**\n\n• Petit commerce → 2 à 5M FCFA\n• Restaurant → 5 à 15M FCFA\n• Service/Bureau → 3 à 10M FCFA\n• Agriculture → 3 à 10M FCFA\n• Industrie/Production → 10 à 30M FCFA\n\n💡 **Conseil :** Sois réaliste mais ambitieux ! Un banquier veut voir que ton projet est rentable." },
        { keywords: ["emploi", "embauche", "personnel", "recruter"], answer: "👥 **Combien d'emplois créer ?**\n\nC'est un **argument fort** pour les banques et les pouvoirs publics !\n\n📋 **Guide :**\n• Micro-entreprise → 1 à 3 emplois\n• Petite entreprise → 3 à 10 emplois\n• Moyenne entreprise → 10 à 50 emplois\n\n💡 Inclus les emplois **directs** (tes employés) et **indirects** (fournisseurs, transporteurs)." },
    ],
};

function getLocalHelp(sectionId: string, query: string): string | null {
    const lower = query.toLowerCase().trim();
    const rules = localHelpDB[sectionId];
    if (!rules) return null;

    // Chercher le meilleur match
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const rule of rules) {
        const score = rule.keywords.filter(kw => lower.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = rule.answer;
        }
    }

    return bestMatch;
}

// Réponse par défaut si aucun match local
function getDefaultHelp(sectionId: string): string {
    const defaults: Record<string, string> = {
        name: "📛 **Nom du projet**\nChoisis un nom court, mémorable et professionnel qui reflète ton activité.\n\n💡 Pose une question précise comme « comment choisir un bon nom » ou « donne-moi des exemples ».",
        sector: "🏢 **Secteur d'activité**\nSélectionne le domaine principal de ton activité.\n\n💡 Pose une question comme « quels sont les secteurs disponibles » ou « je ne sais pas lequel choisir ».",
        location: "📍 **Localisation**\nIndique la ville ou quartier principal de ton projet.\n\n💡 Pose une question comme « où dois-je m'installer » pour plus d'aide.",
        zone: "🌍 **Zone d'intervention**\nDéfinis la zone géographique que tu couvres.\n\n💡 Pose une question comme « quelle zone choisir » pour plus d'aide.",
        startDate: "📅 **Date de démarrage**\nChoisis une date réaliste en tenant compte du temps de préparation.\n\n💡 Pose une question comme « quand démarrer » pour plus d'aide.",
        duration: "⏱️ **Durée du projet**\nPrévois une durée cohérente avec ton secteur d'activité.\n\n💡 Pose une question comme « combien de temps » pour plus d'aide.",
        description: "📝 **Description du projet**\nDécris clairement ce que tu fais, comment et pour qui.\n\n💡 Pose une question comme « comment décrire mon projet » pour plus d'aide.",
        objectives: "🎯 **Objectifs**\nFixe 3-4 objectifs mesurables (CA, emplois, marché).\n\n💡 Pose une question comme « quels objectifs fixer » pour plus d'aide.",
    };
    return defaults[sectionId] || "💡 Pose une question précise pour obtenir de l'aide sur cette section !";
}

interface ProjectCreationWizardProps {
    onComplete: (project: ProjectInfo) => void;
    onCancel: () => void;
}

export default function ProjectCreationWizard({
    onComplete,
    onCancel,
}: ProjectCreationWizardProps) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<ProjectInfo>({
        name: "",
        sector: "",
        location: "",
        zone: "",
        startDate: "",
        duration: "",
        description: "",
        objectives: "",
    });
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [showHelp, setShowHelp] = useState(false);
    const [helpQuery, setHelpQuery] = useState("");
    const [helpResponse, setHelpResponse] = useState<string | null>(null);
    const [helpLoading, setHelpLoading] = useState(false);

    const handleHelp = async () => {
        if (!helpQuery.trim()) return;

        // ① Essayer le moteur LOCAL en premier (toujours disponible)
        const localAnswer = getLocalHelp(currentQuestion.id, helpQuery);
        if (localAnswer) {
            setHelpResponse(localAnswer);
            return;
        }

        // ② Sinon, essayer l'API Gemini en fallback
        setHelpLoading(true);
        try {
            const res = await fetch("/api/gemini-project-help", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: helpQuery, sectionId: currentQuestion.id, sectionTitle: currentQuestion.question }),
            });
            if (res.ok) {
                const d = await res.json();
                setHelpResponse(d.response);
            } else {
                // ③ Si API échoue, afficher l'aide par défaut
                setHelpResponse(getDefaultHelp(currentQuestion.id));
            }
        } catch {
            // ④ Si réseau échoue, afficher l'aide par défaut
            setHelpResponse(getDefaultHelp(currentQuestion.id));
        }
        setHelpLoading(false);
    };

    const currentQuestion = questions[step];
    const totalSteps = questions.length;
    const progress = ((step + 1) / totalSteps) * 100;

    const currentValue = data[currentQuestion.id] ?? "";

    const updateField = (value: string) => {
        setData((prev) => ({ ...prev, [currentQuestion.id]: value }));
    };

    const canGoNext = () => {
        return currentValue?.trim() !== "";
    };

    const resetHelp = () => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setDirection("forward");
            resetHelp();
            setStep(step + 1);
        } else {
            onComplete(data);
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setDirection("backward");
            resetHelp();
            setStep(step - 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && canGoNext() && currentQuestion.type !== "textarea") {
            handleNext();
        }
    };

    return (
        <div className="fixed inset-0 bg-pastel flex flex-col z-50">
            {/* Header */}
            <div className="textured-navy p-4 flex items-center gap-3 shrink-0">
                <button onClick={onCancel} className="text-white p-1" aria-label="Retour">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-white tracking-wide">
                        Nouveau Projet
                    </h1>
                    <p className="text-white/60 text-xs font-bold">
                        Section 1 — Informations générales
                    </p>
                </div>
                <span className="text-primary-yellow font-extrabold text-sm">
                    {step + 1}/{totalSteps}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/50 shrink-0">
                <div
                    className="h-full bg-gradient-to-r from-primary-yellow to-amber-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div
                    key={step}
                    className={`flex-1 flex flex-col p-5 overflow-y-auto ${direction === "forward"
                        ? "animate-slide-in-right"
                        : "animate-slide-in-left"
                        }`}
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                            {currentQuestion.icon}
                        </div>
                    </div>

                    {/* Question */}
                    <h2 className="text-xl font-black text-text-dark text-center mb-1 leading-tight">
                        {currentQuestion.question}
                    </h2>
                    <p className="text-center text-slate-500 text-xs font-semibold mb-5">
                        {currentQuestion.subtitle}
                    </p>

                    {/* Suggestions (checkboxes) */}
                    {currentQuestion.suggestions.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                💡 Choisis une proposition ou tape ta propre réponse :
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {currentQuestion.suggestions.map((sug) => (
                                    <button
                                        key={sug.value}
                                        onClick={() => updateField(sug.value)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${currentValue === sug.value
                                            ? "border-vibrant-blue bg-blue-50 text-vibrant-blue shadow-md shadow-blue-500/20"
                                            : "border-slate-200 bg-white text-slate-600"
                                            }`}
                                    >
                                        {sug.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Aide IA Gemini (au-dessus du champ pour mobile) ── */}
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
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Assistant IA</span>
                                    </div>
                                    <button onClick={() => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); }} className="text-amber-400 hover:text-amber-600" title="Fermer l'aide"><X size={12} /></button>
                                </div>
                                <div className="p-2.5">
                                    <div className="flex gap-1.5">
                                        <input type="text" value={helpQuery} onChange={(e) => { setHelpQuery(e.target.value); setHelpResponse(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleHelp(); }} placeholder="Pose ta question ici..." className="flex-1 p-2 rounded-lg border-2 border-slate-200 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400" />
                                        <button onClick={handleHelp} disabled={!helpQuery.trim()} title="Envoyer la question" className={`px-3 py-2 rounded-lg flex items-center justify-center ${helpQuery.trim() ? "bg-amber-400 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}><Send size={14} /></button>
                                    </div>
                                    {helpLoading && (
                                        <div className="mt-2 p-2 rounded-lg text-[10px] font-semibold flex items-center gap-2 bg-amber-50 border border-amber-200">
                                            <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-amber-700">🤖 L'IA réfléchit...</span>
                                        </div>
                                    )}
                                    {helpResponse && !helpLoading && (
                                        <div className="mt-2 p-3 rounded-lg text-[12px] font-semibold leading-relaxed bg-green-50 border border-green-200 max-h-[150px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                                            <p className="whitespace-pre-line text-slate-800">{helpResponse}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Field */}
                    <div>
                        {currentQuestion.type === "date" ? (
                            <input
                                type="date"
                                value={currentValue}
                                onChange={(e) => updateField(e.target.value)}
                                title="Date de démarrage"
                                className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-base font-bold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all text-center"
                            />
                        ) : currentQuestion.type === "textarea" ? (
                            <textarea
                                value={currentValue}
                                onChange={(e) => updateField(e.target.value)}
                                placeholder={currentQuestion.placeholder}
                                rows={3}
                                className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all resize-none"
                                autoFocus
                            />
                        ) : (
                            <div className="relative">
                                <Pencil size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => updateField(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={currentQuestion.placeholder}
                                    className="w-full p-4 pl-10 rounded-2xl border-2 border-slate-200 bg-white text-base font-bold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="p-5 flex gap-4 shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
                {step > 0 ? (
                    <button
                        onClick={handlePrev}
                        className="flex-1 py-3.5 rounded-2xl font-extrabold text-slate-600 bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={20} />
                        Précédent
                    </button>
                ) : (
                    <div className="flex-1" />
                )}
                <button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className={`flex-1 py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all ${canGoNext()
                        ? "bg-gradient-to-r from-primary-yellow to-amber-400 text-white shadow-lg shadow-amber-500/30"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {step === totalSteps - 1 ? (
                        <>
                            <Check size={20} />
                            Terminer
                        </>
                    ) : (
                        <>
                            Suivant
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>

            {/* Animations CSS */}
            <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.35s ease-out; }
        .animate-slide-in-left { animation: slideInLeft 0.35s ease-out; }
      `}</style>
        </div>
    );
}
