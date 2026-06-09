"use client";

import {
    ArrowLeft,
    Users,
    FileText,
    Calculator,
    ClipboardList,
    CheckCircle2,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { Project } from "@/lib/useSupabaseProjects";

interface ProjectSectionsLandingProps {
    project: Project | null;
    onBack: () => void;
    onSectionClick: (section: string) => void;
    onCreateProject: () => void;
}

export default function ProjectSectionsLanding({ project, onBack, onSectionClick, onCreateProject }: ProjectSectionsLandingProps) {
    const hasProject = !!project;

    const sections = [
        {
            id: "team",
            title: "Section 1",
            label: "Équipe du Projet",
            description: "Chef de projet, membres de l'équipe, rôles et responsabilités",
            icon: <Users size={28} className="text-emerald-600" />,
            bgColor: "from-emerald-400 via-green-400 to-teal-500",
            borderColor: "border-emerald-200",
            shadowColor: "shadow-emerald-500/20",
            badgeColor: "bg-emerald-100 text-emerald-700",
            completed: hasProject && !!project.manager,
        },
        {
            id: "detail",
            title: "Section 2",
            label: "Détail du Projet",
            description: "Nom, secteur, localisation, zone, dates, description et objectifs de votre projet",
            icon: <FileText size={28} className="text-amber-600" />,
            bgColor: "from-amber-400 via-yellow-400 to-amber-500",
            borderColor: "border-amber-200",
            shadowColor: "shadow-amber-500/20",
            badgeColor: "bg-amber-100 text-amber-700",
            completed: hasProject && !!project.info.name,
        },
        {
            id: "business",
            title: "Section 3",
            label: "Plan d'Affaire Chiffré",
            description: "Investissements, financement, charges, CA prévisionnel, indicateurs de rentabilité",
            icon: <Calculator size={28} className="text-blue-600" />,
            bgColor: "from-blue-500 via-blue-600 to-indigo-700",
            borderColor: "border-blue-200",
            shadowColor: "shadow-blue-500/20",
            badgeColor: "bg-blue-100 text-blue-700",
            completed: hasProject && !!project.businessPlan,
        },
        {
            id: "tasks",
            title: "Section 4",
            label: "Tâches du Projet",
            description: "Planification des activités, suivi de l'avancement et gestion des jalons",
            icon: <ClipboardList size={28} className="text-purple-600" />,
            bgColor: "from-purple-500 via-violet-500 to-fuchsia-600",
            borderColor: "border-purple-200",
            shadowColor: "shadow-purple-500/20",
            badgeColor: "bg-purple-100 text-purple-700",
            completed: hasProject && !!project.tasks && project.tasks.length > 0,
        },
    ];

    const completedCount = sections.filter(s => s.completed).length;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">
                            {hasProject ? project.info.name : "Nouveau Projet"}
                        </h1>
                        <p className="text-white/60 text-xs font-bold">
                            Tableau de bord du projet
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <Sparkles size={22} className="text-primary-yellow" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                {/* Message d'accueil */}
                <div className="text-center mb-4 mt-1">
                    <p className="text-sm font-bold text-slate-600">
                        {hasProject
                            ? "Sélectionnez une section pour la compléter ou la modifier"
                            : "Commencez par créer les détails de votre projet"
                        }
                    </p>
                    {hasProject && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="h-2 flex-1 max-w-[200px] bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-yellow to-amber-400 transition-all duration-500"
                                    style={{ width: `${(completedCount / 4) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-black text-slate-500">{completedCount}/4</span>
                        </div>
                    )}
                </div>

                {/* 4 Cartes de sections */}
                <div className="space-y-3">
                    {sections.map((section) => {
                        // Sans projet : seule la Section 2 (Détail) est cliquable
                        const canClick = hasProject ? true : section.id === "detail";
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    if (!canClick) return;
                                    if (!hasProject && section.id === "detail") {
                                        onCreateProject();
                                    } else if (hasProject) {
                                        onSectionClick(section.id);
                                    }
                                }}
                                className={`w-full rounded-2xl overflow-hidden shadow-lg ${section.shadowColor} border ${section.borderColor} transition-transform text-left ${canClick ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`}
                            >
                                {/* Barre de titre colorée */}
                                <div className={`bg-gradient-to-r ${section.bgColor} px-4 py-3 flex items-center gap-3`}>
                                    <div className="w-11 h-11 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
                                        {section.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{section.title}</p>
                                        <p className="text-sm font-black text-white truncate">{section.label}</p>
                                    </div>
                                    {section.completed && (
                                        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} className="text-white" />
                                        </div>
                                    )}
                                    <ChevronRight size={20} className="text-white/60 shrink-0" />
                                </div>
                                {/* Description */}
                                <div className="bg-white px-4 py-3">
                                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">{section.description}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                                            {section.completed ? "✅ Complété" : canClick ? "📝 À compléter" : "🔒 Créez d'abord le projet"}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Info box */}
                {hasProject && (
                    <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-2">
                            <Sparkles size={14} className="text-blue-500" />
                            Conseil : Remplissez les sections dans l'ordre pour une meilleure cohérence de votre plan d'affaires.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}