"use client";

import { useState, useMemo, useCallback } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    ListChecks, Filter, ChevronDown,
    Calendar, User, AlertTriangle, CheckCircle2,
    RotateCcw, Search, X, ArrowRight,
} from "lucide-react";

interface TodoProjetProps { projects: Project[]; onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void; }

const statusCfg: Record<string, { bg: string; border: string; text: string; dot: string; label: string; emoji: string }> = {
    "todo": { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", dot: "bg-blue-500", label: "À faire", emoji: "📋" },
    "en-cours": { bg: "bg-yellow-50", border: "border-primary-yellow", text: "text-yellow-700", dot: "bg-primary-yellow", label: "En cours", emoji: "⏳" },
    "en-retard": { bg: "bg-red-50", border: "border-red-400", text: "text-red-700", dot: "bg-red-500", label: "En retard", emoji: "⚠️" },
    "termine": { bg: "bg-green-50", border: "border-green-400", text: "text-green-700", dot: "bg-green-500", label: "Terminé", emoji: "✅" },
};

function parseDate(d: string): Date | null { if (!d) return null; const p = new Date(d + "T00:00:00"); return isNaN(p.getTime()) ? null : p; }
function fmtDate(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function daysBetween(a: Date, b: Date): number { return Math.ceil((b.getTime() - a.getTime()) / 86400000); }

interface FlatTask { task: ProjectTask; projectId: string; projectName: string; }

function getEffectiveStatus(task: ProjectTask): ProjectTask["statut"] {
    if (task.statut === "termine") return "termine";
    const fin = parseDate(task.dateFin);
    const debut = parseDate(task.dateDebut);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (fin && fin < now) return "en-retard";
    if (debut && debut <= now && (!fin || fin >= now)) return "en-cours";
    return "todo";
}

function EditField({ label, emoji, value, onChange, bg = "bg-slate-50", rows = 2 }: {
    label: string; emoji: string; value: string; onChange: (v: string) => void; bg?: string; rows?: number;
}) {
    return (
        <div>
            <h4 className="text-[11px] font-black text-slate-800 uppercase mb-1">{emoji} {label}</h4>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
                className={`w-full text-[12px] text-slate-700 leading-relaxed ${bg} rounded-xl p-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 resize-none`} />
        </div>
    );
}

// ─── Détail tâche ──────────
function TaskDetailPanel({ ft, onClose, onSave }: {
    ft: FlatTask; onClose: () => void; onSave: (ft: FlatTask, updatedTask: ProjectTask) => void;
}) {
    const { projectName } = ft;
    const [local, setLocal] = useState<ProjectTask>({ ...ft.task });
    const effectiveStatut = getEffectiveStatus(local);
    const cfg = statusCfg[effectiveStatut] || statusCfg["todo"];
    const sD = parseDate(local.dateDebut), eD = parseDate(local.dateFin);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const isLate = effectiveStatut === "en-retard";
    const dL = isLate && eD ? daysBetween(eD, now) : 0;
    const dur = (sD && eD) ? daysBetween(sD, eD) + 1 : 0;
    const sum = (arr: any[] | undefined) => (arr || []).reduce((a: number, b: any) => a + (Number(b.montant) || 0), 0);
    const tPE = sum(local.budgetEntreesPrev), tPS = sum(local.budgetSortiesPrev);
    const tRE = sum(local.budgetEntreesReel), tRS = sum(local.budgetSortiesReel);
    const set = (changes: Partial<ProjectTask>) => setLocal(prev => ({ ...prev, ...changes }));

    const handleValidate = () => {
        onSave(ft, { ...local, statut: getEffectiveStatus(local) });
        onClose();
    };

    const hasBudget = local.budgetEntreesPrev?.length || local.budgetSortiesPrev?.length || local.budgetEntreesReel?.length || local.budgetSortiesReel?.length;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t-2 border-vibrant-blue shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <input value={local.designation} onChange={e => set({ designation: e.target.value })} title="Désignation" placeholder="Nom de la tâche"
                        className="text-[14px] font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-vibrant-blue focus:outline-none flex-1 min-w-0" />
                </div>
                <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full shrink-0" title="Fermer"><X size={16} className="text-slate-500" /></button>
            </div>

            <div className="overflow-y-auto px-4 py-2 space-y-2.5 flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
                {/* Statut */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {(Object.entries(statusCfg) as [string, typeof statusCfg["todo"]][]).map(([k, c]) => (
                        <span key={k} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${effectiveStatut === k ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-white text-slate-300 border-slate-100"}`}>
                            {c.emoji} {c.label}
                        </span>
                    ))}
                    <span className="text-[9px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">📁 {projectName}</span>
                </div>

                {/* Dates */}
                <div className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div>
                            <label className="text-slate-800 block text-[9px] font-black mb-0.5">Début</label>
                            <input type="date" value={local.dateDebut || ""} onChange={e => set({ dateDebut: e.target.value })} title="Date début"
                                className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white" />
                        </div>
                        <span className="text-slate-300">→</span>
                        <div>
                            <label className="text-slate-800 block text-[9px] font-black mb-0.5">Fin</label>
                            <input type="date" value={local.dateFin || ""} onChange={e => set({ dateFin: e.target.value })} title="Date fin"
                                className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white" />
                        </div>
                        {dur > 0 && <span className="ml-auto text-vibrant-blue font-black text-[12px]">{dur}j</span>}
                    </div>
                    {isLate && dL > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-red-600 bg-red-50 rounded-lg px-2 py-0.5">
                            <AlertTriangle size={11} /><span className="text-[10px] font-bold">Retard : {dL}j</span>
                        </div>
                    )}
                </div>

                {/* Responsable */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase mb-0.5">👤 Responsable</h4>
                    <input value={local.responsable || ""} onChange={e => set({ responsable: e.target.value })} placeholder="Nom" title="Responsable"
                        className="w-full text-[11px] text-slate-700 font-bold border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30" />
                </div>

                <EditField label="Description" emoji="📝" value={local.description || ""} onChange={v => set({ description: v })} rows={2} />
                <EditField label="Objectifs" emoji="🎯" value={local.objectifs || ""} onChange={v => set({ objectifs: v })} bg="bg-blue-50" rows={2} />
                <EditField label="Risques" emoji="⚡" value={local.risques || ""} onChange={v => set({ risques: v })} bg="bg-red-50" />
                <EditField label="Suggestion" emoji="💡" value={local.suggestionResolution || ""} onChange={v => set({ suggestionResolution: v })} bg="bg-yellow-50" />
                <EditField label="Commentaires" emoji="💬" value={local.commentaires || ""} onChange={v => set({ commentaires: v })} rows={2} />

                {/* Budget détaillé */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase mb-1">💰 Gestion financière</h4>
                    {hasBudget ? (
                        <div className="space-y-1.5">
                            {local.budgetEntreesPrev?.length > 0 && (
                                <div className="bg-green-50 rounded-xl p-2 border border-green-200">
                                    <div className="text-[9px] font-black text-green-700 mb-1">💵 Entrées prévues — Total : {tPE.toLocaleString("fr-FR")} FCFA</div>
                                    {local.budgetEntreesPrev.map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-green-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-green-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {local.budgetSortiesPrev?.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-2 border border-red-200">
                                    <div className="text-[9px] font-black text-red-700 mb-1">📤 Sorties prévues — Total : {tPS.toLocaleString("fr-FR")} FCFA</div>
                                    {local.budgetSortiesPrev.map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-red-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-red-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {local.budgetEntreesReel?.length > 0 && (
                                <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200">
                                    <div className="text-[9px] font-black text-emerald-700 mb-1">✅ Entrées réelles — Total : {tRE.toLocaleString("fr-FR")} FCFA</div>
                                    {local.budgetEntreesReel.map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-emerald-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-emerald-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {local.budgetSortiesReel?.length > 0 && (
                                <div className="bg-orange-50 rounded-xl p-2 border border-orange-200">
                                    <div className="text-[9px] font-black text-orange-700 mb-1">💸 Sorties réelles — Total : {tRS.toLocaleString("fr-FR")} FCFA</div>
                                    {local.budgetSortiesReel.map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-orange-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-orange-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="bg-slate-100 rounded-xl p-2 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-800">Solde prévu</span>
                                <span className={`text-[12px] font-black ${(tPE - tPS) >= 0 ? "text-green-700" : "text-red-700"}`}>{(tPE - tPS).toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-slate-100 rounded-xl p-2 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-800">Solde réel</span>
                                <span className={`text-[12px] font-black ${(tRE - tRS) >= 0 ? "text-green-700" : "text-red-700"}`}>{(tRE - tRS).toLocaleString("fr-FR")} FCFA</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400 italic">Aucun budget défini</p>
                    )}
                </div>
            </div>

            {/* Valider / Annuler toujours visibles */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-t border-slate-200 bg-white">
                <button onClick={handleValidate}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-purple-700 text-white rounded-xl font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                    <CheckCircle2 size={16} /> Valider
                </button>
                <button onClick={onClose}
                    className="flex-1 py-2.5 bg-white text-red-600 rounded-xl font-extrabold text-[13px] border-2 border-red-300 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                    <X size={16} /> Annuler
                </button>
            </div>
        </div>
    );
}

// ─── Page intro ──────────
function TodoIntro({ totalTasks, totalProjects, onEnter }: { totalTasks: number; totalProjects: number; onEnter: () => void }) {
    return (
        <div className="flex-1 overflow-y-auto slide-in" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex flex-col items-center p-5 pb-6 min-h-full">
                <div className="w-full rounded-3xl bg-gradient-to-br from-[#1e3a8a] to-purple-700 p-6 mb-5 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
                        <ListChecks size={34} className="text-primary-yellow" />
                    </div>
                    <h1 className="text-[22px] font-black text-white mb-1 uppercase tracking-wide">Todo-Projet</h1>
                    <p className="text-[13px] font-bold text-primary-yellow">{totalTasks} tâche{totalTasks > 1 ? "s" : ""} • {totalProjects} projet{totalProjects > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 w-full mb-4">
                    <h2 className="text-[15px] font-black text-[#1e3a8a] mb-3">📌 Qu'est-ce que le Todo-Projet ?</h2>
                    <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                        Le <span className="font-black text-[#1e3a8a]">Todo-Projet</span> centralise toutes vos tâches avec <span className="font-bold text-purple-700">synchronisation temps réel</span> vers le projet et le Gantt.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🔵</span>
                            <span className="text-[12px] font-black text-blue-700">À faire</span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🟡</span>
                            <span className="text-[12px] font-black text-yellow-700">En cours</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🔴</span>
                            <span className="text-[12px] font-black text-red-700">En retard</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🟢</span>
                            <span className="text-[12px] font-black text-green-700">Terminé</span>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                        📁 Filtrez par <span className="font-bold">projet</span>, 👤 par <span className="font-bold">responsable</span> ou 📅 par <span className="font-bold">période</span>. Cliquez sur une tâche pour voir tous ses détails.
                    </p>
                </div>
                <button onClick={onEnter}
                    className="w-full py-4 bg-gradient-to-r from-[#1e3a8a] to-purple-700 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-[15px]">
                    Accéder au Todo-Projet <ArrowRight size={20} className="text-primary-yellow" />
                </button>
            </div>
        </div>
    );
}

// ─── Liste ──────────
function TodoList({ projects, onSaveTasks }: { projects: Project[]; onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void; onBack: () => void }) {
    const [filterProject, setFilterProject] = useState("all");
    const [filterResponsable, setFilterResponsable] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTask, setSelectedTask] = useState<FlatTask | null>(null);

    const allTasks = useMemo<FlatTask[]>(() => {
        const list: FlatTask[] = [];
        for (const p of projects) {
            if (p.tasks?.length) for (const t of p.tasks) {
                list.push({ task: { ...t, statut: getEffectiveStatus(t) }, projectId: p.id, projectName: p.info.name });
            }
        }
        return list;
    }, [projects]);

    const responsables = useMemo(() => {
        const s = new Set<string>();
        for (const t of allTasks) { if (t.task.responsable) s.add(t.task.responsable); }
        return Array.from(s).sort();
    }, [allTasks]);

    const filtered = useMemo(() => {
        let r = allTasks;
        if (filterProject !== "all") r = r.filter(t => t.projectId === filterProject);
        if (filterResponsable !== "all") r = r.filter(t => t.task.responsable === filterResponsable);
        if (filterStatus !== "all") r = r.filter(t => t.task.statut === filterStatus);
        if (dateStart) { const ds = new Date(dateStart + "T00:00:00"); r = r.filter(t => { const d = parseDate(t.task.dateDebut) || parseDate(t.task.dateFin); return d && d >= ds; }); }
        if (dateEnd) { const de = new Date(dateEnd + "T23:59:59"); r = r.filter(t => { const d = parseDate(t.task.dateFin) || parseDate(t.task.dateDebut); return d && d <= de; }); }
        if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); r = r.filter(t => t.task.designation.toLowerCase().includes(q) || (t.task.description || "").toLowerCase().includes(q)); }
        return r;
    }, [allTasks, filterProject, filterResponsable, filterStatus, dateStart, dateEnd, searchQuery]);

    const grouped = useMemo(() => {
        const map = new Map<string, FlatTask[]>();
        for (const t of filtered) { if (!map.has(t.projectId)) map.set(t.projectId, []); map.get(t.projectId)!.push(t); }
        for (const [, tasks] of map) {
            tasks.sort((a, b) => {
                const pr: Record<string, number> = { "en-retard": 0, "en-cours": 1, "todo": 2, "termine": 3 };
                const pa = pr[a.task.statut] ?? 4, pb = pr[b.task.statut] ?? 4;
                if (pa !== pb) return pa - pb;
                const da = parseDate(a.task.dateFin), db = parseDate(b.task.dateFin);
                return (da && db) ? da.getTime() - db.getTime() : 0;
            });
        }
        return map;
    }, [filtered]);

    const stats = useMemo(() => {
        const s: Record<string, number> = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) { if (s[t.task.statut] !== undefined) s[t.task.statut]++; }
        return s;
    }, [allTasks]);

    const updateTask = useCallback((projectId: string, updatedTask: ProjectTask) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const tasks = (project.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
        onSaveTasks(projectId, tasks);
    }, [projects, onSaveTasks]);

    const resetFilters = () => { setFilterProject("all"); setFilterResponsable("all"); setFilterStatus("all"); setSearchQuery(""); setDateStart(""); setDateEnd(""); };
    const hasFilters = filterProject !== "all" || filterResponsable !== "all" || filterStatus !== "all" || searchQuery || dateStart || dateEnd;

    return (
        <div className="flex-1 flex flex-col overflow-hidden slide-in">
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2">
                {/* Stats cliquables */}
                <div className="flex items-center gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <button onClick={() => setFilterStatus("all")}
                        className={`px-2 py-1 rounded-lg shrink-0 ${filterStatus === "all" ? "bg-slate-700 text-white" : "bg-slate-100 text-black font-bold"}`}>
                        <span className="text-[10px] font-black">Tous ({stats.total})</span>
                    </button>
                    {Object.entries(statusCfg).map(([k, c]) => (
                        <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 ${filterStatus === k ? `${c.bg} ${c.text} ring-2 ring-offset-1 ${c.border}` : `${c.bg} ${c.text} opacity-70`}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-[9px] font-black">{c.emoji} {stats[k] || 0}</span>
                        </button>
                    ))}
                </div>
                {/* Recherche */}
                <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..."
                        className="w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30" />
                </div>
                {/* Filtres projet + responsable sur même ligne */}
                <div className="flex items-center gap-1 mb-2">
                    <Filter size={10} className="text-black shrink-0" />
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} title="Projet"
                        className="text-[9px] font-black border border-slate-200 rounded-lg px-1 py-0.5 bg-white text-black focus:outline-none max-w-[140px]">
                        <option value="all">📁 Projets</option>
                        {projects.filter(p => p.tasks?.length).map(p => <option key={p.id} value={p.id}>📁 {p.info.name}</option>)}
                    </select>
                    <select value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)} title="Responsable"
                        className="text-[9px] font-black border border-slate-200 rounded-lg px-1 py-0.5 bg-white text-black focus:outline-none max-w-[120px]">
                        <option value="all">👤 Resp.</option>
                        {responsables.map(r => <option key={r} value={r}>👤 {r}</option>)}
                    </select>
                    {hasFilters && <button onClick={resetFilters} className="p-0.5 rounded bg-red-50 shrink-0"><RotateCcw size={10} className="text-red-400" /></button>}
                </div>
                {/* Dates */}
                <div className="flex items-center gap-1.5">
                    <Calendar size={10} className="text-black shrink-0" />
                    <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} title="Début"
                        className="text-[9px] font-black border border-slate-200 rounded-lg px-1 py-0.5 bg-white text-black w-[100px]" />
                    <span className="text-[9px] text-black font-black">→</span>
                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} title="Fin"
                        className="text-[9px] font-black border border-slate-200 rounded-lg px-1 py-0.5 bg-white text-black w-[100px]" />
                    {(dateStart || dateEnd) && <button onClick={() => { setDateStart(""); setDateEnd(""); }} className="text-[8px] font-bold text-red-400">✕</button>}
                </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {Array.from(grouped.entries()).map(([pid, tasks]) => (
                    <div key={pid} className="mb-3">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <ChevronDown size={14} className="text-slate-400" />
                            <span className="text-[12px] font-black text-black truncate flex-1">{projects.find(p => p.id === pid)?.info.name}</span>
                            <span className="text-[9px] font-bold text-white bg-vibrant-blue px-2 py-0.5 rounded-full">{tasks.length}</span>
                            {tasks.filter(t => t.task.statut === "en-retard").length > 0 && (
                                <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full"><AlertTriangle size={8} className="inline" /> {tasks.filter(t => t.task.statut === "en-retard").length}</span>
                            )}
                        </div>
                        <div className="space-y-2 pl-1">
                            {tasks.map(ft => {
                                const c = statusCfg[ft.task.statut] || statusCfg["todo"];
                                const sD = parseDate(ft.task.dateDebut), eD = parseDate(ft.task.dateFin);
                                const isLate = ft.task.statut === "en-retard";
                                const dL = isLate && eD ? Math.ceil((Date.now() - eD.getTime()) / 86400000) : 0;
                                return (
                                    <button key={ft.task.id} onClick={() => setSelectedTask(selectedTask?.task.id === ft.task.id ? null : ft)}
                                        className={`w-full rounded-2xl border-2 ${c.border} ${c.bg} p-3 shadow-sm transition-all text-left active:scale-[0.98] ${selectedTask?.task.id === ft.task.id ? "ring-2 ring-vibrant-blue ring-offset-1" : ""}`}>
                                        <div className="flex items-start gap-2 mb-1">
                                            <span className={`w-3 h-3 rounded-full ${c.dot} shrink-0 mt-0.5`} />
                                            <p className="text-[13px] font-black text-black leading-tight flex-1">{ft.task.designation}</p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.bg} ${c.text} border ${c.border}`}>{c.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar size={9} /> {sD ? fmtDate(sD) : "—"} → {eD ? fmtDate(eD) : "—"}</span>
                                            {ft.task.responsable && <span className="flex items-center gap-1"><User size={9} /> {ft.task.responsable}</span>}
                                            {isLate && dL > 0 && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={9} /> {dL}j</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-black font-bold text-sm">Aucune tâche trouvée</p>
                        <button onClick={resetFilters} className="mt-2 text-[11px] font-bold text-vibrant-blue">Réinitialiser</button>
                    </div>
                )}
            </div>

            {selectedTask && <TaskDetailPanel ft={selectedTask} onClose={() => setSelectedTask(null)} onSave={(ft: FlatTask, updatedTask: ProjectTask) => { updateTask(ft.projectId, updatedTask); setSelectedTask(null); }} />}
        </div>
    );
}

export default function TodoProjet({ projects, onSaveTasks }: TodoProjetProps) {
    const [showList, setShowList] = useState(false);
    const allTasks = useMemo(() => { let c = 0; for (const p of projects) { if (p.tasks?.length) c += p.tasks.length; } return c; }, [projects]);
    const projCount = useMemo(() => projects.filter(p => p.tasks?.length).length, [projects]);

    if (!showList) return <TodoIntro totalTasks={allTasks} totalProjects={projCount} onEnter={() => setShowList(true)} />;
    return <TodoList projects={projects} onSaveTasks={onSaveTasks} onBack={() => setShowList(false)} />;
}