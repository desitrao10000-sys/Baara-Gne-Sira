"use client";

import { useState } from "react";
import { ArrowLeft, ClipboardList, Lightbulb, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import ProjectTasksSection from "./ProjectTasksSection";

interface SectionTasksViewProps {
    project: Project;
    onBack: () => void;
    onSaveTasks: (tasks: ProjectTask[]) => void;
}

export default function SectionTasksView({ project, onBack, onSaveTasks }: SectionTasksViewProps) {
    const teamMembers = project.manager
        ? [project.manager.nomComplet, ...(project.manager.membres ?? []).map((m) => `${m.prenom} ${m.nom}`)]
        : [];

    const [showAIHelp, setShowAIHelp] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const handleAIHelp = async () => {
        if (!aiQuery.trim()) return;
        setAiLoading(true);
        setAiResponse("");
        try {
            const res = await fetch("/api/gemini-task-help", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: aiQuery, projectInfo: project.info }),
            });
            if (res.ok) {
                const d = await res.json();
                setAiResponse(d.response || d.error || "💡 Reformulez votre question.");
            } else {
                setAiResponse("⚠️ L'IA est indisponible. Vérifiez votre connexion.");
            }
        } catch {
            setAiResponse("⚠️ Pas de connexion. Réessayez plus tard.");
        }
        setAiLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">Section 4 — Tâches</h1>
                        <p className="text-white/60 text-xs font-bold">{project.info.name}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <ClipboardList size={22} className="text-purple-300" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">

                {/* Guide - TOUJOURS VISIBLE directement */}
                <div className="bg-white rounded-2xl border border-amber-200 p-4 mb-3 space-y-3 text-[11px] text-slate-700 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                        Vos tâches ne sont pas de simples actions à cocher : elles constituent les fondations de votre <strong className="text-amber-700">plan d'affaires réel</strong>. Le premier plan chiffré que vous avez construit est prévisionnel — il repose sur des hypothèses. L'ensemble des tâches que vous créez et réalisez va transformer ces hypothèses en réalité mesurable, pour produire à la fin du projet votre véritable plan d'affaires réel.
                    </p>

                    <p className="font-black text-slate-800">Comment créer vos tâches pour atteindre cet objectif :</p>

                    <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                        <p className="font-black text-blue-700 mb-1">🏗️ 1. Couvrez les 3 phases du cycle de vie</p>
                        <p className="text-slate-600 mb-1">Chaque tâche doit appartenir à l'une de ces phases :</p>
                        <ul className="space-y-0.5 ml-3 text-slate-600">
                            <li>• <strong>Préparation</strong> : étude de marché, recherche de financement, permis, recrutement, achat matériel</li>
                            <li>• <strong>Lancement</strong> : installation, production, première vente, première livraison</li>
                            <li>• <strong>Pérennisation</strong> : fidélisation, optimisation des coûts, diversification, renouvellement équipement</li>
                        </ul>
                        <p className="text-blue-600 font-semibold mt-1 italic">→ Créez au minimum 2-3 tâches par phase.</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-2.5 border border-green-100">
                        <p className="font-black text-green-700 mb-1">📊 2. Intégrez les 3 dimensions du plan d'affaires</p>
                        <ul className="space-y-0.5 ml-3 text-slate-600">
                            <li>• <strong>Financière</strong> : investissements, trésorerie, remboursement emprunt, gestion des charges</li>
                            <li>• <strong>Juridique/administrative</strong> : immatriculation, conformité, contrats, assurances, déclarations fiscales</li>
                            <li>• <strong>Humaine</strong> : recrutement, formation, management, gestion partenaires et fournisseurs</li>
                        </ul>
                        <p className="text-green-600 font-semibold mt-1 italic">→ Ne vous limitez pas aux opérations quotidiennes. Incluez démarches administratives et investissements humains.</p>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                        <p className="font-black text-amber-700 mb-1">🎯 3. Liez chaque tâche à un indicateur financier du plan chiffré</p>
                        <ul className="space-y-0.5 ml-3 text-slate-600">
                            <li>• <strong>Tâches génératrices de revenus</strong> : lancement produit, campagne marketing, ouverture point de vente</li>
                            <li>• <strong>Tâches de maîtrise des coûts</strong> : négociation fournisseurs, optimisation logistique</li>
                            <li>• <strong>Tâches critiques pour la rentabilité</strong> : premières ventes, partenariats stratégiques</li>
                        </ul>
                        <p className="text-amber-600 font-semibold mt-1 italic">→ Pour chaque tâche, demandez-vous : "Quel indicateur financier (CA, VAN, ROI, délai de récupération) cette action impacte-t-elle ?"</p>
                    </div>
                </div>

                {/* Aide IA - repliable */}
                <div className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden mb-3">
                    <button
                        onClick={() => { setShowAIHelp(!showAIHelp); setAiResponse(""); }}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50"
                    >
                        <div className="flex items-center gap-2">
                            <Lightbulb size={16} className="text-indigo-500" />
                            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                                🤖 Aide IA — Vos doutes et vérifications
                            </span>
                        </div>
                        {showAIHelp ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-indigo-500" />}
                    </button>

                    {showAIHelp && (
                        <div className="p-3 space-y-2 bg-indigo-50/50">
                            <p className="text-[10px] text-indigo-600 font-semibold">
                                Posez vos questions sur les tâches à créer, leur pertinence par rapport à votre projet et objectifs. L'IA vous guide.
                            </p>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => { setAiQuery(e.target.value); setAiResponse(""); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleAIHelp(); }}
                                    placeholder="Ex : Quelles tâches de préparation dois-je créer pour un commerce ?"
                                    className="flex-1 p-2.5 rounded-xl border-2 border-indigo-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400 bg-white"
                                />
                                <button
                                    onClick={handleAIHelp}
                                    disabled={!aiQuery.trim() || aiLoading}
                                    title="Envoyer la question à l'IA"
                                    className={`px-3 py-2 rounded-xl flex items-center justify-center ${aiQuery.trim() && !aiLoading ? "bg-indigo-500 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                            {aiLoading && (
                                <div className="p-2 rounded-xl bg-white border border-indigo-100 flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] text-indigo-600 font-semibold">🤖 L'IA réfléchit...</span>
                                </div>
                            )}
                            {aiResponse && !aiLoading && (
                                <div className="p-3 rounded-xl bg-white border border-indigo-100 max-h-[200px] overflow-y-auto">
                                    <p className="text-[11px] font-semibold text-slate-800 leading-relaxed whitespace-pre-line">{aiResponse}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tâches */}
                <ProjectTasksSection tasks={project.tasks} projectMembers={teamMembers} onSave={onSaveTasks} />
            </div>
        </div>
    );
}