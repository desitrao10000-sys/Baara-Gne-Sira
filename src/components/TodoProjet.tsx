"use client";

import { useState, useMemo, useCallback } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    ListChecks, Filter, ChevronDown, ChevronRight,
    Calendar, User, AlertTriangle, CheckCircle2, Clock,
    RotateCcw, Search, X, ArrowUp, ArrowDown,
} from "lucide-react";

interface TodoProjetProps {
    projects: Project[];
    onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void;
}

const statusCfg: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
    "todo": { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", dot: "bg-blue-500", label: "À faire" },
    "en-cours": { bg: "bg-yellow-50", border: "border-primary-yellow", text: "text-yellow-700", dot: "bg-primary-yellow", label: "En cours" },
    "en-retard": { bg: "bg-red-50", border: "border-red-400", text: "text-red-700", dot: "bg-red-500", label: "En retard" },
    "termine": { bg: "bg-green-50", border: "border-green-400", text: "text-green-700", dot: "bg-green-500", label: "Terminé" },
};

function parseDate(d: string): Date | null { if (!d) return null; const p = new Date(d); return isNaN(p.getTime()) ? null : p; }
function fmtDate(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function fmtFull(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
function daysBetween(a: Date, b: Date): number { return Math.ceil((b.getTime() - a.getTime()) / 86400000); }

interface FlatTask { task: ProjectTask; projectId: string; projectName: string; }

// ─── Détail complet tâche (même style que projet) ──────────
function TaskDetailPanel({ ft, onClose, onDateChange, onStatusChange }: {
    ft: FlatTask; onClose: () => void;
    onDateChange: (ft: FlatTask, field: "dateDebut" | "dateFin", value: string) => void;
    onStatusChange: (ft: FlatTask, statut: ProjectTask["statut"]) => void;
}) {
    const { task, projectName } = ft;
    const cfg = statusCfg[task.statut] || statusCfg["todo"];
    const sD = parseDate(task.dateDebut), eD = parseDate(task.dateFin);
    const isLate = task.statut === "en-retard" && eD && eD < new Date();
    const dL = isLate && eD ? daysBetween(eD, new Date()) : 0;
    const dur = (sD && eD) ? daysBetween(sD, eD) + 1 : 0;

    const tPE = (task.budgetEntreesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tPS = (task.budgetSortiesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tRE = (task.budgetEntreesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tRS = (task.budgetSortiesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);

    return (
        <div className="shrink-0 bg-white rounded-t-3xl border-t-2 border-vibrant-blue shadow-2xl max-h-[75vh] flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot}`} />
                    <h3 className="text-[14px] font-black text-slate-800 truncate">{task.designation}</h3>
                </div>
                <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full shrink-0" title="Fermer" aria-label="Fermer">
                    <X size={16} className="text-slate-500" />
                </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {/* Statut + Projet */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[10px] font-semibold text-slate-500">📁 {projectName}</span>
                </div>

                {/* Dates modifiables */}
                {(sD || eD) && (
                    <div className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
                            <div>
                                <span className="text-slate-400 block text-[9px]">Début</span>
                                <input type="date" value={task.dateDebut || ""} onChange={e => onDateChange(ft, "dateDebut", e.target.value)}
                                    title="Date début" aria-label="Date début"
                                    className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white" />
                            </div>
                            <span className="text-slate-300">→</span>
                            <div>
                                <span className="text-slate-400 block text-[9px]">Fin</span>
                                <input type="date" value={task.dateFin || ""} onChange={e => onDateChange(ft, "dateFin", e.target.value)}
                                    title="Date fin" aria-label="Date fin"
                                    className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white" />
                            </div>
                            {dur > 0 && <div className="ml-auto"><span className="text-slate-400 block text-[9px]">Durée</span><span className="text-vibrant-blue font-black">{dur}j</span></div>}
                        </div>
                        {isLate && dL > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-red-600 bg-red-50 rounded-lg px-2 py-1">
                                <AlertTriangle size={12} /><span className="text-[10px] font-bold">Retard : {dL} jour(s)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Changer statut */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400">Statut :</span>
                    {(Object.entries(statusCfg) as [string, typeof statusCfg["todo"]][]).map(([k, c]) => (
                        <button key={k} onClick={() => onStatusChange(ft, k as ProjectTask["statut"])}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${task.statut === k ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-white text-slate-400 border-slate-200"}`}>
                            {c.label}
                        </button>
                    ))}
                </div>

                {task.description && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Description</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.description}</p></div>)}
                {task.responsable && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Responsable</h4><p className="text-[11px] text-slate-700 font-semibold">👤 {task.responsable}</p></div>)}
                {task.objectifs && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Objectifs</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.objectifs}</p></div>)}
                {(tPE > 0 || tPS > 0 || tRE > 0 || tRS > 0) && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Budget</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 rounded-xl p-2"><span className="text-[9px] font-bold text-green-600 block">Entrées prévues</span><span className="text-[12px] font-black text-green-700">{tPE.toLocaleString("fr-FR")} FCFA</span></div>
                            <div className="bg-red-50 rounded-xl p-2"><span className="text-[9px] font-bold text-red-600 block">Sorties prévues</span><span className="text-[12px] font-black text-red-700">{tPS.toLocaleString("fr-FR")} FCFA</span></div>
                            <div className="bg-emerald-50 rounded-xl p-2"><span className="text-[9px] font-bold text-emerald-600 block">Entrées réelles</span><span className="text-[12px] font-black text-emerald-700">{tRE.toLocaleString("fr-FR")} FCFA</span></div>
                            <div className="bg-orange-50 rounded-xl p-2"><span className="text-[9px] font-bold text-orange-600 block">Sorties réelles</span><span className="text-[12px] font-black text-orange-700">{tRS.toLocaleString("fr-FR")} FCFA</span></div>
                        </div>
                    </div>
                )}
                {task.risques && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Risques</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.risques}</p></div>)}
                {task.suggestionResolution && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Suggestion</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.suggestionResolution}</p></div>)}
                {task.commentaires && (<div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Commentaires</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.commentaires}</p></div>)}
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────
export default function TodoProjet({ projects, onSaveTasks }: TodoProjetProps) {
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterResponsable, setFilterResponsable] = useState<string>("all");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    const [useDateFilter, setUseDateFilter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTask, setSelectedTask] = useState<FlatTask | null>(null);

    const allTasks = useMemo<FlatTask[]>(() => {
        const list: FlatTask[] = [];
        for (const p of projects) {
            if (p.tasks?.length) for (const t of p.tasks) list.push({ task: t, projectId: p.id, projectName: p.info.name });
        }
        return list;
    }, [projects]);

    const responsables = useMemo(() => {
        const set = new Set<string>();
        for (const t of allTasks) { if (t.task.responsable) set.add(t.task.responsable); }
        return Array.from(set).sort();
    }, [allTasks]);

    const filtered = useMemo(() => {
        let result = allTasks;
        if (filterProject !== "all") result = result.filter(t => t.projectId === filterProject);
        if (filterResponsable !== "all") result = result.filter(t => t.task.responsable === filterResponsable);
        if (useDateFilter && dateStart) {
            const ds = new Date(dateStart);
            result = result.filter(t => { const d = parseDate(t.task.dateDebut) || parseDate(t.task.dateFin); return d && d >= ds; });
        }
        if (useDateFilter && dateEnd) {
            const de = new Date(dateEnd);
            result = result.filter(t => { const d = parseDate(t.task.dateFin) || parseDate(t.task.dateDebut); return d && d <= de; });
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.task.designation.toLowerCase().includes(q) || t.task.description?.toLowerCase().includes(q));
        }
        return result;
    }, [allTasks, filterProject, filterResponsable, useDateFilter, dateStart, dateEnd, searchQuery]);

    // Grouper par projet + trier (en-retard en haut)
    const grouped = useMemo(() => {
        const map = new Map<string, FlatTask[]>();
        for (const t of filtered) {
            if (!map.has(t.projectId)) map.set(t.projectId, []);
            map.get(t.projectId)!.push(t);
        }
        for (const [, tasks] of map) {
            tasks.sort((a, b) => {
                const p: Record<string, number> = { "en-retard": 0, "en-cours": 1, "todo": 2, "termine": 3 };
                const pa = p[a.task.statut] ?? 4, pb = p[b.task.statut] ?? 4;
                if (pa !== pb) return pa - pb;
                const da = parseDate(a.task.dateFin), db = parseDate(b.task.dateFin);
                if (da && db) return da.getTime() - db.getTime();
                return 0;
            });
        }
        return map;
    }, [filtered]);

    const stats = useMemo(() => {
        const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) s[t.task.statut]++;
        return s;
    }, [allTasks]);

    const getAutoStatus = useCallback((task: ProjectTask): ProjectTask["statut"] => {
        if (task.statut === "termine") return "termine";
        const fin = parseDate(task.dateFin);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (fin && fin < now) return "en-retard";
        const debut = parseDate(task.dateDebut);
        if (debut && debut <= now) return "en-cours";
        return "todo";
    }, []);

    const updateTask = useCallback((projectId: string, updatedTask: ProjectTask) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const tasks = (project.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
        onSaveTasks(projectId, tasks);
    }, [projects, onSaveTasks]);

    const handleDateChange = useCallback((ft: FlatTask, field: "dateDebut" | "dateFin", value: string) => {
        const updated = { ...ft.task, [field]: value };
        updated.statut = getAutoStatus(updated);
        updateTask(ft.projectId, updated);
    }, [updateTask, getAutoStatus]);

    const handleStatusChange = useCallback((ft: FlatTask, statut: ProjectTask["statut"]) => {
        updateTask(ft.projectId, { ...ft.task, statut });
        if (selectedTask?.task.id === ft.task.id) setSelectedTask({ ...ft, task: { ...ft.task, statut } });
    }, [updateTask, selectedTask]);

    const resetFilters = () => {
        setFilterProject("all"); setFilterResponsable("all"); setSearchQuery("");
        setUseDateFilter(false); setDateStart(""); setDateEnd("");
    };

    if (!allTasks.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 slide-in">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <ListChecks size={36} className="text-primary-yellow" />
                </div>
                <h2 className="text-lg font-black text-slate-800 mb-2">Todo-Projet</h2>
                <p className="text-xs text-slate-600 font-semibold text-center">Aucune tâche. Créez des projets avec des tâches pour commencer.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden slide-in">
            {/* En-tête violet */}
            <div className="shrink-0 bg-gradient-to-r from-purple-700 to-violet-600 px-4 py-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <ListChecks size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-black text-white uppercase tracking-wide">Todo-Projet</h1>
                        <p className="text-[10px] font-bold text-white/70">{stats.total} tâche{stats.total > 1 ? "s" : ""} • {projects.filter(p => p.tasks?.length).length} projet{projects.filter(p => p.tasks?.length).length > 1 ? "s" : ""}</p>
                    </div>
                </div>
                <p className="text-[10px] text-white/80 leading-relaxed">
                    Le <span className="font-black text-white">Todo-Projet</span> est votre tableau de bord de suivi des tâches. Il centralise toutes les tâches de vos projets avec une synchronisation en temps réel. Les tâches en retard remontent automatiquement en priorité. Utilisez les filtres pour visualiser par <span className="font-bold text-white">projet</span>, par <span className="font-bold text-white">responsable</span> ou par <span className="font-bold text-white">période</span>. Cliquez sur une tâche pour voir tous ses détails et modifier les dates directement.
                </p>
            </div>

            {/* Barre de filtres */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2">
                {/* Stats */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {Object.entries(statusCfg).map(([k, c]) => (
                        <div key={k} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${c.bg} shrink-0`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className={`text-[9px] font-bold ${c.text}`}>{c.label} ({stats[k as keyof typeof stats]})</span>
                        </div>
                    ))}
                </div>

                {/* Recherche */}
                <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une tâche..."
                        className="w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30" />
                </div>

                {/* Filtres */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Filter size={10} className="text-slate-400 shrink-0" />
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} title="Filtrer par projet" aria-label="Filtrer par projet"
                        className="text-[9px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none">
                        <option value="all">📁 Tous les projets</option>
                        {projects.filter(p => p.tasks?.length).map(p => (<option key={p.id} value={p.id}>📁 {p.info.name}</option>))}
                    </select>
                    <select value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)} title="Filtrer par responsable" aria-label="Filtrer par responsable"
                        className="text-[9px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none">
                        <option value="all">👤 Tous</option>
                        {responsables.map(r => (<option key={r} value={r}>👤 {r}</option>))}
                    </select>

                    {/* Filtre date */}
                    <button onClick={() => setUseDateFilter(!useDateFilter)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg shrink-0 ${useDateFilter ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"}`}>
                        📅 Période
                    </button>
                    {useDateFilter && (
                        <>
                            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} title="Date début" aria-label="Date début période"
                                className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[100px]" />
                            <span className="text-[9px] text-slate-400">→</span>
                            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} title="Date fin" aria-label="Date fin période"
                                className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[100px]" />
                        </>
                    )}

                    {(filterProject !== "all" || filterResponsable !== "all" || searchQuery || useDateFilter) && (
                        <button onClick={resetFilters} className="p-1 rounded-lg bg-slate-100" title="Réinitialiser"><RotateCcw size={10} className="text-slate-400" /></button>
                    )}
                </div>
            </div>

            {/* Liste des tâches */}
            <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {Array.from(grouped.entries()).map(([pid, tasks]) => (
                    <div key={pid} className="mb-3">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <ChevronDown size={14} className="text-slate-400" />
                            <span className="text-[12px] font-black text-slate-800 truncate flex-1">{projects.find(p => p.id === pid)?.info.name || "Projet"}</span>
                            <span className="text-[9px] font-bold text-white bg-vibrant-blue px-2 py-0.5 rounded-full">{tasks.length}</span>
                            {tasks.filter(t => t.task.statut === "en-retard").length > 0 && (
                                <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <AlertTriangle size={8} /> {tasks.filter(t => t.task.statut === "en-retard").length}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 pl-1">
                            {tasks.map(ft => {
                                const cfg = statusCfg[ft.task.statut] || statusCfg["todo"];
                                const sD = parseDate(ft.task.dateDebut), eD = parseDate(ft.task.dateFin);
                                const isLate = ft.task.statut === "en-retard";
                                const daysLate = isLate && eD ? Math.ceil((Date.now() - eD.getTime()) / 86400000) : 0;

                                return (
                                    <button key={ft.task.id} onClick={() => setSelectedTask(selectedTask?.task.id === ft.task.id ? null : ft)}
                                        className={`w-full rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-3 shadow-sm transition-all text-left active:scale-[0.98] ${selectedTask?.task.id === ft.task.id ? "ring-2 ring-vibrant-blue ring-offset-1" : ""}`}>
                                        <div className="flex items-start gap-2 mb-1.5">
                                            <span className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0 mt-0.5`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-black text-slate-800 leading-tight">{ft.task.designation}</p>
                                                {ft.task.description && <p className="text-[10px] text-slate-500 font-semibold mt-0.5 line-clamp-1">{ft.task.description}</p>}
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{cfg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar size={9} /> {sD ? fmtDate(sD) : "—"} → {eD ? fmtDate(eD) : "—"}</span>
                                            {ft.task.responsable && <span className="flex items-center gap-1"><User size={9} /> {ft.task.responsable}</span>}
                                            {isLate && daysLate > 0 && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={9} /> {daysLate}j</span>}
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
                        <p className="text-slate-400 font-bold text-sm">Aucune tâche trouvée</p>
                        <button onClick={resetFilters} className="mt-2 text-[11px] font-bold text-vibrant-blue">Réinitialiser les filtres</button>
                    </div>
                )}
            </div>

            {/* Détail tâche sélectionnée */}
            {selectedTask && <TaskDetailPanel ft={selectedTask} onClose={() => setSelectedTask(null)} onDateChange={handleDateChange} onStatusChange={handleStatusChange} />}
        </div>
    );
}