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

    const currentQuestion = questions[step];
    const totalSteps = questions.length;
    const progress = ((step + 1) / totalSteps) * 100;

    const currentValue = data[currentQuestion.id];

    const updateField = (value: string) => {
        setData((prev) => ({ ...prev, [currentQuestion.id]: value }));
    };

    const canGoNext = () => {
        return currentValue.trim() !== "";
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setDirection("forward");
            setStep(step + 1);
        } else {
            onComplete(data);
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setDirection("backward");
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

                    {/* Input Field */}
                    <div className="mt-auto">
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