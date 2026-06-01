"use client";

import { useState, useMemo } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    CalendarRange, ChevronDown, ChevronRight, AlertTriangle,
    Filter, Clock, X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────
interface GanttTask {
    taskId: string;
    task: ProjectTask;
    projectName: string;
    projectId: string;
}

interface GanttChartProps {
    projects: Project[];
}

// ─── Couleurs par statut ──────────────────────────────────
const statusConfig: Record<string, { bg: string; bar: string; text: string; dot: string; label: string; border: string }> = {
    "todo": { bg: "bg-slate-100", bar: "bg-slate-400", text: "text-slate-600", dot: "bg-slate-400", label: "À faire", border: "border-slate-300" },
    "en-cours": { bg: "bg-blue-50", bar: "bg-gradient-to-r from-vibrant-blue to-blue-500", text: "text-vibrant-blue", dot: "bg-vibrant-blue", label: "En cours", border: "border-blue-300" },
    "en-retard": { bg: "bg-red-50", bar: "bg-gradient-to-r from-red-500 to-red-600", text: "text-red-600", dot: "bg-red-500", label: "En retard", border: "border-red-300" },
    "termine": { bg: "bg-green-50", bar: "bg-gradient-to-r from-green-500 to-emerald-500", text: "text-green-600", dot: "bg-green-500", label: "Terminé", border: "border-green-300" },
};

// ─── Helpers ───────────────────────────────────────────────
function parseDate(d: string): Date | null {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(a: Date, b: Date): number {
    return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(d: Date): string {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type ZoomLevel = "jour" | "semaine" | "mois";

// ─── Carte Tâche Mobile ───────────────────────────────────
function MobileTaskCard({ ganttTask, onSelect, isSelected }: {
    ganttTask: GanttTask; onSelect: () => void; isSelected: boolean;
}) {
    const { task, projectName } = ganttTask;
    const cfg = statusConfig[task.statut] || statusConfig["todo"];
    const startD = parseDate(task.dateDebut);
    const endD = parseDate(task.dateFin);

    let progressPct = 0;
    let durationText = "";
    if (startD && endD) {
        const total = daysBetween(startD, endD) + 1;
        const elapsed = daysBetween(startD, new Date());
        progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100));
        durationText = `${total}j`;
    }

    const isLate = task.statut === "en-retard" && endD && endD < new Date();
    const daysLate = isLate && endD ? daysBetween(endD, new Date()) : 0;

    return (
        <button onClick={onSelect}
            className={`w-full rounded-2xl p-3 border-2 text-left transition-all active:scale-[0.98] ${isSelected ? `${cfg.bg} ${cfg.border} shadow-md` : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
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
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{startD ? formatShortDate(startD) : "—"}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${cfg.bar}`} style={{ width: task.statut === "termine" ? "100%" : `${progressPct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{endD ? formatShortDate(endD) : "—"}</span>
                {durationText && <span className="text-[9px] font-bold text-slate-400 shrink-0">({durationText})</span>}
            </div>
            {isLate && daysLate > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-red-600">
                    <AlertTriangle size={10} />
                    <span className="text-[9px] font-bold">En retard de {daysLate}j</span>
                </div>
            )}
        </button>
    );
}

// ─── Ligne Timeline Desktop ───────────────────────────────
function DesktopTimelineRow({ ganttTask, dayWidth, timelineStart, isSelected, onSelect }: {
    ganttTask: GanttTask; dayWidth: number; timelineStart: Date; isSelected: boolean; onSelect: () => void;
}) {
    const { task } = ganttTask;
    const cfg = statusConfig[task.statut] || statusConfig["todo"];
    const startD = parseDate(task.dateDebut);
    const endD = parseDate(task.dateFin);

    let barLeft = 0, barWidth = 0, showBar = false;
    if (startD && endD) {
        barLeft = Math.max(0, daysBetween(timelineStart, startD) * dayWidth);
        barWidth = Math.max(dayWidth, (daysBetween(startD, endD) + 1) * dayWidth);
        showBar = true;
    } else if (startD && !endD) {
        barLeft = Math.max(0, daysBetween(timelineStart, startD) * dayWidth);
        barWidth = 7 * dayWidth;
        showBar = true;
    } else if (!startD && endD) {
        barLeft = Math.max(0, daysBetween(timelineStart, endD) * dayWidth - 7 * dayWidth);
        barWidth = 7 * dayWidth;
        showBar = true;
    }

    return (
        <div onClick={onSelect}
            className={`relative h-9 border-b border-slate-50 cursor-pointer ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"}`}>
            {showBar && (
                <div className={`absolute top-1.5 h-6 rounded-lg ${cfg.bar} shadow-sm transition-all hover:shadow-md ${isSelected ? "ring-2 ring-offset-1 ring-vibrant-blue" : ""}`}
                    style={{ left: barLeft, width: barWidth, opacity: task.statut === "termine" ? 0.7 : 1 }}>
                    {barWidth > 60 && <span className="text-[9px] font-bold text-white px-2 truncate block leading-6">{task.designation}</span>}
                </div>
            )}
            {!startD && !endD && <div className="absolute top-2 left-2"><span className="text-[8px] font-bold text-slate-300 italic">Pas de dates</span></div>}
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────
export default function GanttChart({ projects }: GanttChartProps) {
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [zoom, setZoom] = useState<ZoomLevel>("semaine");
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");

    const allTasks = useMemo<GanttTask[]>(() => {
        const tasks: GanttTask[] = [];
        for (const project of projects) {
            if (project.tasks && project.tasks.length > 0) {
                for (const task of project.tasks) {
                    tasks.push({ taskId: task.id, task, projectName: project.info.name, projectId: project.id });
                }
            }
        }
        return tasks;
    }, [projects]);

    const filteredTasks = useMemo(() => {
        if (filterStatus === "all") return allTasks;
        return allTasks.filter(t => t.task.statut === filterStatus);
    }, [allTasks, filterStatus]);

    const groupedByProject = useMemo(() => {
        const map = new Map<string, GanttTask[]>();
        for (const t of filteredTasks) {
            if (!map.has(t.projectId)) map.set(t.projectId, []);
            map.get(t.projectId)!.push(t);
        }
        return map;
    }, [filteredTasks]);

    const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
        if (filteredTasks.length === 0) {
            const now = new Date();
            return { timelineStart: now, timelineEnd: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
        }
        let minDate = Infinity, maxDate = -Infinity;
        for (const t of filteredTasks) {
            const start = parseDate(t.task.dateDebut);
            const end = parseDate(t.task.dateFin);
            if (start) minDate = Math.min(minDate, start.getTime());
            if (end) maxDate = Math.max(maxDate, end.getTime());
            if (start && !end) maxDate = Math.max(maxDate, start.getTime() + 7 * 86400000);
            if (!start && end) minDate = Math.min(minDate, end.getTime() - 7 * 86400000);
        }
        if (minDate === Infinity) minDate = Date.now();
        if (maxDate === -Infinity) maxDate = Date.now() + 30 * 86400000;
        const start = new Date(minDate);
        const end = new Date(maxDate);
        start.setDate(start.getDate() - 3);
        end.setDate(end.getDate() + 3);
        return { timelineStart: start, timelineEnd: end, totalDays: Math.max(daysBetween(start, end), 1) };
    }, [filteredTasks]);

    const dayWidth = zoom === "jour" ? 60 : zoom === "semaine" ? 28 : 8;
    const timelineWidth = totalDays * dayWidth;

    const headerColumns = useMemo(() => {
        const cols: { label: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
        const cursor = new Date(timelineStart);
        while (cursor <= timelineEnd) {
            const isToday = cursor.toDateString() === new Date().toDateString();
            const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
            let label = "";
            if (zoom === "mois") {
                if (cursor.getDate() === 1 || cols.length === 0)
                    label = cursor.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
            } else {
                label = cursor.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            }
            cols.push({ label, date: new Date(cursor), isToday, isWeekend });
            cursor.setDate(cursor.getDate() + 1);
        }
        return cols;
    }, [timelineStart, timelineEnd, zoom]);

    const monthHeaders = useMemo(() => {
        const months: { label: string; span: number }[] = [];
        let cm = -1, cy = -1, count = 0;
        headerColumns.forEach((col) => {
            const m = col.date.getMonth(), y = col.date.getFullYear();
            if (m !== cm || y !== cy) {
                if (cm >= 0) months.push({ label: new Date(cy, cm).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }), span: count });
                cm = m; cy = y; count = 1;
            } else count++;
        });
        if (cm >= 0) months.push({ label: new Date(cy, cm).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }), span: count });
        return months;
    }, [headerColumns]);

    const todayPosition = Math.max(0, daysBetween(timelineStart, new Date()) * dayWidth);

    const toggleProject = (pid: string) => {
        setCollapsedProjects(prev => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid); else next.add(pid);
            return next;
        });
    };

    const stats = useMemo(() => {
        const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) s[t.task.statut]++;
        return s;
    }, [allTasks]);

    if (allTasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <CalendarRange size={36} className="text-primary-yellow" />
                </div>
                <h2 className="text-lg font-black text-slate-800 mb-2">Diagramme de Gantt</h2>
                <p className="text-xs text-slate-600 font-semibold text-center max-w-xs">
                    Aucune tâche trouvée. Les tâches de vos projets apparaîtront ici automatiquement.
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 text-center">
                    Créez des projets et ajoutez des tâches avec des dates de début et de fin.
                </p>
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
                        <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Gantt</h2>
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                        <button onClick={() => setViewMode("cards")}
                            className={`px-3 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "cards" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>
                            Cartes
                        </button>
                        <button onClick={() => setViewMode("timeline")}
                            className={`px-3 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "timeline" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>
                            Timeline
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 shrink-0"><Filter size={9} /></div>
                    <button onClick={() => setFilterStatus("all")}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 transition-all ${filterStatus === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                        Tous ({stats.total})
                    </button>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button key={key} onClick={() => setFilterStatus(key)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0 transition-all ${filterStatus === key ? `${cfg.bg} ${cfg.text}` : "bg-slate-100 text-slate-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label} ({stats[key as keyof typeof stats]})
                        </button>
                    ))}
                </div>

                {viewMode === "timeline" && (
                    <div className="flex items-center gap-1 mt-2">
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400">Zoom:</span>
                        {(["mois", "semaine", "jour"] as ZoomLevel[]).map(z => (
                            <button key={z} onClick={() => setZoom(z)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${zoom === z ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"}`}>
                                {z.charAt(0).toUpperCase() + z.slice(1)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ MODE CARTES (mobile-friendly) ═══ */}
            {viewMode === "cards" && (
                <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                    {Array.from(groupedByProject.entries()).map(([projectId, tasks]) => {
                        const isCollapsed = collapsedProjects.has(projectId);
                        const projectName = projects.find(p => p.id === projectId)?.info.name || "Projet";
                        return (
                            <div key={projectId} className="mb-3">
                                <button onClick={() => toggleProject(projectId)} className="w-full flex items-center gap-2 px-1 mb-2">
                                    {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                    <span className="text-[12px] font-black text-slate-800 truncate flex-1 text-left">{projectName}</span>
                                    <span className="text-[9px] font-bold text-white bg-vibrant-blue px-2 py-0.5 rounded-full">{tasks.length}</span>
                                </button>
                                {!isCollapsed && (
                                    <div className="space-y-2 pl-1">
                                        {tasks.map((ganttTask) => (
                                            <MobileTaskCard key={ganttTask.taskId} ganttTask={ganttTask}
                                                isSelected={selectedTask?.taskId === ganttTask.taskId}
                                                onSelect={() => setSelectedTask(selectedTask?.taskId === ganttTask.taskId ? null : ganttTask)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ MODE TIMELINE ═══ */}
            {viewMode === "timeline" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="shrink-0 px-3 py-2 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                            {Array.from(groupedByProject.entries()).map(([projectId, tasks]) => {
                                const isCollapsed = collapsedProjects.has(projectId);
                                const projectName = projects.find(p => p.id === projectId)?.info.name || "Projet";
                                return (
                                    <button key={projectId} onClick={() => toggleProject(projectId)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all ${isCollapsed ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-vibrant-blue"}`}>
                                        {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                                        <span className="truncate max-w-[100px]">{projectName}</span>
                                        <span className="bg-white text-slate-600 px-1.5 rounded-full">{tasks.length}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                        <div style={{ width: timelineWidth, minWidth: "100%" }} className="relative">
                            <div className="h-6 flex border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
                                {monthHeaders.map((m, i) => (
                                    <div key={i} style={{ width: m.span * dayWidth, minWidth: m.span * dayWidth }}
                                        className="flex items-center justify-center border-r border-slate-200">
                                        <span className="text-[8px] font-black text-slate-600 uppercase truncate px-1">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="h-7 flex border-b border-slate-200 bg-slate-50 sticky top-6 z-10">
                                {headerColumns.map((col, i) => (
                                    <div key={i} style={{ width: dayWidth, minWidth: dayWidth }}
                                        className={`flex items-center justify-center border-r border-slate-100 ${col.isToday ? "bg-amber-50" : ""}`}>
                                        {col.label && <span className={`text-[8px] font-bold ${col.isToday ? "text-primary-yellow font-black" : "text-slate-500"}`}>{col.label}</span>}
                                    </div>
                                ))}
                            </div>
                            {todayPosition > 0 && todayPosition < timelineWidth && (
                                <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: todayPosition }}>
                                    <div className="w-0.5 h-full bg-primary-yellow/60" />
                                </div>
                            )}
                            {Array.from(groupedByProject.entries()).map(([projectId, tasks]) => {
                                const isCollapsed = collapsedProjects.has(projectId);
                                return (
                                    <div key={projectId}>
                                        <div className="h-8 border-b border-slate-100 bg-slate-50/50" />
                                        {!isCollapsed && tasks.map((ganttTask) => (
                                            <DesktopTimelineRow key={ganttTask.taskId} ganttTask={ganttTask}
                                                dayWidth={dayWidth} timelineStart={timelineStart}
                                                isSelected={selectedTask?.taskId === ganttTask.taskId}
                                                onSelect={() => setSelectedTask(selectedTask?.taskId === ganttTask.taskId ? null : ganttTask)} />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Panel détail tâche ── */}
            {selectedTask && (
                <div className="shrink-0 bg-white border-t-2 border-vibrant-blue rounded-t-3xl px-4 py-3 shadow-2xl">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`w-2.5 h-2.5 rounded-full ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).dot}`} />
                                <h3 className="text-[13px] font-black text-slate-800 truncate">{selectedTask.task.designation}</h3>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).bg} ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).text}`}>
                                    {(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).label}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600 font-semibold">
                                <span>📁 {selectedTask.projectName}</span>
                                {selectedTask.task.responsable && <span>👤 {selectedTask.task.responsable}</span>}
                                {selectedTask.task.dateDebut && <span>📅 {formatShortDate(parseDate(selectedTask.task.dateDebut)!)}</span>}
                                {selectedTask.task.dateFin && <span>→ {formatShortDate(parseDate(selectedTask.task.dateFin)!)}</span>}
                                {selectedTask.task.dateDebut && selectedTask.task.dateFin && (() => {
                                    const days = daysBetween(parseDate(selectedTask.task.dateDebut)!, parseDate(selectedTask.task.dateFin)!) + 1;
                                    return <span>⏱ {days}j</span>;
                                })()}
                            </div>
                            {selectedTask.task.description && (
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{selectedTask.task.description}</p>
                            )}
                            {selectedTask.task.statut === "en-retard" && selectedTask.task.dateFin && (() => {
                                const endD = parseDate(selectedTask.task.dateFin)!;
                                if (endD < new Date()) {
                                    const daysLate = daysBetween(endD, new Date());
                                    return (
                                        <div className="flex items-center gap-1 mt-1 text-red-600">
                                            <AlertTriangle size={10} />
                                            <span className="text-[9px] font-bold">Retard : {daysLate} jour(s)</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="p-1.5 bg-slate-100 rounded-full shrink-0" title="Fermer" aria-label="Fermer le détail">
                            <X size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}