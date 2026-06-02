"use client";

import { useState, useMemo, useCallback } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    ListChecks, Filter, ChevronDown, ChevronRight,
    Calendar, User, AlertTriangle, CheckCircle2, Clock,
    RotateCcw, Search,
} from "lucide-react";

interface TodoProjetProps {
    projects: Project[];
    onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void;
}

// Config des statuts avec couleurs du SaaS
const statusCfg: Record<string, { bg: string; border: string; text: string; dot: string; label: string; icon: any }> = {
    "todo": { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", dot: "bg-blue-500", label: "À faire", icon: Clock },
    "en-cours": { bg: "bg-yellow-50", border: "border-primary-yellow", text: "text-yellow-700", dot: "bg-primary-yellow", label: "En cours", icon: Clock },
    "en-retard": { bg: "bg-red-50", border: "border-red-400", text: "text-red-700", dot: "bg-red-500", label: "En retard", icon: AlertTriangle },
    "termine": { bg: "bg-green-50", border: "border-green-400", text: "text-green-700", dot: "bg-green-500", label: "Terminé", icon: CheckCircle2 },
};

function parseDate(d: string): Date | null { if (!d) return null; const p = new Date(d); return isNaN(p.getTime()) ? null : p; }
function fmtDate(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function toDateStr(d: Date): string { return d.toISOString().split("T")[0]; }

interface FlatTask { task: ProjectTask; projectId: string; projectName: string; }

export default function TodoProjet({ projects, onSaveTasks }: TodoProjetProps) {
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterResponsable, setFilterResponsable] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

    // Toutes les tâches aplaties
    const allTasks = useMemo<FlatTask[]>(() => {
        const list: FlatTask[] = [];
        for (const p of projects) {
            if (p.tasks?.length) {
                for (const t of p.tasks) {
                    list.push({ task: t, projectId: p.id, projectName: p.info.name });
                }
            }
        }
        return list;
    }, [projects]);

    // Liste des responsables uniques
    const responsables = useMemo(() => {
        const set = new Set<string>();
        for (const t of allTasks) { if (t.task.responsable) set.add(t.task.responsable); }
        return Array.from(set).sort();
    }, [allTasks]);

    // Tâches filtrées
    const filtered = useMemo(() => {
        let result = allTasks;
        if (filterProject !== "all") result = result.filter(t => t.projectId === filterProject);
        if (filterResponsable !== "all") result = result.filter(t => t.task.responsable === filterResponsable);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.task.designation.toLowerCase().includes(q) || t.task.description?.toLowerCase().includes(q));
        }
        return result;
    }, [allTasks, filterProject, filterResponsable, searchQuery]);

    // Grouper par projet + trier (en-retard en haut dans chaque groupe)
    const grouped = useMemo(() => {
        const map = new Map<string, FlatTask[]>();
        for (const t of filtered) {
            if (!map.has(t.projectId)) map.set(t.projectId, []);
            map.get(t.projectId)!.push(t);
        }
        // Trier chaque groupe : en-retard en haut, puis par dateFin
        for (const [, tasks] of map) {
            tasks.sort((a, b) => {
                const priority: Record<string, number> = { "en-retard": 0, "en-cours": 1, "todo": 2, "termine": 3 };
                const pa = priority[a.task.statut] ?? 4, pb = priority[b.task.statut] ?? 4;
                if (pa !== pb) return pa - pb;
                const da = parseDate(a.task.dateFin), db = parseDate(b.task.dateFin);
                if (da && db) return da.getTime() - db.getTime();
                return 0;
            });
        }
        return map;
    }, [filtered]);

    // Stats
    const stats = useMemo(() => {
        const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) s[t.task.statut]++;
        return s;
    }, [allTasks]);

    // Vérifier statut automatique selon dates
    const getAutoStatus = useCallback((task: ProjectTask): ProjectTask["statut"] => {
        if (task.statut === "termine") return "termine";
        const fin = parseDate(task.dateFin);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (fin && fin < now) return "en-retard";
        const debut = parseDate(task.dateDebut);
        if (debut && debut <= now) return "en-cours";
        return "todo";
    }, []);

    // Mise à jour d'une tâche (synchronisée avec le projet)
    const updateTask = useCallback((projectId: string, updatedTask: ProjectTask) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const tasks = (project.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
        onSaveTasks(projectId, tasks);
    }, [projects, onSaveTasks]);

    // Changer les dates directement
    const handleDateChange = useCallback((ft: FlatTask, field: "dateDebut" | "dateFin", value: string) => {
        const updated = { ...ft.task, [field]: value };
        // Auto-détection du statut
        const autoStatus = getAutoStatus(updated);
        updated.statut = autoStatus;
        updateTask(ft.projectId, updated);
    }, [updateTask, getAutoStatus]);

    // Changer le statut manuellement
    const handleStatusChange = useCallback((ft: FlatTask, statut: ProjectTask["statut"]) => {
        updateTask(ft.projectId, { ...ft.task, statut });
    }, [updateTask]);

    const toggleProject = (pid: string) => {
        setCollapsedProjects(prev => { const n = new Set(prev); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; });
    };

    const resetFilters = () => {
        setFilterProject("all");
        setFilterResponsable("all");
        setSearchQuery("");
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
            {/* Barre supérieure */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <ListChecks size={16} className="text-primary-yellow" />
                        <h2 className="text-[12px] font-black text-slate-800 uppercase">Todo-Projet</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{stats.total} tâche{stats.total > 1 ? "s" : ""}</span>
                </div>

                {/* Stats rapides */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {Object.entries(statusCfg).map(([k, c]) => (
                        <div key={k} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${c.bg} shrink-0`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className={`text-[9px] font-bold ${c.text}`}>{c.label}</span>
                            <span className={`text-[9px] font-black ${c.text}`}>({stats[k as keyof typeof stats]})</span>
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

                    {/* Filtre par projet */}
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} title="Filtrer par projet" aria-label="Filtrer par projet"
                        className="text-[9px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none">
                        <option value="all">📁 Tous les projets</option>
                        {projects.filter(p => p.tasks?.length).map(p => (
                            <option key={p.id} value={p.id}>📁 {p.info.name}</option>
                        ))}
                    </select>

                    {/* Filtre par responsable */}
                    <select value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)} title="Filtrer par responsable" aria-label="Filtrer par responsable"
                        className="text-[9px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none">
                        <option value="all">👤 Tous</option>
                        {responsables.map(r => (
                            <option key={r} value={r}>👤 {r}</option>
                        ))}
                    </select>

                    {(filterProject !== "all" || filterResponsable !== "all" || searchQuery) && (
                        <button onClick={resetFilters} className="p-1 rounded-lg bg-slate-100" title="Réinitialiser">
                            <RotateCcw size={10} className="text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des tâches groupées par projet */}
            <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {Array.from(grouped.entries()).map(([pid, tasks]) => {
                    const collapsed = collapsedProjects.has(pid);
                    const project = projects.find(p => p.id === pid);
                    const name = project?.info.name || "Projet";
                    // Compteurs par statut pour ce projet
                    const projStats = { "en-retard": 0, "en-cours": 0, "todo": 0, termine: 0 };
                    for (const t of tasks) projStats[t.task.statut]++;

                    return (
                        <div key={pid} className="mb-3">
                            {/* En-tête projet */}
                            <button onClick={() => toggleProject(pid)}
                                className="w-full flex items-center gap-2 px-1 mb-2">
                                {collapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                <span className="text-[12px] font-black text-slate-800 truncate flex-1 text-left">{name}</span>
                                <span className="text-[9px] font-bold text-white bg-vibrant-blue px-2 py-0.5 rounded-full">{tasks.length}</span>
                                {projStats["en-retard"] > 0 && (
                                    <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <AlertTriangle size={8} /> {projStats["en-retard"]}
                                    </span>
                                )}
                            </button>

                            {/* Tâches */}
                            {!collapsed && (
                                <div className="space-y-2 pl-1">
                                    {tasks.map(ft => {
                                        const cfg = statusCfg[ft.task.statut] || statusCfg["todo"];
                                        const sD = parseDate(ft.task.dateDebut);
                                        const eD = parseDate(ft.task.dateFin);
                                        const isEditing = editingTaskId === ft.task.id;
                                        const isLate = ft.task.statut === "en-retard";
                                        const daysLate = isLate && eD ? Math.ceil((Date.now() - eD.getTime()) / 86400000) : 0;

                                        return (
                                            <div key={ft.task.id}
                                                className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-3 shadow-sm transition-all`}>
                                                {/* Ligne 1 : indicateur + nom + statut */}
                                                <div className="flex items-start gap-2 mb-2">
                                                    <span className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0 mt-0.5`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-black text-slate-800 leading-tight">{ft.task.designation}</p>
                                                        {ft.task.description && (
                                                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5 line-clamp-2">{ft.task.description}</p>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                {/* Ligne 2 : dates (modifiables) */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={10} className="text-slate-400 shrink-0" />
                                                    {isEditing ? (
                                                        <>
                                                            <input type="date" value={ft.task.dateDebut || ""}
                                                                onChange={e => handleDateChange(ft, "dateDebut", e.target.value)}
                                                                title="Date début" aria-label="Date début"
                                                                className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white w-[100px]" />
                                                            <span className="text-[9px] text-slate-400">→</span>
                                                            <input type="date" value={ft.task.dateFin || ""}
                                                                onChange={e => handleDateChange(ft, "dateFin", e.target.value)}
                                                                title="Date fin" aria-label="Date fin"
                                                                className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white w-[100px]" />
                                                            <button onClick={() => setEditingTaskId(null)}
                                                                className="text-[9px] font-bold text-vibrant-blue px-2 py-0.5 rounded-lg bg-blue-50">
                                                                OK
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => setEditingTaskId(ft.task.id)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-vibrant-blue transition-colors">
                                                            <span>{sD ? fmtDate(sD) : "—"}</span>
                                                            <span className="text-slate-300">→</span>
                                                            <span>{eD ? fmtDate(eD) : "—"}</span>
                                                            <span className="text-[8px] text-slate-400 ml-1">✏️</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Ligne 3 : responsable + retard */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {ft.task.responsable && (
                                                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                                                <User size={10} /> {ft.task.responsable}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLate && daysLate > 0 && (
                                                        <span className="text-[9px] font-bold text-red-600 flex items-center gap-1">
                                                            <AlertTriangle size={10} /> Retard : {daysLate}j
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions rapides : changer le statut */}
                                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200/50">
                                                    <span className="text-[8px] font-bold text-slate-400 mr-1">Statut :</span>
                                                    {(Object.entries(statusCfg) as [string, typeof statusCfg["todo"]][]).map(([k, c]) => (
                                                        <button key={k} onClick={() => handleStatusChange(ft, k as ProjectTask["statut"])}
                                                            className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all ${ft.task.statut === k
                                                                ? `${c.bg} ${c.text} ${c.border} shadow-sm`
                                                                : "bg-white text-slate-400 border-slate-200"
                                                                }`}>
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-slate-400 font-bold text-sm">Aucune tâche trouvée</p>
                        <button onClick={resetFilters} className="mt-2 text-[11px] font-bold text-vibrant-blue">Réinitialiser les filtres</button>
                    </div>
                )}
            </div>
        </div>
    );
}