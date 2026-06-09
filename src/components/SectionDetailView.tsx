"use client";

import { useState } from "react";
import {
    ArrowLeft, FolderKanban, Building2, MapPin, Globe2,
    Calendar, Clock, FileText, Target, Sparkles, Trash2, AlertTriangle,
} from "lucide-react";
import { Project, ProjectInfo } from "@/lib/useSupabaseProjects";

interface SectionDetailViewProps {
    project: Project;
    onBack: () => void;
    onSave: (updatedInfo: ProjectInfo) => void;
    onDelete: (projectId: string) => void;
}

const SECTOR_LABELS: Record<string, string> = {
    commerce: "🛒 Commerce", agriculture: "🌾 Agriculture", service: "💼 Service",
    industrie: "🏭 Industrie", elevage: "🐄 Élevage", artisanat: "🪵 Artisanat",
    transport: "🚚 Transport", technologie: "💻 Technologie", sante: "🏥 Santé",
    education: "📚 Éducation", restauration: "🍽️ Restauration", batiment: "🏗️ Bâtiment"
};
const DURATION_LABELS: Record<string, string> = {
    "3-mois": "3 mois", "6-mois": "6 mois", "1-an": "1 an",
    "2-ans": "2 ans", "3-ans": "3 ans", "5-ans": "5 ans", "10-ans": "10 ans"
};
function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; }
}

export default function SectionDetailView({ project, onBack, onSave, onDelete }: SectionDetailViewProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { info } = project;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">Section 2 — Détails</h1>
                        <p className="text-white/60 text-xs font-bold">{info.name}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <FolderKanban size={22} className="text-primary-yellow" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                <div className="mt-2 mb-4">
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-yellow-100 mb-4">
                        {/* Barre titre */}
                        <div className="bg-gradient-to-br from-yellow-500 via-yellow-400 to-amber-500 px-5 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/30 border-2 border-white/40 flex items-center justify-center shrink-0">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <h2 className="text-white font-black text-lg leading-tight flex-1 truncate">{info.name}</h2>
                        </div>
                        {/* Toutes les informations */}
                        <div className="bg-white divide-y divide-slate-100 text-justify">
                            {info.sector && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Building2 size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Secteur d'activité</p><p className="text-sm font-bold text-slate-900">{SECTOR_LABELS[info.sector] || info.sector}</p></div>
                                </div>
                            )}
                            {info.location && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><MapPin size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Localisation</p><p className="text-sm font-bold text-slate-900">{info.location}</p></div>
                                </div>
                            )}
                            {info.zone && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Globe2 size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Zone d'intervention</p><p className="text-sm font-bold text-slate-900">{info.zone}</p></div>
                                </div>
                            )}
                            {info.startDate && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Calendar size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Date de démarrage</p><p className="text-sm font-bold text-slate-900">{fmtDate(info.startDate)}</p></div>
                                </div>
                            )}
                            {info.duration && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Clock size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Durée prévue</p><p className="text-sm font-bold text-slate-900">{DURATION_LABELS[info.duration] || info.duration}</p></div>
                                </div>
                            )}
                            {info.description && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5"><FileText size={15} className="text-yellow-600" /></div>
                                    <div className="flex-1"><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-1">Description</p><p className="text-sm font-semibold text-slate-800 leading-relaxed">{info.description}</p></div>
                                </div>
                            )}
                            {info.objectives && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5"><Target size={15} className="text-yellow-600" /></div>
                                    <div className="flex-1"><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-1">Objectifs</p><p className="text-sm font-semibold text-slate-800 leading-relaxed">{info.objectives}</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Zone danger — supprimer le projet */}
                <div className="mt-4 mb-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-red-200" />
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Zone danger</span>
                        <div className="h-px flex-1 bg-red-200" />
                    </div>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                            <Trash2 size={16} /> Supprimer ce projet
                        </button>
                    ) : (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                            <p className="text-sm font-black text-red-700 flex items-center gap-2 mb-1"><AlertTriangle size={16} /> Confirmer la suppression ?</p>
                            <p className="text-xs text-red-500 mb-3 font-semibold">Action irréversible. Toutes les données seront perdues.</p>
                            <div className="flex gap-2">
                                <button onClick={() => onDelete(project.id)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-500/30"><Trash2 size={13} /> Oui, supprimer</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200">Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}