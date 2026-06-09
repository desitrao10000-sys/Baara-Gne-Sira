"use client";

import { useState } from "react";
import {
    ArrowLeft, ArrowRight, Check, Sparkles, Building2, MapPin, Globe2,
    Calendar, Clock, FileText, Target, Pencil, Lightbulb, Send, X, FolderKanban,
} from "lucide-react";
import { Project, ProjectInfo } from "@/lib/useSupabaseProjects";

interface SectionDetailViewProps {
    project: Project;
    onBack: () => void;
    onSave: (updatedInfo: ProjectInfo) => void;
    onDelete: (projectId: string) => void;
}

// ─── Aide IA locale ────────────────────────────────────
const localHelpDB: Record<string, { keywords: string[]; answer: string }[]> = {
    name: [
        { keywords: ["nom", "appelle", "comment", "choisir"], answer: "📛 **Comment bien nommer votre projet :**\n\n• Choisissez un nom **court et mémorable**\n• Il doit refléter votre activité\n• Évitez les noms trop compliqués\n\n💡 **Exemples :**\n• Commerce → « Djiguifa Commerce »\n• Agriculture → « Sahel Agro »\n• Tech → « Mali Tech Solutions »" },
        { keywords: ["exemple", "suggestion", "idée"], answer: "💡 **Exemples par secteur :**\n\n🛒 Commerce : « Afrika Market »\n🌾 Agriculture : « Sahel Agro »\n💼 Service : « ProConsult Africa »\n🍽️ Restauration : « Saveurs d'Afrique »\n💻 Tech : « Digital Mali »" },
    ],
    sector: [
        { keywords: ["secteur", "domaine", "activité"], answer: "🏢 **Choisir votre secteur :**\n\n🛒 **Commerce** → Achat-revente\n🌾 **Agriculture** → Culture\n💼 **Service** → Conseil, prestation\n🏭 **Industrie** → Transformation\n🐄 **Élevage** → Animaux\n💻 **Technologie** → Digital, IT" },
    ],
    location: [
        { keywords: ["où", "localisation", "ville", "lieu"], answer: "📍 **Où baser votre projet ?**\n\nIndiquez la **ville principale**.\n\n💡 Soyez précis : « Ouagadougou, Burkina Faso »" },
    ],
    zone: [
        { keywords: ["zone", "territoire", "couverture"], answer: "🌍 **Zone d'intervention :**\n\n📍 **Quartier/Village** → Très local\n🏘️ **Commune** → Rayonnement communal\n🗺️ **Régionale** → Plusieurs villes\n🌍 **Nationale** → Tout le pays\n🌐 **Sous-régionale** → Plusieurs pays" },
    ],
    startDate: [
        { keywords: ["quand", "date", "commencer", "démarrer"], answer: "📅 **Quand démarrer ?**\n\n⏰ Prévoyez 1 à 3 mois de préparation.\n💰 Délai pour obtenir un prêt.\n📄 Délai pour les documents administratifs." },
    ],
    duration: [
        { keywords: ["combien", "temps", "durée", "long"], answer: "⏱️ **Durée par type de projet :**\n\n• **Commerce** → 1 à 3 ans\n• **Agriculture** → 3 à 5 ans\n• **Service** → 1 à 3 ans\n• **Industrie** → 3 à 5 ans\n\n💡 Les banques préfèrent **3 à 5 ans**." },
    ],
    description: [
        { keywords: ["décrir", "expliquer", "quoi", "comment"], answer: "📝 **Comment décrire votre projet :**\n\n1️⃣ **Quoi** → Activité principale\n2️⃣ **Comment** → Méthode/produit\n3️⃣ **Pour qui** → Clients cibles\n\n💡 **Exemple :**\n« Transformation de fruits locaux en jus naturels, vendus dans les marchés de Ouagadougou. »" },
    ],
    objectives: [
        { keywords: ["objectif", "but", "atteindre", "résultat"], answer: "🎯 **Fixez 3-4 objectifs mesurables :**\n\n💰 **Financier** → Chiffre d'affaires visé\n👥 **Social** → Emplois créés\n🏆 **Marché** → Position concurrentielle\n\n💡 Exemple : Atteindre 10M FCFA de CA la 1ère année" },
    ],
};

function getLocalHelp(sectionId: string, query: string): string | null {
    const lower = query.toLowerCase().trim();
    const rules = localHelpDB[sectionId];
    if (!rules) return null;
    let bestMatch: string | null = null;
    let bestScore = 0;
    for (const rule of rules) {
        const score = rule.keywords.filter(kw => lower.includes(kw)).length;
        if (score > bestScore) { bestScore = score; bestMatch = rule.answer; }
    }
    return bestMatch;
}

// ─── Étapes du wizard ──────────────────────────────────
interface StepDef {
    id: keyof ProjectInfo;
    title: string;
    subtitle: string;
    type: "text" | "date" | "textarea";
    icon: React.ReactNode;
    placeholder: string;
    suggestions: { value: string; label: string }[];
}

const steps: StepDef[] = [
    {
        id: "name", title: "Comment s'appelle votre projet ?", subtitle: "Donnez un nom clair et reconnaissable",
        type: "text", icon: <Sparkles size={32} className="text-primary-yellow" />,
        placeholder: "Tapez le nom de votre projet...",
        suggestions: [
            { value: "Unité de transformation agroalimentaire", label: "Unité de transformation agroalimentaire" },
            { value: "Ferme moderne intégrée", label: "Ferme moderne intégrée" },
            { value: "Boutique de vente en ligne", label: "Boutique de vente en ligne" },
            { value: "Atelier de production artisanale", label: "Atelier de production artisanale" },
            { value: "Service de conseil et formation", label: "Service de conseil et formation" },
        ],
    },
    {
        id: "sector", title: "Dans quel secteur travaillez-vous ?", subtitle: "Choisissez le secteur de votre activité",
        type: "text", icon: <Building2 size={32} className="text-primary-yellow" />,
        placeholder: "Tapez votre secteur...",
        suggestions: [
            { value: "Commerce", label: "🛒 Commerce" }, { value: "Agriculture", label: "🌾 Agriculture" },
            { value: "Service", label: "💼 Service" }, { value: "Industrie", label: "🏭 Industrie" },
            { value: "Élevage", label: "🐄 Élevage" }, { value: "Artisanat", label: "🪵 Artisanat" },
            { value: "Transport", label: "🚚 Transport" }, { value: "Technologie", label: "💻 Technologie" },
            { value: "Santé", label: "🏥 Santé" }, { value: "Éducation", label: "📚 Éducation" },
            { value: "Restauration", label: "🍽️ Restauration" }, { value: "Bâtiment & Travaux", label: "🏗️ Bâtiment" },
        ],
    },
    {
        id: "location", title: "Où est basé votre projet ?", subtitle: "Indiquez la ville ou le lieu principal",
        type: "text", icon: <MapPin size={32} className="text-primary-yellow" />,
        placeholder: "Tapez la localisation...",
        suggestions: [
            { value: "Ouagadougou, Burkina Faso", label: "🏙️ Ouagadougou" },
            { value: "Bobo-Dioulasso, Burkina Faso", label: "🏙️ Bobo-Dioulasso" },
            { value: "Abidjan, Côte d'Ivoire", label: "🏙️ Abidjan" },
            { value: "Bamako, Mali", label: "🏙️ Bamako" },
            { value: "Dakar, Sénégal", label: "🏙️ Dakar" },
            { value: "Conakry, Guinée", label: "🏙️ Conakry" },
            { value: "Lomé, Togo", label: "🏙️ Lomé" },
            { value: "Cotonou, Bénin", label: "🏙️ Cotonou" },
        ],
    },
    {
        id: "zone", title: "Dans quelle zone intervenez-vous ?", subtitle: "Quartier, commune, région ou nationale",
        type: "text", icon: <Globe2 size={32} className="text-primary-yellow" />,
        placeholder: "Tapez votre zone d'intervention...",
        suggestions: [
            { value: "Quartier / Village", label: "📍 Quartier / Village" },
            { value: "Commune", label: "🏘️ Commune" },
            { value: "Régionale", label: "🗺️ Régionale" },
            { value: "Nationale", label: "🌍 Nationale" },
            { value: "Sous-régionale (UEMOA)", label: "🌐 Sous-régionale" },
        ],
    },
    {
        id: "startDate", title: "Quand commence le projet ?", subtitle: "Indiquez la date de démarrage prévue",
        type: "date", icon: <Calendar size={32} className="text-primary-yellow" />,
        placeholder: "", suggestions: [],
    },
    {
        id: "duration", title: "Sur combien de temps prévoyez-vous ce projet ?", subtitle: "La durée globale de votre projet",
        type: "text", icon: <Clock size={32} className="text-primary-yellow" />,
        placeholder: "Tapez la durée...",
        suggestions: [
            { value: "3 mois", label: "📅 3 mois" }, { value: "6 mois", label: "📅 6 mois" },
            { value: "1 an", label: "📅 1 an" }, { value: "2 ans", label: "📅 2 ans" },
            { value: "3 ans", label: "📅 3 ans" }, { value: "5 ans", label: "📅 5 ans" },
        ],
    },
    {
        id: "description", title: "Décrivez votre projet en quelques mots", subtitle: "Expliquez brièvement ce que vous allez faire",
        type: "textarea", icon: <FileText size={32} className="text-primary-yellow" />,
        placeholder: "Décrivez votre projet ici...",
        suggestions: [
            { value: "Transformation et vente de produits locaux de qualité", label: "🔄 Transformation et vente de produits locaux" },
            { value: "Élevage moderne et commercialisation de bétail", label: "🐄 Élevage moderne et commercialisation" },
            { value: "Service de livraison rapide dans les zones urbaines", label: "🚚 Service de livraison rapide" },
            { value: "Formation et accompagnement des jeunes entrepreneurs", label: "📚 Formation jeunes entrepreneurs" },
        ],
    },
    {
        id: "objectives", title: "Quels sont vos grands objectifs ?", subtitle: "Les résultats majeurs que vous voulez atteindre",
        type: "textarea", icon: <Target size={32} className="text-primary-yellow" />,
        placeholder: "Décrivez vos objectifs ici...",
        suggestions: [
            { value: "Atteindre un chiffre d'affaires de 10 millions FCFA la première année", label: "💰 CA de 10M FCFA/an" },
            { value: "Créer au moins 5 emplois permanents", label: "👥 5 emplois permanents" },
            { value: "Devenir leader sur le marché local en 3 ans", label: "🏆 Leader marché local" },
            { value: "Exporter vers les pays voisins sous 2 ans", label: "🌐 Export sous-régional" },
        ],
    },
];

// ─── Composant principal ────────────────────────────────
export default function SectionDetailView({ project, onBack, onSave }: SectionDetailViewProps) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<ProjectInfo>({ ...project.info });
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [showHelp, setShowHelp] = useState(false);
    const [helpQuery, setHelpQuery] = useState("");
    const [helpResponse, setHelpResponse] = useState<string | null>(null);
    const [helpLoading, setHelpLoading] = useState(false);

    const currentStep = steps[step];
    const totalSteps = steps.length;
    const progress = ((step + 1) / totalSteps) * 100;
    const currentValue = form[currentStep.id];

    const updateField = (value: string) => {
        setForm((prev) => ({ ...prev, [currentStep.id]: value }));
    };

    const canGoNext = () => currentValue.trim() !== "";

    const resetHelp = () => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setDirection("forward");
            resetHelp();
            setStep(step + 1);
        } else {
            onSave(form);
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
        if (e.key === "Enter" && canGoNext() && currentStep.type !== "textarea") {
            handleNext();
        }
    };

    const handleHelp = async () => {
        if (!helpQuery.trim()) return;
        setHelpLoading(true);
        setHelpResponse(null);
        try {
            const res = await fetch("/api/gemini-project-help", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: helpQuery, sectionId: currentStep.id, sectionTitle: currentStep.title }),
            });
            if (res.ok) {
                const d = await res.json();
                if (d.response) { setHelpResponse(d.response); }
                else { setHelpResponse(d.error || "💡 Reformulez votre question."); }
            } else {
                // Fallback vers aide locale si l'API échoue
                const localAnswer = getLocalHelp(currentStep.id, helpQuery);
                setHelpResponse(localAnswer || "⚠️ L'IA est indisponible. Vérifiez votre connexion et reformulez votre question.");
            }
        } catch {
            // Fallback vers aide locale si pas de réseau
            const localAnswer = getLocalHelp(currentStep.id, helpQuery);
            setHelpResponse(localAnswer || "⚠️ Pas de connexion. L'aide IA nécessite internet.");
        }
        setHelpLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-pastel flex flex-col z-50">
            {/* Header */}
            <div className="textured-navy p-4 flex items-center gap-3 shrink-0">
                <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-white tracking-wide">Section 2 — Détails du Projet</h1>
                    <p className="text-white/60 text-xs font-bold">
                        {form.name || "Nouveau Projet"}
                    </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <FolderKanban size={22} className="text-primary-yellow" />
                </div>
                <span className="text-primary-yellow font-extrabold text-sm">{step + 1}/{totalSteps}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/50 shrink-0">
                <div className="h-full bg-gradient-to-r from-primary-yellow to-amber-400 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div key={step} className={`flex-1 flex flex-col p-5 overflow-y-auto ${direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">{currentStep.icon}</div>
                    </div>

                    {/* Question */}
                    <h2 className="text-xl font-black text-text-dark text-center mb-1 leading-tight">{currentStep.title}</h2>
                    <p className="text-center text-slate-500 text-xs font-semibold mb-5">{currentStep.subtitle}</p>

                    {/* Suggestions */}
                    {currentStep.suggestions.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">💡 Choisissez une proposition ou tapez votre propre réponse :</p>
                            <div className="flex flex-wrap gap-2">
                                {currentStep.suggestions.map((sug) => (
                                    <button key={sug.value} onClick={() => updateField(sug.value)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${currentValue === sug.value ? "border-vibrant-blue bg-blue-50 text-vibrant-blue shadow-md shadow-blue-500/20" : "border-slate-200 bg-white text-slate-600"}`}>
                                        {sug.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aide IA */}
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
                                    <button onClick={() => { setShowHelp(false); setHelpQuery(""); setHelpResponse(null); }} className="text-amber-400 hover:text-amber-600" title="Fermer"><X size={12} /></button>
                                </div>
                                <div className="p-2.5">
                                    <div className="flex gap-1.5">
                                        <input type="text" value={helpQuery} onChange={(e) => { setHelpQuery(e.target.value); setHelpResponse(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleHelp(); }} placeholder="Posez votre question ici..." className="flex-1 p-2 rounded-lg border-2 border-slate-200 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400" />
                                        <button onClick={handleHelp} disabled={!helpQuery.trim()} title="Envoyer" className={`px-3 py-2 rounded-lg flex items-center justify-center ${helpQuery.trim() ? "bg-amber-400 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}><Send size={14} /></button>
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

                    {/* Input */}
                    <div>
                        {currentStep.type === "date" ? (
                            <input type="date" value={currentValue} onChange={(e) => updateField(e.target.value)} title="Date de démarrage" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-base font-bold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all text-center" />
                        ) : currentStep.type === "textarea" ? (
                            <textarea value={currentValue} onChange={(e) => updateField(e.target.value)} placeholder={currentStep.placeholder} rows={3} className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all resize-none" autoFocus />
                        ) : (
                            <div className="relative">
                                <Pencil size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={currentValue} onChange={(e) => updateField(e.target.value)} onKeyDown={handleKeyDown} placeholder={currentStep.placeholder} className="w-full p-4 pl-10 rounded-2xl border-2 border-slate-200 bg-white text-base font-bold text-slate-800 outline-none focus:border-vibrant-blue focus:shadow-lg focus:shadow-blue-500/20 transition-all" autoFocus />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="p-5 flex gap-4 shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
                {step > 0 ? (
                    <button onClick={handlePrev} className="flex-1 py-3.5 rounded-2xl font-extrabold text-slate-600 bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <ArrowLeft size={20} /> Précédent
                    </button>
                ) : (
                    <div className="flex-1" />
                )}
                <button onClick={handleNext} disabled={!canGoNext()} className={`flex-1 py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all ${canGoNext() ? "bg-gradient-to-r from-primary-yellow to-amber-400 text-white shadow-lg shadow-amber-500/30" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                    {step === totalSteps - 1 ? (<><Check size={20} /> Terminer</>) : (<>Suivant <ArrowRight size={20} /></>)}
                </button>
            </div>

            {/* Animations CSS */}
            <style jsx>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
                .animate-slide-in-right { animation: slideInRight 0.35s ease-out; }
                .animate-slide-in-left { animation: slideInLeft 0.35s ease-out; }
            `}</style>
        </div>
    );
}