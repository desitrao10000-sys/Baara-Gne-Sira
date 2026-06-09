"use client";

import { useState } from "react";
import {
    ArrowLeft, FolderKanban, Building2, MapPin, Globe2,
    Calendar, Clock, FileText, Target, Sparkles, Save, Check,
} from "lucide-react";
import { Project, ProjectInfo } from "@/lib/useSupabaseProjects";

interface SectionDetailViewProps {
    project: Project;
    onBack: () => void;
    onSave: (updatedInfo: ProjectInfo) => void;
    onDelete: (projectId: string) => void;
}

const SECTORS = [
    { value: "commerce", label: "🛒 Commerce" },
    { value: "agriculture", label: "🌾 Agriculture" },
    { value: "service", label: "💼 Service" },
    { value: "industrie", label: "🏭 Industrie" },
    { value: "elevage", label: "🐄 Élevage" },
    { value: "artisanat", label: "🪵 Artisanat" },
    { value: "transport", label: "🚚 Transport" },
    { value: "technologie", label: "💻 Technologie" },
    { value: "sante", label: "🏥 Santé" },
    { value: "education", label: "📚 Éducation" },
    { value: "restauration", label: "🍽️ Restauration" },
    { value: "batiment", label: "🏗️ Bâtiment" },
];

const DURATIONS = [
    { value: "3-mois", label: "3 mois" },
    { value: "6-mois", label: "6 mois" },
    { value: "1-an", label: "1 an" },
    { value: "2-ans", label: "2 ans" },
    { value: "3-ans", label: "3 ans" },
    { value: "5-ans", label: "5 ans" },
    { value: "10-ans", label: "10 ans" },
];

const LOCATIONS = ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Bamako", "Abidjan", "Dakar", "Conakry", "Lomé", "Cotonou", "Niamey"];
const ZONES = ["Quartier / Village", "Commune", "Régionale", "Nationale", "Sous-régionale (UEMOA)"];

export default function SectionDetailView({ project, onBack, onSave }: SectionDetailViewProps) {
    const [form, setForm] = useState<ProjectInfo>({ ...project.info });
    const [saved, setSaved] = useState(false);

    const update = (key: keyof ProjectInfo, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        onSave(form);
        setSaved(true);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">Section 2 — Détails</h1>
                        <p className="text-white/60 text-xs font-bold">{form.name || "Nouveau Projet"}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <FolderKanban size={22} className="text-primary-yellow" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                <div className="text-center mb-4 mt-1">
                    <p className="text-sm font-bold text-slate-600">Remplissez les informations de votre projet</p>
                </div>

                <div className="space-y-4">
                    {/* Nom */}
                    <FieldCard icon={<Sparkles size={15} className="text-yellow-600" />} label="Nom du projet">
                        <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Tapez le nom de votre projet..." className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-yellow-400 transition-all" />
                    </FieldCard>

                    {/* Secteur */}
                    <FieldCard icon={<Building2 size={15} className="text-yellow-600" />} label="Secteur d'activité">
                        <div className="flex flex-wrap gap-2">
                            {SECTORS.map((s) => (
                                <button key={s.value} onClick={() => update("sector", s.value)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${form.sector === s.value ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-md shadow-yellow-500/20" : "border-slate-200 bg-white text-slate-600"}`}>{s.label}</button>
                            ))}
                        </div>
                    </FieldCard>

                    {/* Localisation */}
                    <FieldCard icon={<MapPin size={15} className="text-yellow-600" />} label="Localisation">
                        <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Votre ville..." className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-yellow-400 transition-all" />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {LOCATIONS.map((loc) => (
                                <button key={loc} onClick={() => update("location", loc)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${form.location === loc ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{loc}</button>
                            ))}
                        </div>
                    </FieldCard>

                    {/* Zone */}
                    <FieldCard icon={<Globe2 size={15} className="text-yellow-600" />} label="Zone d'intervention">
                        <div className="flex flex-wrap gap-2">
                            {ZONES.map((z) => (
                                <button key={z} onClick={() => update("zone", z)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${form.zone === z ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-md shadow-yellow-500/20" : "border-slate-200 bg-white text-slate-600"}`}>{z}</button>
                            ))}
                        </div>
                    </FieldCard>

                    {/* Date */}
                    <FieldCard icon={<Calendar size={15} className="text-yellow-600" />} label="Date de démarrage">
                        <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} title="Date de démarrage" className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-yellow-400 transition-all" />
                    </FieldCard>

                    {/* Durée */}
                    <FieldCard icon={<Clock size={15} className="text-yellow-600" />} label="Durée prévue">
                        <div className="flex flex-wrap gap-2">
                            {DURATIONS.map((d) => (
                                <button key={d.value} onClick={() => update("duration", d.value)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border-2 ${form.duration === d.value ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-md shadow-yellow-500/20" : "border-slate-200 bg-white text-slate-600"}`}>{d.label}</button>
                            ))}
                        </div>
                    </FieldCard>

                    {/* Description */}
                    <FieldCard icon={<FileText size={15} className="text-yellow-600" />} label="Description">
                        <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Décrivez votre projet..." rows={3} className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-yellow-400 transition-all resize-none" />
                    </FieldCard>

                    {/* Objectifs */}
                    <FieldCard icon={<Target size={15} className="text-yellow-600" />} label="Objectifs">
                        <textarea value={form.objectives} onChange={(e) => update("objectives", e.target.value)} placeholder="Quels sont vos grands objectifs ?" rows={3} className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-yellow-400 transition-all resize-none" />
                    </FieldCard>
                </div>

                {/* Bouton sauvegarder */}
                <button onClick={handleSave} className="w-full mt-4 py-4 bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 active:scale-95 transition-transform">
                    {saved ? <><Check size={18} /> Enregistré ✓</> : <><Save size={18} /> Enregistrer</>}
                </button>
            </div>
        </div>
    );
}

function FieldCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-yellow-100">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">{icon}</div>
                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">{label}</p>
            </div>
            {children}
        </div>
    );
}