"use client";

import { useState, useMemo, useCallback } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    ListChecks, Filter, ChevronDown,
    Calendar, User, AlertTriangle, CheckCircle2, Clock,
    RotateCcw, Search, X, ArrowRight, Target,
} from "lucide-react";

interface TodoProjetProps {
    projects: Project[];
    onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void;
}

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

// ─── Champ éditable ──────────
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

// ─── Calcul du statut effectif basé sur les dates ──────────
function getEffectiveStatus(task: ProjectTask): ProjectTask["statut"] {
    if (task.statut === "termine") return "termine";
    const fin = parseDate(task.dateFin);
    const debut = parseDate(task.dateDebut);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    // Date fin passée → en retard
    if (fin && fin < now) return "en-retard";
    // Date début passée ou aujourd'hui et date fin future → en cours
    if (debut && debut <= now && (!fin || fin >= now)) return "en-cours";
    // Date début future → à faire
    return "todo";
}

// ─── Détail complet tâche (édition locale + Valider/Annuler) ──────────
function TaskDetailPanel({ ft, onClose, onSave }: {
    ft: FlatTask; onClose: () => void;
    onSave: (ft: FlatTask, updatedTask: ProjectTask) => void;
}) {
    const { projectName } = ft;
    // État local pour les modifications
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
        const toSave = { ...local, statut: getEffectiveStatus(local) };
        onSave(ft, toSave);
        onClose();
    };

    return (
        <div className="shrink-0 bg-white rounded-t-3xl border-t-2 border-vibrant-blue shadow-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <input value={local.designation} onChange={e => set({ designation: e.target.value })} title="Désignation" placeholder="Nom de la tâche"
                        className="text-[15px] font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-vibrant-blue focus:outline-none flex-1 min-w-0" />
                </div>
                <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full shrink-0" title="Fermer" aria-label="Fermer">
                    <X size={16} className="text-slate-500" />
                </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
                {/* Statut automatique + Projet */}
                <div className="flex flex-wrap items-center gap-2">
                    {(Object.entries(statusCfg) as [string, typeof statusCfg["todo"]][]).map(([k, c]) => (
                        <span key={k} className={`text-[10px] font-bold px-3 py-1 rounded-full border ${effectiveStatut === k ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-white text-slate-300 border-slate-100"}`}>
                            {c.emoji} {c.label}
                        </span>
                    ))}
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-full">📁 {projectName}</span>
                </div>

                {/* Dates modifiables */}
                <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div>
                            <label className="text-slate-800 block text-[10px] font-black mb-0.5">Date début</label>
                            <input type="date" value={local.dateDebut || ""} onChange={e => set({ dateDebut: e.target.value })}
                                title="Date début" aria-label="Date début"
                                className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white" />
                        </div>
                        <span className="text-slate-300 text-lg">→</span>
                        <div>
                            <label className="text-slate-800 block text-[10px] font-black mb-0.5">Date fin</label>
                            <input type="date" value={local.dateFin || ""} onChange={e => set({ dateFin: e.target.value })}
                                title="Date fin" aria-label="Date fin"
                                className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white" />
                        </div>
                        {dur > 0 && (
                            <div className="ml-auto text-right">
                                <span className="text-slate-800 block text-[10px] font-black">Durée</span>
                                <span className="text-vibrant-blue font-black text-[14px]">{dur}j</span>
                            </div>
                        )}
                    </div>
                    {isLate && dL > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 bg-red-50 rounded-lg px-2 py-1">
                            <AlertTriangle size={12} /><span className="text-[11px] font-bold">Retard : {dL} jour(s) dépassé(s)</span>
                        </div>
                    )}
                </div>

                {/* Responsable */}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-1">👤 Responsable</h4>
                    <input value={local.responsable || ""} onChange={e => set({ responsable: e.target.value })} placeholder="Nom du responsable" title="Responsable"
                        className="w-full text-[12px] text-slate-700 font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30" />
                </div>

                {/* Champs éditables */}
                <EditField label="Description" emoji="📝" value={local.description || ""} onChange={v => set({ description: v })} rows={3} />
                <EditField label="Objectifs" emoji="🎯" value={local.objectifs || ""} onChange={v => set({ objectifs: v })} bg="bg-blue-50" rows={3} />
                <EditField label="Risques" emoji="⚡" value={local.risques || ""} onChange={v => set({ risques: v })} bg="bg-red-50" />
                <EditField label="Suggestion de résolution" emoji="💡" value={local.suggestionResolution || ""} onChange={v => set({ suggestionResolution: v })} bg="bg-yellow-50" />
                <EditField label="Commentaires" emoji="💬" value={local.commentaires || ""} onChange={v => set({ commentaires: v })} rows={3} />

                {/* Budget (lecture seule) */}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-1">💰 Budget</h4>
                    {(tPE > 0 || tPS > 0 || tRE > 0 || tRS > 0) ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 rounded-xl p-2">
                                <span className="text-[10px] font-bold text-green-600 block">Entrées prévues</span>
                                <span className="text-[13px] font-black text-green-700">{tPE.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-red-50 rounded-xl p-2">
                                <span className="text-[10px] font-bold text-red-600 block">Sorties prévues</span>
                                <span className="text-[13px] font-black text-red-700">{tPS.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-2">
                                <span className="text-[10px] font-bold text-emerald-600 block">Entrées réelles</span>
                                <span className="text-[13px] font-black text-emerald-700">{tRE.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-2">
                                <span className="text-[10px] font-bold text-orange-600 block">Sorties réelles</span>
                                <span className="text-[13px] font-black text-orange-700">{tRS.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-slate-400 italic">Aucun budget défini</p>
                    )}
                </div>
            </div>

            {/* Boutons Valider / Annuler */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
                <button onClick={handleValidate}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-purple-700 text-white rounded-xl font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                    <CheckCircle2 size={16} /> Valider
                </button>
                <button onClick={onClose}
                    className="flex-1 py-2.5 bg-white text-red-600 rounded-xl font-extrabold text-[13px] border-2 border-red-300 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <X size={16} /> Annuler
                </button>
            </div>
        </div>
    );
}

// ─── Page d'accueil Todo-Projet ──────────
function TodoIntro({ totalTasks, totalProjects, onEnter }: { totalTasks: number; totalProjects: number; onEnter: () => void }) {
    return (
        <div className="flex-1 overflow-y-auto slide-in" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex flex-col items-center p-5 pb-6 min-h-full">
                {/* En-tête avec fond gradient */}
                <div className="w-full rounded-3xl bg-gradient-to-br from-[#1e3a8a] to-purple-700 p-6 mb-5 shadow-xl text-center shine-effect">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
                        <ListChecks size={34} className="text-primary-yellow" />
                    </div>
                    <h1 className="text-[22px] font-black text-white mb-1 uppercase tracking-wide">Todo-Projet</h1>
                    <p className="text-[13px] font-bold text-primary-yellow">{totalTasks} tâche{totalTasks > 1 ? "s" : ""} • {totalProjects} projet{totalProjects > 1 ? "s" : ""}</p>
                </div>

                {/* Carte explication */}
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 w-full mb-4">
                    <h2 className="text-[15px] font-black text-[#1e3a8a] mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[14px]">📌</span>
                        Qu'est-ce que le Todo-Projet ?
                    </h2>
                    <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                        Le <span className="font-black text-[#1e3a8a]">Todo-Projet</span> est votre tableau de bord centralisé pour suivre toutes les tâches de vos projets. Il offre une <span className="font-bold text-purple-700">synchronisation en temps réel</span> vers le projet et le Gantt.
                    </p>

                    <h3 className="text-[13px] font-black text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center text-[12px]">🎯</span>
                        Pourquoi c'est important ?
                    </h3>
                    <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                        Pilotez toutes vos activités sans naviguer entre projets. Les retards remontent <span className="font-bold text-red-600">automatiquement en priorité</span>.
                    </p>

                    <h3 className="text-[13px] font-black text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-[12px]">🔧</span>
                        Comment ça marche ?
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🔵</span>
                            <span className="text-[12px] font-black text-blue-700">À faire</span>
                            <span className="text-[10px] text-blue-500 block">Planifiées</span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🟡</span>
                            <span className="text-[12px] font-black text-yellow-700">En cours</span>
                            <span className="text-[10px] text-yellow-500 block">Démarrées</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🔴</span>
                            <span className="text-[12px] font-black text-red-700">En retard</span>
                            <span className="text-[10px] text-red-500 block">Priorité haute</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">🟢</span>
                            <span className="text-[12px] font-black text-green-700">Terminé</span>
                            <span className="text-[10px] text-green-500 block">Achevées</span>
                        </div>
                    </div>

                    <p className="text-[12px] text-slate-600 leading-relaxed">
                        📁 Filtrez par <span className="font-bold">projet</span>, 👤 par <span className="font-bold">responsable</span> ou 📅 par <span className="font-bold">période</span>. Cliquez sur une tâche pour voir tous ses détails.
                    </p>
                </div>

                {/* Bouton d'accès */}
                <button onClick={onEnter}
                    className="w-full py-4 bg-gradient-to-r from-[#1e3a8a] to-purple-700 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95 transition-transform text-[15px]">
                    Accéder au Todo-Projet <ArrowRight size={20} className="text-primary-yellow" />
                </button>
            </div>
        </div>
    );
}

// ─── Liste des tâches ──────────
function TodoList({ projects, onSaveTasks, onBack }: { projects: Project[]; onSaveTasks: (projectId: string, tasks: ProjectTask[]) => void; onBack: () => void }) {
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterResponsable, setFilterResponsable] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTask, setSelectedTask] = useState<FlatTask | null>(null);

    const allTasks = useMemo<FlatTask[]>(() => {
        const list: FlatTask[] = [];
        for (const p of projects) {
            if (p.tasks?.length) for (const t of p.tasks) {
                // Calculer le statut effectif basé sur les dates
                const effectiveStatut = getEffectiveStatus(t);
                list.push({ task: { ...t, statut: effectiveStatut }, projectId: p.id, projectName: p.info.name });
            }
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
        if (filterStatus !== "all") result = result.filter(t => t.task.statut === filterStatus);

        // Filtre par période — fonctionne pour passé ET futur
        if (dateStart) {
            const ds = new Date(dateStart + "T00:00:00");
            result = result.filter(t => {
                const dd = parseDate(t.task.dateDebut);
                const df = parseDate(t.task.dateFin);
                // La tâche chevauche ou commence après le début de la période
                if (df && df >= ds) return true;
                if (dd && dd >= ds) return true;
                return false;
            });
        }
        if (dateEnd) {
            const de = new Date(dateEnd + "T23:59:59");
            result = result.filter(t => {
                const dd = parseDate(t.task.dateDebut);
                const df = parseDate(t.task.dateFin);
                // La tâche commence ou finit avant la fin de la période
                if (dd && dd <= de) return true;
                if (df && df <= de) return true;
                return false;
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.task.designation.toLowerCase().includes(q) || (t.task.description || "").toLowerCase().includes(q));
        }
        return result;
    }, [allTasks, filterProject, filterResponsable, filterStatus, dateStart, dateEnd, searchQuery]);

    // Grouper par projet + trier (en-retard en haut)
    const grouped = useMemo(() => {
        const map = new Map<string, FlatTask[]>();
        for (const t of filtered) {
            if (!map.has(t.projectId)) map.set(t.projectId, []);
            map.get(t.projectId)!.push(t);
        }
        for (const [, tasks] of map) {
            tasks.sort((a, b) => {
                const pr: Record<string, number> = { "en-retard": 0, "en-cours": 1, "todo": 2, "termine": 3 };
                const pa = pr[a.task.statut] ?? 4, pb = pr[b.task.statut] ?? 4;
                if (pa !== pb) return pa - pb;
                const da = parseDate(a.task.dateFin), db = parseDate(b.task.dateFin);
                if (da && db) return da.getTime() - db.getTime();
                return 0;
            });
        }
        return map;
    }, [filtered]);

    const stats = useMemo(() => {
        const s: Record<string, number> = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) { if (s[t.task.statut] !== undefined) s[t.task.statut]++; }
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
        if (selectedTask?.task.id === ft.task.id) {
            setSelectedTask({ ...ft, task: { ...ft.task, statut } });
        }
    }, [updateTask, selectedTask]);

    const resetFilters = () => {
        setFilterProject("all"); setFilterResponsable("all"); setFilterStatus("all");
        setSearchQuery(""); setDateStart(""); setDateEnd("");
    };

    const hasFilters = filterProject !== "all" || filterResponsable !== "all" || filterStatus !== "all" || searchQuery || dateStart || dateEnd;

    return (
        <div className="flex-1 flex flex-col overflow-hidden slide-in">
            {/* Barre filtres */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2">
                {/* Stats cliquables */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <button onClick={() => setFilterStatus("all")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 transition-all ${filterStatus === "all" ? "bg-slate-700 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
                        <span className="text-[9px] font-bold">Tous ({stats.total})</span>
                    </button>
                    {Object.entries(statusCfg).map(([k, c]) => (
                        <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 transition-all ${filterStatus === k ? `${c.bg} ${c.text} shadow-sm ring-2 ring-offset-1 ${c.border}` : `${c.bg} ${c.text} opacity-70`}`}>
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-[9px] font-bold">{c.emoji} {c.label} ({stats[k] || 0})</span>
                        </button>
                    ))}
                </div>

                {/* Recherche */}
                <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une tâche..."
                        className="w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30" />
                </div>

                {/* Filtres projet + responsable */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <Filter size={10} className="text-slate-400 shrink-0" />
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} title="Filtrer par projet" aria-label="Filtrer par projet"
                        className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none">
                        <option value="all">📁 Tous les projets</option>
                        {projects.filter(p => p.tasks?.length).map(p => (<option key={p.id} value={p.id}>📁 {p.info.name}</option>))}
                    </select>
                    <select value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)} title="Filtrer par responsable" aria-label="Filtrer par responsable"
                        className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none">
                        <option value="all">👤 Tous</option>
                        {responsables.map(r => (<option key={r} value={r}>👤 {r}</option>))}
                    </select>
                    {hasFilters && (
                        <button onClick={resetFilters} className="p-1 rounded-lg bg-red-50" title="Réinitialiser"><RotateCcw size={10} className="text-red-400" /></button>
                    )}
                </div>

                {/* Dates toujours visibles */}
                <div className="flex items-center gap-2">
                    <Calendar size={10} className="text-slate-400 shrink-0" />
                    <span className="text-[10px] font-black text-slate-800 shrink-0">Période :</span>
                    <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} title="Date début" aria-label="Date début période" placeholder="Début"
                        className="text-[10px] font-black border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[110px]" />
                    <span className="text-[10px] text-slate-800 font-black">→</span>
                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} title="Date fin" aria-label="Date fin période" placeholder="Fin"
                        className="text-[10px] font-black border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[110px]" />
                    {(dateStart || dateEnd) && (
                        <button onClick={() => { setDateStart(""); setDateEnd(""); }} className="text-[8px] font-bold text-red-400">✕</button>
                    )}
                </div>
            </div>

            {/* Liste */}
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
                                const isSelected = selectedTask?.task.id === ft.task.id;

                                return (
                                    <button key={ft.task.id} onClick={() => setSelectedTask(isSelected ? null : ft)}
                                        className={`w-full rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-3 shadow-sm transition-all text-left active:scale-[0.98] ${isSelected ? "ring-2 ring-vibrant-blue ring-offset-1" : ""}`}>
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

            {/* Détail tâche */}
            {selectedTask && <TaskDetailPanel ft={selectedTask} onClose={() => setSelectedTask(null)} onSave={(ft: FlatTask, updatedTask: ProjectTask) => {
                updateTask(ft.projectId, updatedTask);
                setSelectedTask(null);
            }} />}
        </div>
    );
}

// ─── Composant principal (routeur interne) ──────────
export default function TodoProjet({ projects, onSaveTasks }: TodoProjetProps) {
    const [showList, setShowList] = useState(false);

    const allTasks = useMemo(() => {
        let count = 0;
        for (const p of projects) { if (p.tasks?.length) count += p.tasks.length; }
        return count;
    }, [projects]);

    const projCount = useMemo(() => projects.filter(p => p.tasks?.length).length, [projects]);

    if (!showList) {
        return <TodoIntro totalTasks={allTasks} totalProjects={projCount} onEnter={() => setShowList(true)} />;
    }

    return <TodoList projects={projects} onSaveTasks={onSaveTasks} onBack={() => setShowList(false)} />;
}