"use client";

import { useState, useMemo } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    CalendarRange, ChevronDown, ChevronRight, AlertTriangle,
    Filter, Clock, X, ArrowUp, ArrowDown,
} from "lucide-react";

interface GanttTask { taskId: string; task: ProjectTask; projectName: string; projectId: string; }
interface GanttChartProps { projects: Project[]; }

const statusConfig: Record<string, { bg: string; bar: string; text: string; dot: string; label: string; border: string }> = {
    "todo": { bg: "bg-slate-100", bar: "bg-slate-400", text: "text-slate-600", dot: "bg-slate-400", label: "À faire", border: "border-slate-300" },
    "en-cours": { bg: "bg-blue-50", bar: "bg-gradient-to-r from-vibrant-blue to-blue-500", text: "text-vibrant-blue", dot: "bg-vibrant-blue", label: "En cours", border: "border-blue-300" },
    "en-retard": { bg: "bg-red-50", bar: "bg-gradient-to-r from-red-500 to-red-600", text: "text-red-600", dot: "bg-red-500", label: "En retard", border: "border-red-300" },
    "termine": { bg: "bg-green-50", bar: "bg-gradient-to-r from-green-500 to-emerald-500", text: "text-green-600", dot: "bg-green-500", label: "Terminé", border: "border-green-300" },
};

function parseDate(d: string): Date | null { if (!d) return null; const p = new Date(d); return isNaN(p.getTime()) ? null : p; }
function daysBetween(a: Date, b: Date): number { return Math.ceil((b.getTime() - a.getTime()) / 86400000); }
function fmtShort(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); }
function fmtFull(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }

type ZoomLevel = "mois" | "semaine" | "jour";

interface TimeBlock { label: string; startDate: Date; endDate: Date; }

function getTimeBlocks(start: Date, end: Date, zoom: ZoomLevel): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    const cur = new Date(start);
    while (cur <= end) {
        if (zoom === "mois") {
            const y = cur.getFullYear(), m = cur.getMonth();
            const monthName = cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            blocks.push({ label: `${monthName} — Début (01-10)`, startDate: new Date(y, m, 1), endDate: new Date(y, m, 10) });
            blocks.push({ label: `${monthName} — Milieu (11-20)`, startDate: new Date(y, m, 11), endDate: new Date(y, m, 20) });
            blocks.push({ label: `${monthName} — Fin (21-31)`, startDate: new Date(y, m, 21), endDate: new Date(y, m + 1, 0) });
            cur.setMonth(cur.getMonth() + 1);
        } else if (zoom === "semaine") {
            const weekStart = new Date(cur);
            const dayOfWeek = cur.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weekStart.setDate(cur.getDate() - diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            blocks.push({ label: `${fmtShort(weekStart)} → ${fmtShort(weekEnd)}`, startDate: weekStart, endDate: weekEnd });
            cur.setDate(weekEnd.getDate() + 1);
        } else {
            blocks.push({ label: fmtFull(cur), startDate: new Date(cur), endDate: new Date(cur) });
            cur.setDate(cur.getDate() + 1);
        }
    }
    return blocks;
}

function taskInBlock(task: ProjectTask, block: TimeBlock): boolean {
    const s = parseDate(task.dateDebut), e = parseDate(task.dateFin);
    if (!s && !e) return false;
    const tS = s || e!, tE = e || s!;
    return tS <= block.endDate && tE >= block.startDate;
}

// ─── Carte Tâche ──────────────────────────────────────────
function TaskCard({ ganttTask, onSelect, isSelected }: { ganttTask: GanttTask; onSelect: () => void; isSelected: boolean }) {
    const { task, projectName } = ganttTask;
    const cfg = statusConfig[task.statut] || statusConfig["todo"];
    const sD = parseDate(task.dateDebut), eD = parseDate(task.dateFin);
    let pct = 0, dur = "";
    if (sD && eD) { const t = daysBetween(sD, eD) + 1; pct = Math.min(100, Math.max(0, (daysBetween(sD, new Date()) / t) * 100)); dur = `${t}j`; }
    const isLate = task.statut === "en-retard" && eD && eD < new Date();
    const dL = isLate && eD ? daysBetween(eD, new Date()) : 0;

    return (
        <button onClick={onSelect}
            className={`w-full rounded-2xl p-3 border-2 text-left transition-all active:scale-[0.98] ${isSelected ? `${cfg.bg} ${cfg.border} shadow-md` : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className="text-[13px] font-black text-slate-800 truncate">{task.designation}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mb-2">
                <span className="truncate">📁 {projectName}</span>
                {task.responsable && <span className="truncate">👤 {task.responsable}</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{sD ? fmtShort(sD) : "—"}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: task.statut === "termine" ? "100%" : `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{eD ? fmtShort(eD) : "—"}</span>
                {dur && <span className="text-[9px] font-bold text-slate-400">({dur})</span>}
            </div>
            {isLate && dL > 0 && (
                <div className="flex items-center gap-1 mt-1 text-red-600">
                    <AlertTriangle size={10} /><span className="text-[9px] font-bold">Retard de {dL}j</span>
                </div>
            )}
        </button>
    );
}

// ─── Détail complet tâche ─────────────────────────────────
function TaskDetail({ ganttTask, onClose }: { ganttTask: GanttTask; onClose: () => void }) {
    const { task, projectName } = ganttTask;
    const cfg = statusConfig[task.statut] || statusConfig["todo"];
    const sD = parseDate(task.dateDebut), eD = parseDate(task.dateFin);
    const isLate = task.statut === "en-retard" && eD && eD < new Date();
    const dL = isLate && eD ? daysBetween(eD, new Date()) : 0;

    const totalPrevuE = (task.budgetEntreesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const totalPrevuS = (task.budgetSortiesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const totalReelE = (task.budgetEntreesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const totalReelS = (task.budgetSortiesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);

    return (
        <div className="shrink-0 bg-white rounded-t-3xl border-t-2 border-vibrant-blue shadow-2xl max-h-[70vh] flex flex-col">
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

                {/* Dates */}
                {(sD || eD) && (
                    <div className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-3 text-[11px] font-semibold">
                            {sD && <div><span className="text-slate-400 block text-[9px]">Début</span><span className="text-slate-800">{fmtFull(sD)}</span></div>}
                            {sD && eD && <span className="text-slate-300">→</span>}
                            {eD && <div><span className="text-slate-400 block text-[9px]">Fin</span><span className="text-slate-800">{fmtFull(eD)}</span></div>}
                            {sD && eD && <div className="ml-auto"><span className="text-slate-400 block text-[9px]">Durée</span><span className="text-vibrant-blue font-black">{daysBetween(sD, eD) + 1}j</span></div>}
                        </div>
                        {isLate && dL > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-red-600 bg-red-50 rounded-lg px-2 py-1">
                                <AlertTriangle size={12} /><span className="text-[10px] font-bold">En retard de {dL} jour(s)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Description */}
                {task.description && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Description</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{task.description}</p>
                    </div>
                )}

                {/* Responsable */}
                {task.responsable && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Responsable</h4>
                        <p className="text-[11px] text-slate-700 font-semibold">👤 {task.responsable}</p>
                    </div>
                )}

                {/* Objectifs */}
                {task.objectifs && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Objectifs</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{task.objectifs}</p>
                    </div>
                )}

                {/* Budget */}
                {(totalPrevuE > 0 || totalPrevuS > 0 || totalReelE > 0 || totalReelS > 0) && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Budget</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 rounded-xl p-2">
                                <span className="text-[9px] font-bold text-green-600 block">Entrées prévues</span>
                                <span className="text-[12px] font-black text-green-700">{totalPrevuE.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-red-50 rounded-xl p-2">
                                <span className="text-[9px] font-bold text-red-600 block">Sorties prévues</span>
                                <span className="text-[12px] font-black text-red-700">{totalPrevuS.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-2">
                                <span className="text-[9px] font-bold text-emerald-600 block">Entrées réelles</span>
                                <span className="text-[12px] font-black text-emerald-700">{totalReelE.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-2">
                                <span className="text-[9px] font-bold text-orange-600 block">Sorties réelles</span>
                                <span className="text-[12px] font-black text-orange-700">{totalReelS.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Risques */}
                {task.risques && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Risques</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{task.risques}</p>
                    </div>
                )}

                {/* Suggestion */}
                {task.suggestionResolution && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Suggestion de résolution</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{task.suggestionResolution}</p>
                    </div>
                )}

                {/* Commentaires */}
                {task.commentaires && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Commentaires</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{task.commentaires}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────
export default function GanttChart({ projects }: GanttChartProps) {
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [zoom, setZoom] = useState<ZoomLevel>("mois");
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [viewMode, setViewMode] = useState<"cartes" | "timeline">("cartes");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const allTasks = useMemo<GanttTask[]>(() => {
        const t: GanttTask[] = [];
        for (const p of projects) {
            if (p.tasks?.length) for (const task of p.tasks) t.push({ taskId: task.id, task, projectName: p.info.name, projectId: p.id });
        }
        return t;
    }, [projects]);

    const filtered = useMemo(() => filterStatus === "all" ? allTasks : allTasks.filter(t => t.task.statut === filterStatus), [allTasks, filterStatus]);

    const grouped = useMemo(() => {
        const m = new Map<string, GanttTask[]>();
        for (const t of filtered) { if (!m.has(t.projectId)) m.set(t.projectId, []); m.get(t.projectId)!.push(t); }
        return m;
    }, [filtered]);

    const stats = useMemo(() => {
        const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) s[t.task.statut]++; return s;
    }, [allTasks]);

    // Calculer plage de dates
    const { dateStart, dateEnd } = useMemo(() => {
        if (!filtered.length) { const n = new Date(); return { dateStart: new Date(n.getFullYear(), n.getMonth(), 1), dateEnd: new Date(n.getFullYear(), n.getMonth() + 2, 0) }; }
        let mn = Infinity, mx = -Infinity;
        for (const t of filtered) {
            const s = parseDate(t.task.dateDebut), e = parseDate(t.task.dateFin);
            if (s) mn = Math.min(mn, s.getTime()); if (e) mx = Math.max(mx, e.getTime());
            if (s && !e) mx = Math.max(mx, s.getTime() + 30 * 86400000);
            if (!s && e) mn = Math.min(mn, e.getTime() - 30 * 86400000);
        }
        if (mn === Infinity) mn = Date.now(); if (mx === -Infinity) mx = Date.now() + 60 * 86400000;
        const s = new Date(mn), e = new Date(mx);
        // Ajuster au début/fin du mois pour le zoom mois
        if (zoom === "mois") { s.setDate(1); e.setMonth(e.getMonth() + 1); e.setDate(0); }
        return { dateStart: s, dateEnd: e };
    }, [filtered, zoom]);

    const blocks = useMemo(() => getTimeBlocks(dateStart, dateEnd, zoom), [dateStart, dateEnd, zoom]);

    const sortedBlocks = sortOrder === "desc" ? [...blocks].reverse() : blocks;

    const toggleProject = (pid: string) => {
        setCollapsedProjects(prev => { const n = new Set(prev); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; });
    };

    if (!allTasks.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <CalendarRange size={36} className="text-primary-yellow" />
                </div>
                <h2 className="text-lg font-black text-slate-800 mb-2">Diagramme de Gantt</h2>
                <p className="text-xs text-slate-600 font-semibold text-center">Aucune tâche trouvée. Créez des projets avec des tâches.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* ── Barre supérieure ── */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <CalendarRange size={16} className="text-primary-yellow" />
                        <h2 className="text-[12px] font-black text-slate-800 uppercase">Gantt</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                            <button onClick={() => setViewMode("cartes")} className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "cartes" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>Cartes</button>
                            <button onClick={() => setViewMode("timeline")} className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "timeline" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>Timeline</button>
                        </div>
                    </div>
                </div>
                {/* Filtres */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    <Filter size={9} className="text-slate-400 shrink-0" />
                    <button onClick={() => setFilterStatus("all")} className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 ${filterStatus === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>Tous ({stats.total})</button>
                    {Object.entries(statusConfig).map(([k, c]) => (
                        <button key={k} onClick={() => setFilterStatus(k)} className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0 ${filterStatus === k ? `${c.bg} ${c.text}` : "bg-slate-100 text-slate-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label} ({stats[k as keyof typeof stats]})
                        </button>
                    ))}
                </div>
                {/* Zoom + Tri */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-400" />
                        {(["mois", "semaine", "jour"] as ZoomLevel[]).map(z => (
                            <button key={z} onClick={() => setZoom(z)} className={`px-2 py-1 rounded-lg text-[9px] font-bold ${zoom === z ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"}`}>{z.charAt(0).toUpperCase() + z.slice(1)}</button>
                        ))}
                    </div>
                    {viewMode === "timeline" && (
                        <button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-bold text-slate-600">
                            {sortOrder === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                            {sortOrder === "desc" ? "Récent ↑" : "Ancien ↓"}
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ MODE CARTES ═══ */}
            {viewMode === "cartes" && (
                <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                    {Array.from(grouped.entries()).map(([pid, tasks]) => {
                        const collapsed = collapsedProjects.has(pid);
                        const name = projects.find(p => p.id === pid)?.info.name || "Projet";
                        return (
                            <div key={pid} className="mb-3">
                                <button onClick={() => toggleProject(pid)} className="w-full flex items-center gap-2 px-1 mb-2">
                                    {collapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                    <span className="text-[12px] font-black text-slate-800 truncate flex-1 text-left">{name}</span>
                                    <span className="text-[9px] font-bold text-white bg-vibrant-blue px-2 py-0.5 rounded-full">{tasks.length}</span>
                                </button>
                                {!collapsed && (
                                    <div className="space-y-2 pl-1">
                                        {tasks.map(gt => <TaskCard key={gt.taskId} ganttTask={gt} isSelected={selectedTask?.taskId === gt.taskId} onSelect={() => setSelectedTask(selectedTask?.taskId === gt.taskId ? null : gt)} />)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ MODE TIMELINE VERTICAL ═══ */}
            {viewMode === "timeline" && (
                <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                    {sortedBlocks.map((block, bi) => {
                        // Tâches dans ce bloc
                        const blockTasks: GanttTask[] = [];
                        for (const [, tasks] of grouped) {
                            for (const gt of tasks) { if (taskInBlock(gt.task, block)) blockTasks.push(gt); }
                        }
                        const isCurrentBlock = new Date() >= block.startDate && new Date() <= block.endDate;

                        return (
                            <div key={bi} className={`border-b-2 ${isCurrentBlock ? "border-primary-yellow bg-amber-50/30" : "border-slate-100"}`}>
                                {/* En-tête bloc */}
                                <div className={`sticky top-0 z-10 px-3 py-2 flex items-center gap-2 ${isCurrentBlock ? "bg-amber-50" : "bg-white"}`}>
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrentBlock ? "bg-primary-yellow" : "bg-slate-300"}`} />
                                    <span className={`text-[10px] font-black ${isCurrentBlock ? "text-primary-yellow" : "text-slate-500"}`}>{block.label}</span>
                                    <span className="text-[9px] font-bold text-slate-300 ml-auto">{blockTasks.length} tâche(s)</span>
                                </div>
                                {/* Tâches du bloc */}
                                {blockTasks.length > 0 ? (
                                    <div className="px-3 pb-3 space-y-2">
                                        {blockTasks.map(gt => {
                                            const cfg = statusConfig[gt.task.statut] || statusConfig["todo"];
                                            const sD = parseDate(gt.task.dateDebut), eD = parseDate(gt.task.dateFin);
                                            const sel = selectedTask?.taskId === gt.taskId;
                                            return (
                                                <button key={gt.taskId} onClick={() => setSelectedTask(sel ? null : gt)}
                                                    className={`w-full rounded-xl p-2.5 border-2 text-left transition-all active:scale-[0.98] ${sel ? `${cfg.bg} ${cfg.border}` : "bg-white border-slate-100"}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                        <span className="text-[11px] font-black text-slate-800 truncate flex-1">{gt.task.designation}</span>
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold">
                                                        <span>📁 {gt.projectName}</span>
                                                        {sD && <span>{fmtShort(sD)}</span>}
                                                        {sD && eD && <span>→</span>}
                                                        {eD && <span>{fmtShort(eD)}</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="px-3 pb-2"><span className="text-[9px] text-slate-300 italic">Aucune tâche</span></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Détail complet tâche ── */}
            {selectedTask && <TaskDetail ganttTask={selectedTask} onClose={() => setSelectedTask(null)} />}
        </div>
    );
}