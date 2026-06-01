"use client";

import { useState, useMemo, useRef } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    CalendarRange, ChevronDown, ChevronRight, AlertTriangle,
    CheckCircle2, Clock, Circle, Filter, ZoomIn, ZoomOut, Info,
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
const statusConfig: Record<string, { bg: string; bar: string; text: string; dot: string; label: string }> = {
    "todo": { bg: "bg-slate-100", bar: "bg-slate-400", text: "text-slate-600", dot: "bg-slate-400", label: "À faire" },
    "en-cours": { bg: "bg-blue-50", bar: "bg-gradient-to-r from-vibrant-blue to-blue-500", text: "text-vibrant-blue", dot: "bg-vibrant-blue", label: "En cours" },
    "en-retard": { bg: "bg-red-50", bar: "bg-gradient-to-r from-red-500 to-red-600", text: "text-red-600", dot: "bg-red-500", label: "En retard" },
    "termine": { bg: "bg-green-50", bar: "bg-gradient-to-r from-green-500 to-emerald-500", text: "text-green-600", dot: "bg-green-500", label: "Terminé" },
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

function formatDate(d: Date): string {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatFullDate(d: Date): string {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type ZoomLevel = "jour" | "semaine" | "mois";

// ─── Composant principal ──────────────────────────────────
export default function GanttChart({ projects }: GanttChartProps) {
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [zoom, setZoom] = useState<ZoomLevel>("semaine");
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    // ── Collecter toutes les tâches avec leur projet ──
    const allTasks = useMemo<GanttTask[]>(() => {
        const tasks: GanttTask[] = [];
        for (const project of projects) {
            if (project.tasks && project.tasks.length > 0) {
                for (const task of project.tasks) {
                    tasks.push({
                        taskId: task.id,
                        task,
                        projectName: project.info.name,
                        projectId: project.id,
                    });
                }
            }
        }
        return tasks;
    }, [projects]);

    // ── Filtrer par statut ──
    const filteredTasks = useMemo(() => {
        if (filterStatus === "all") return allTasks;
        return allTasks.filter(t => t.task.statut === filterStatus);
    }, [allTasks, filterStatus]);

    // ── Grouper par projet ──
    const groupedByProject = useMemo(() => {
        const map = new Map<string, GanttTask[]>();
        for (const t of filteredTasks) {
            if (!map.has(t.projectId)) map.set(t.projectId, []);
            map.get(t.projectId)!.push(t);
        }
        return map;
    }, [filteredTasks]);

    // ── Calculer la plage de dates ──
    const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
        if (filteredTasks.length === 0) {
            const now = new Date();
            return { timelineStart: now, timelineEnd: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
        }
        let minDate = Infinity;
        let maxDate = -Infinity;
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
        // Ajouter une marge de 3 jours de chaque côté
        start.setDate(start.getDate() - 3);
        end.setDate(end.getDate() + 3);
        const days = Math.max(daysBetween(start, end), 1);
        return { timelineStart: start, timelineEnd: end, totalDays: days };
    }, [filteredTasks]);

    // ── Largeur des colonnes selon le zoom ──
    const dayWidth = zoom === "jour" ? 60 : zoom === "semaine" ? 28 : 8;
    const timelineWidth = totalDays * dayWidth;

    // ── Générer les colonnes de l'en-tête ──
    const headerColumns = useMemo(() => {
        const cols: { label: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
        const cursor = new Date(timelineStart);
        while (cursor <= timelineEnd) {
            const isToday = cursor.toDateString() === new Date().toDateString();
            const dayOfWeek = cursor.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let label = "";
            if (zoom === "jour") {
                label = cursor.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            } else if (zoom === "semaine") {
                label = cursor.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            } else {
                // Mois : afficher seulement le 1er de chaque mois
                if (cursor.getDate() === 1 || cols.length === 0) {
                    label = cursor.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
                }
            }
            cols.push({ label, date: new Date(cursor), isToday, isWeekend });
            cursor.setDate(cursor.getDate() + 1);
        }
        return cols;
    }, [timelineStart, timelineEnd, zoom]);

    // ── Mois pour l'en-tête supérieur ──
    const monthHeaders = useMemo(() => {
        const months: { label: string; span: number; startIndex: number }[] = [];
        let currentMonth = -1;
        let currentYear = -1;
        let count = 0;
        let startIdx = 0;

        headerColumns.forEach((col, idx) => {
            const m = col.date.getMonth();
            const y = col.date.getFullYear();
            if (m !== currentMonth || y !== currentYear) {
                if (currentMonth >= 0) {
                    months.push({
                        label: new Date(currentYear, currentMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
                        span: count,
                        startIndex: startIdx,
                    });
                }
                currentMonth = m;
                currentYear = y;
                count = 1;
                startIdx = idx;
            } else {
                count++;
            }
        });
        if (currentMonth >= 0) {
            months.push({
                label: new Date(currentYear, currentMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
                span: count,
                startIndex: startIdx,
            });
        }
        return months;
    }, [headerColumns]);

    // ── Position d'une date sur le timeline ──
    const getPosition = (date: Date) => {
        const days = daysBetween(timelineStart, date);
        return Math.max(0, days * dayWidth);
    };
    const getBarWidth = (start: Date, end: Date) => {
        const days = daysBetween(start, end);
        return Math.max(dayWidth, (days + 1) * dayWidth);
    };

    // ── Toggle projet ──
    const toggleProject = (pid: string) => {
        setCollapsedProjects(prev => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    // ── Stats ──
    const stats = useMemo(() => {
        const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) s[t.task.statut]++;
        return s;
    }, [allTasks]);

    const todayPosition = getPosition(new Date());

    // ── Empty state ──
    if (allTasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
                    <CalendarRange size={40} className="text-primary-yellow" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Diagramme de Gantt</h2>
                <p className="text-sm text-slate-600 font-semibold text-center max-w-xs">
                    Aucune tâche trouvée. Les tâches de vos projets apparaîtront ici automatiquement.
                </p>
                <p className="text-xs text-slate-400 font-bold mt-3 text-center">
                    Créez des projets et ajoutez des tâches avec des dates de début et de fin.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* ── Barre supérieure : Stats + Filtres + Zoom ── */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                        <CalendarRange size={18} className="text-primary-yellow" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Gantt Multi-Projets</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">Zoom :</span>
                        {(["mois", "semaine", "jour"] as ZoomLevel[]).map(z => (
                            <button key={z} onClick={() => setZoom(z)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${zoom === z ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                {z.charAt(0).toUpperCase() + z.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <Filter size={10} />
                        <span>Filtrer :</span>
                    </div>
                    <button onClick={() => setFilterStatus("all")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${filterStatus === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                        Tous ({stats.total})
                    </button>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button key={key} onClick={() => setFilterStatus(key)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${filterStatus === key ? `${cfg.bg} ${cfg.text} ring-2 ring-current ring-opacity-30` : "bg-slate-100 text-slate-600"}`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            {cfg.label} ({stats[key as keyof typeof stats]})
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Zone principale Gantt ── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Colonne gauche : noms des tâches */}
                <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                    {/* En-tête mois (vide pour alignement) */}
                    <div className="h-7 border-b border-slate-100 bg-slate-50" />
                    {/* En-tête jours (vide pour alignement) */}
                    <div className="h-8 border-b border-slate-200 bg-slate-50 flex items-center px-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Tâches</span>
                    </div>
                    {/* Lignes des tâches */}
                    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                        {Array.from(groupedByProject.entries()).map(([projectId, tasks]) => {
                            const isCollapsed = collapsedProjects.has(projectId);
                            const project = projects.find(p => p.id === projectId);
                            const projectName = project?.info.name || "Projet";
                            return (
                                <div key={projectId}>
                                    {/* Ligne projet */}
                                    <button
                                        onClick={() => toggleProject(projectId)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 hover:bg-slate-100 transition-colors"
                                    >
                                        {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                        <span className="text-[11px] font-black text-slate-800 truncate flex-1 text-left">{projectName}</span>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                                    </button>
                                    {/* Tâches du projet */}
                                    {!isCollapsed && tasks.map(({ task, taskId }) => {
                                        const cfg = statusConfig[task.statut] || statusConfig["todo"];
                                        return (
                                            <button
                                                key={taskId}
                                                onClick={() => setSelectedTask(selectedTask?.taskId === taskId ? null : { taskId, task, projectName, projectId })}
                                                className={`w-full flex items-center gap-2 px-3 pl-8 py-2 border-b border-slate-50 hover:bg-blue-50/50 transition-colors text-left ${selectedTask?.taskId === taskId ? "bg-blue-50" : ""}`}
                                            >
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                                                <span className="text-[11px] font-bold text-slate-700 truncate">{task.designation}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Zone timeline (scrollable horizontalement) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto" ref={timelineRef}>
                        <div style={{ width: timelineWidth, minWidth: "100%" }} className="relative">
                            {/* En-tête mois */}
                            <div className="h-7 flex border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
                                {monthHeaders.map((m, i) => (
                                    <div key={i} style={{ width: m.span * dayWidth, minWidth: m.span * dayWidth }}
                                        className="flex items-center justify-center border-r border-slate-200">
                                        <span className="text-[9px] font-black text-slate-600 uppercase truncate px-1">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                            {/* En-tête jours */}
                            <div className="h-8 flex border-b border-slate-200 bg-slate-50 sticky top-7 z-10">
                                {headerColumns.map((col, i) => (
                                    <div key={i} style={{ width: dayWidth, minWidth: dayWidth }}
                                        className={`flex items-center justify-center border-r border-slate-100 ${col.isToday ? "bg-amber-50" : col.isWeekend ? "bg-slate-100/50" : ""}`}>
                                        {col.label && <span className={`text-[9px] font-bold ${col.isToday ? "text-primary-yellow font-black" : "text-slate-500"}`}>{col.label}</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Ligne "Aujourd'hui" */}
                            {todayPosition > 0 && todayPosition < timelineWidth && (
                                <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: todayPosition }}>
                                    <div className="w-0.5 h-full bg-primary-yellow/60" />
                                </div>
                            )}

                            {/* Lignes des tâches avec barres */}
                            {Array.from(groupedByProject.entries()).map(([projectId, tasks]) => {
                                const isCollapsed = collapsedProjects.has(projectId);
                                return (
                                    <div key={projectId}>
                                        {/* Ligne projet (vide pour alignement) */}
                                        <div className="h-9 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent" />
                                        {!isCollapsed && tasks.map(({ task, taskId }) => {
                                            const cfg = statusConfig[task.statut] || statusConfig["todo"];
                                            const startD = parseDate(task.dateDebut);
                                            const endD = parseDate(task.dateFin);
                                            const isSelected = selectedTask?.taskId === taskId;

                                            // Barre position
                                            let barLeft = 0;
                                            let barWidth = 0;
                                            let showBar = false;
                                            if (startD && endD) {
                                                barLeft = getPosition(startD);
                                                barWidth = getBarWidth(startD, endD);
                                                showBar = true;
                                            } else if (startD && !endD) {
                                                barLeft = getPosition(startD);
                                                barWidth = 7 * dayWidth;
                                                showBar = true;
                                            } else if (!startD && endD) {
                                                barLeft = getPosition(endD) - 7 * dayWidth;
                                                barWidth = 7 * dayWidth;
                                                showBar = true;
                                            }

                                            return (
                                                <div key={taskId}
                                                    className={`relative h-9 border-b border-slate-50 ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"}`}
                                                    onClick={() => setSelectedTask(selectedTask?.taskId === taskId ? null : { taskId, task, projectName: projects.find(p => p.id === projectId)?.info.name || "", projectId })}
                                                >
                                                    {/* Weekend backgrounds */}
                                                    {headerColumns.filter(c => c.isWeekend).map((col, i) => (
                                                        <div key={i} className="absolute top-0 bottom-0 bg-slate-100/30"
                                                            style={{ left: i * dayWidth + daysBetween(timelineStart, col.date) * dayWidth, width: dayWidth }} />
                                                    ))}
                                                    {/* Barre de la tâche */}
                                                    {showBar && (
                                                        <div className={`absolute top-1.5 h-6 rounded-lg ${cfg.bar} shadow-sm cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-offset-1 ring-vibrant-blue" : ""}`}
                                                            style={{ left: barLeft, width: barWidth, opacity: task.statut === "termine" ? 0.7 : 1 }}
                                                        >
                                                            {barWidth > 60 && (
                                                                <span className="text-[9px] font-bold text-white px-2 truncate block leading-6">
                                                                    {task.designation}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Pas de date */}
                                                    {!startD && !endD && (
                                                        <div className="absolute top-2 left-2">
                                                            <span className="text-[8px] font-bold text-slate-300 italic">Pas de dates</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Panel détail tâche sélectionnée ── */}
            {selectedTask && (
                <div className="shrink-0 bg-white border-t-2 border-vibrant-blue px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-3 h-3 rounded-full ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).dot}`} />
                                <h3 className="text-sm font-black text-slate-800 truncate">{selectedTask.task.designation}</h3>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).bg} ${(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).text}`}>
                                    {(statusConfig[selectedTask.task.statut] || statusConfig["todo"]).label}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-600 font-semibold">
                                <span>📁 {selectedTask.projectName}</span>
                                {selectedTask.task.responsable && <span>👤 {selectedTask.task.responsable}</span>}
                                {selectedTask.task.dateDebut && <span>📅 Début : {formatFullDate(parseDate(selectedTask.task.dateDebut)!)}</span>}
                                {selectedTask.task.dateFin && <span>📅 Fin : {formatFullDate(parseDate(selectedTask.task.dateFin)!)}</span>}
                                {selectedTask.task.dateDebut && selectedTask.task.dateFin && (() => {
                                    const start = parseDate(selectedTask.task.dateDebut)!;
                                    const end = parseDate(selectedTask.task.dateFin)!;
                                    const days = daysBetween(start, end);
                                    return <span>⏱ {days + 1} jour(s)</span>;
                                })()}
                            </div>
                            {selectedTask.task.description && (
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{selectedTask.task.description}</p>
                            )}
                            {selectedTask.task.statut === "en-retard" && selectedTask.task.dateFin && (() => {
                                const endD = parseDate(selectedTask.task.dateFin)!;
                                const today = new Date();
                                if (endD < today) {
                                    const daysLate = daysBetween(endD, today);
                                    return (
                                        <div className="mt-1 flex items-center gap-1 text-red-600">
                                            <AlertTriangle size={11} />
                                            <span className="text-[10px] font-bold">En retard de {daysLate} jour(s)</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1">
                            <span className="text-lg font-black">×</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}