"use client";

import { useState, useMemo } from "react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import {
    CalendarRange, ChevronDown, ChevronRight, AlertTriangle,
    Filter, Clock, X, ArrowUp, ArrowDown, CalendarDays, RotateCcw,
    ArrowRight, BarChart3, Eye, ZoomIn, LayoutGrid, GitBranch,
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
function fmtShort(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function fmtFull(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }

type ZoomLevel = "mois" | "semaine" | "jour";

interface TimeBlock { label: string; shortLabel: string; startDate: Date; endDate: Date; totalDays: number; }

function getTimeBlocks(start: Date, end: Date, zoom: ZoomLevel): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    const endMs = end.getTime();
    let safety = 0;
    const MAX_BLOCKS = 100;

    if (zoom === "mois") {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur.getTime() <= endMs && safety++ < MAX_BLOCKS) {
            const y = cur.getFullYear(), m = cur.getMonth();
            const monthName = cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
            const b1s = new Date(y, m, 1), b1e = new Date(y, m, 10);
            blocks.push({ label: `${monthName} — Début (01-10)`, shortLabel: "01-10", startDate: b1s, endDate: b1e, totalDays: daysBetween(b1s, b1e) + 1 });
            const b2s = new Date(y, m, 11), b2e = new Date(y, m, 20);
            blocks.push({ label: `${monthName} — Milieu (11-20)`, shortLabel: "11-20", startDate: b2s, endDate: b2e, totalDays: daysBetween(b2s, b2e) + 1 });
            const b3s = new Date(y, m, 21), b3e = new Date(y, m + 1, 0);
            blocks.push({ label: `${monthName} — Fin (21-31)`, shortLabel: "21-31", startDate: b3s, endDate: b3e, totalDays: daysBetween(b3s, b3e) + 1 });
            cur.setMonth(cur.getMonth() + 1);
        }
    } else if (zoom === "semaine") {
        // Trouver le lundi de la semaine de départ
        const cur = new Date(start);
        const dow = cur.getDay();
        cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1));
        while (cur.getTime() <= endMs && safety++ < MAX_BLOCKS) {
            const ws = new Date(cur);
            const we = new Date(cur); we.setDate(we.getDate() + 6);
            blocks.push({ label: `${fmtShort(ws)} → ${fmtShort(we)}`, shortLabel: `${ws.getDate()}-${we.getDate()}`, startDate: ws, endDate: we, totalDays: 7 });
            cur.setDate(cur.getDate() + 7);
        }
    } else {
        // zoom jour
        const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        while (cur.getTime() <= endMs && safety++ < MAX_BLOCKS) {
            blocks.push({ label: fmtFull(cur), shortLabel: `${cur.getDate()}`, startDate: new Date(cur), endDate: new Date(cur), totalDays: 1 });
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

// ─── Carte Tâche (mode Cartes) ────────────────────────────
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
function TaskDetail({ ganttTask, onClose, allProjects }: { ganttTask: GanttTask; onClose: () => void; allProjects: Project[] }) {
    const { task, projectName, projectId } = ganttTask;
    // Trouver le contact du responsable dans l'équipe du projet
    const project = allProjects.find(p => p.id === projectId);
    const responsableMember = project?.manager?.membres?.find((m: any) =>
        task.responsable && (m.nom?.toLowerCase().includes(task.responsable.toLowerCase()) || m.prenom?.toLowerCase().includes(task.responsable.toLowerCase()) || `${m.prenom} ${m.nom}`.toLowerCase().includes(task.responsable.toLowerCase()))
    );
    const responsableContact = responsableMember?.contact || project?.manager?.contact || "";
    const cfg = statusConfig[task.statut] || statusConfig["todo"];
    const sD = parseDate(task.dateDebut), eD = parseDate(task.dateFin);
    const isLate = task.statut === "en-retard" && eD && eD < new Date();
    const dL = isLate && eD ? daysBetween(eD, new Date()) : 0;

    const tPE = (task.budgetEntreesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tPS = (task.budgetSortiesPrev || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tRE = (task.budgetEntreesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);
    const tRS = (task.budgetSortiesReel || []).reduce((a: number, b: any) => a + (b.montant || 0), 0);

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t-2 border-vibrant-blue shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
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
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[10px] font-semibold text-slate-500">📁 {projectName}</span>
                </div>
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
                                <AlertTriangle size={12} /><span className="text-[10px] font-bold">Retard : {dL} jour(s)</span>
                            </div>
                        )}
                    </div>
                )}
                {/* Description - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">📝 Description</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.description || "—"}</p></div>
                {/* Responsable + Contact - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">👤 Responsable</h4><p className="text-[11px] text-slate-700 font-semibold">{task.responsable || "—"}</p>
                    {responsableContact && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">📞 {responsableContact}</p>}
                </div>
                {/* Objectifs - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">🎯 Objectifs</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.objectifs || "—"}</p></div>
                {/* Budget détaillé - toujours affiché */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">💰 Gestion financière</h4>
                    {(tPE > 0 || tPS > 0 || tRE > 0 || tRS > 0) ? (
                        <div className="space-y-1.5">
                            {(task.budgetEntreesPrev || []).length > 0 && (
                                <div className="bg-green-50 rounded-xl p-2 border border-green-200">
                                    <div className="text-[10px] font-black text-green-700 mb-1">💵 Entrées prévues — Total : {tPE.toLocaleString("fr-FR")} FCFA</div>
                                    {(task.budgetEntreesPrev || []).map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-green-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-green-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(task.budgetSortiesPrev || []).length > 0 && (
                                <div className="bg-red-50 rounded-xl p-2 border border-red-200">
                                    <div className="text-[10px] font-black text-red-700 mb-1">📤 Sorties prévues — Total : {tPS.toLocaleString("fr-FR")} FCFA</div>
                                    {(task.budgetSortiesPrev || []).map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-red-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-red-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(task.budgetEntreesReel || []).length > 0 && (
                                <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200">
                                    <div className="text-[10px] font-black text-emerald-700 mb-1">✅ Entrées réelles — Total : {tRE.toLocaleString("fr-FR")} FCFA</div>
                                    {(task.budgetEntreesReel || []).map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-emerald-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-emerald-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(task.budgetSortiesReel || []).length > 0 && (
                                <div className="bg-orange-50 rounded-xl p-2 border border-orange-200">
                                    <div className="text-[10px] font-black text-orange-700 mb-1">💸 Sorties réelles — Total : {tRS.toLocaleString("fr-FR")} FCFA</div>
                                    {(task.budgetSortiesReel || []).map((b: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] py-0.5 border-b border-orange-100 last:border-0">
                                            <span className="text-slate-700 font-semibold">{b.designation || "—"}</span>
                                            <span className="text-orange-700 font-black">{(Number(b.montant) || 0).toLocaleString("fr-FR")} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="bg-slate-100 rounded-xl p-2 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-800">Solde prévu</span>
                                <span className={`text-[12px] font-black ${(tPE - tPS) >= 0 ? "text-green-700" : "text-red-700"}`}>{(tPE - tPS).toLocaleString("fr-FR")} FCFA</span>
                            </div>
                            <div className="bg-slate-100 rounded-xl p-2 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-800">Solde réel</span>
                                <span className={`text-[12px] font-black ${(tRE - tRS) >= 0 ? "text-green-700" : "text-red-700"}`}>{(tRE - tRS).toLocaleString("fr-FR")} FCFA</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400 italic">Aucun budget défini</p>
                    )}
                </div>
                {/* Risques - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">⚡ Risques</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.risques || "—"}</p></div>
                {/* Suggestion - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">💡 Suggestion</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.suggestionResolution || "—"}</p></div>
                {/* Commentaires - toujours affiché */}
                <div><h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">💬 Commentaires</h4><p className="text-[11px] text-slate-700 leading-relaxed">{task.commentaires || "—"}</p></div>
            </div>
        </div>
    );
}

// ─── Page intro Gantt ──────────
function GanttIntro({ totalTasks, totalProjects, onEnter }: { totalTasks: number; totalProjects: number; onEnter: () => void }) {
    return (
        <div className="flex-1 overflow-y-auto slide-in" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex flex-col items-center p-5 pb-6 min-h-full">
                <div className="w-full rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-600 p-6 mb-5 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
                        <BarChart3 size={34} className="text-amber-300" />
                    </div>
                    <h1 className="text-[22px] font-black text-white mb-1 uppercase tracking-wide">Diagramme de Gantt</h1>
                    <p className="text-[13px] font-bold text-amber-300">{totalTasks} tâche{totalTasks > 1 ? "s" : ""} • {totalProjects} projet{totalProjects > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 w-full mb-4">
                    <h2 className="text-[15px] font-black text-emerald-800 mb-3">📊 Qu'est-ce que le Gantt ?</h2>
                    <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                        Le <span className="font-black text-emerald-800">Diagramme de Gantt</span> offre une vue chronologique de toutes vos tâches avec <span className="font-bold text-teal-700">visualisation temporelle</span> et synchronisation en temps réel.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">📋</span>
                            <span className="text-[12px] font-black text-blue-700">À faire</span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">⏳</span>
                            <span className="text-[12px] font-black text-yellow-700">En cours</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">⚠️</span>
                            <span className="text-[12px] font-black text-red-700">En retard</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">✅</span>
                            <span className="text-[12px] font-black text-green-700">Terminé</span>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
                        📅 Visualisez vos tâches dans le temps. Filtrez par <span className="font-bold">statut</span>, changez de <span className="font-bold">vue</span> (Cartes ou Timeline), et ajustez le <span className="font-bold">zoom</span> (Mois, Semaine, Jour). Cliquez sur une tâche pour voir ses détails.
                    </p>
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3">
                        <h3 className="text-[12px] font-black text-teal-800 mb-1.5">👁️ Vues Cartes et Timeline</h3>
                        <p className="text-[11px] text-teal-700 leading-relaxed">
                            <span className="font-bold">Mode Cartes</span> : vue synthétique avec barres de progression et indicateurs visuels. <span className="font-bold">Mode Timeline</span> : vue chronologique complète avec blocs temporels et positionnement des tâches dans le temps.
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                        <h3 className="text-[12px] font-black text-amber-800 mb-1.5">🔍 Zoom et Période</h3>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                            Ajustez le niveau de détail : <span className="font-bold">Mois</span> (demi-décades), <span className="font-bold">Semaine</span> ou <span className="font-bold">Jour</span>. Sélectionnez une période personnalisée pour cibler un intervalle précis.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <h3 className="text-[12px] font-black text-emerald-800 mb-1.5">🎯 Filtrer par statut</h3>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Filtrez les tâches par statut en un clic : <span className="font-bold text-yellow-700">⏳ En cours</span>, <span className="font-bold text-blue-700">📋 À faire</span>, <span className="font-bold text-red-700">⚠️ En retard</span> ou <span className="font-bold text-green-700">✅ Terminé</span>. Seules les tâches correspondantes s'affichent.
                        </p>
                    </div>
                </div>
                <button onClick={onEnter}
                    className="w-full py-4 bg-gradient-to-r from-emerald-700 to-teal-600 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-[15px]">
                    Accéder au vue de Gantt <ArrowRight size={20} className="text-amber-300" />
                </button>
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────
export default function GanttChart({ projects }: GanttChartProps) {
    const [showGantt, setShowGantt] = useState(false);
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [zoom, setZoom] = useState<ZoomLevel>("mois");
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [viewMode, setViewMode] = useState<"cartes" | "timeline">("cartes");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [useCustomPeriod, setUseCustomPeriod] = useState(false);

    const allTasks = useMemo<GanttTask[]>(() => {
        const t: GanttTask[] = [];
        for (const p of projects) { if (p.tasks?.length) for (const task of p.tasks) t.push({ taskId: task.id, task, projectName: p.info.name, projectId: p.id }); }
        return t;
    }, [projects]);

    const filtered = useMemo(() => filterStatus === "all" ? allTasks : allTasks.filter(t => t.task.statut === filterStatus), [allTasks, filterStatus]);
    const grouped = useMemo(() => { const m = new Map<string, GanttTask[]>(); for (const t of filtered) { if (!m.has(t.projectId)) m.set(t.projectId, []); m.get(t.projectId)!.push(t); } return m; }, [filtered]);
    const stats = useMemo(() => { const s = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length }; for (const t of allTasks) s[t.task.statut]++; return s; }, [allTasks]);

    // Plage de dates — limitée pour éviter le gel
    const { dateStart, dateEnd } = useMemo(() => {
        const now = new Date();

        // Période personnalisée
        if (useCustomPeriod && customStart && customEnd) {
            const cs = new Date(customStart), ce = new Date(customEnd);
            if (!isNaN(cs.getTime()) && !isNaN(ce.getTime()) && cs <= ce) {
                // Limiter à max 100 jours pour sécurité
                const maxEnd = new Date(cs.getTime() + 100 * 86400000);
                return { dateStart: cs, dateEnd: ce > maxEnd ? maxEnd : ce };
            }
        }

        if (!filtered.length) { return { dateStart: new Date(now.getFullYear(), now.getMonth(), 1), dateEnd: new Date(now.getFullYear(), now.getMonth() + 2, 0) }; }

        let mn = Infinity, mx = -Infinity;
        for (const t of filtered) {
            const s = parseDate(t.task.dateDebut), e = parseDate(t.task.dateFin);
            if (s) mn = Math.min(mn, s.getTime()); if (e) mx = Math.max(mx, e.getTime());
            if (s && !e) mx = Math.max(mx, s.getTime() + 30 * 86400000);
            if (!s && e) mn = Math.min(mn, e.getTime() - 30 * 86400000);
        }
        if (mn === Infinity) mn = now.getTime(); if (mx === -Infinity) mx = now.getTime() + 60 * 86400000;

        let s = new Date(mn), e = new Date(mx);

        if (zoom === "jour") {
            const center = new Date(now);
            s = new Date(center.getFullYear(), center.getMonth(), center.getDate() - 15);
            e = new Date(center.getFullYear(), center.getMonth(), center.getDate() + 15);
        } else if (zoom === "semaine") {
            const center = new Date(now);
            s = new Date(center.getFullYear(), center.getMonth() - 1, 1);
            e = new Date(center.getFullYear(), center.getMonth() + 2, 0);
        } else {
            s.setDate(1); e.setMonth(e.getMonth() + 1); e.setDate(0);
        }

        return { dateStart: s, dateEnd: e };
    }, [filtered, zoom, useCustomPeriod, customStart, customEnd]);

    const blocks = useMemo(() => getTimeBlocks(dateStart, dateEnd, zoom), [dateStart, dateEnd, zoom]);
    const sortedBlocks = useMemo(() => sortOrder === "desc" ? [...blocks].reverse() : blocks, [blocks, sortOrder]);

    // Pré-calculer les tâches par bloc + position today (évite recalcul dans le render)
    const blockData = useMemo(() => {
        const nowMs = Date.now();
        return sortedBlocks.map(block => {
            const bTasks: GanttTask[] = [];
            for (const [, tasks] of grouped) {
                for (const gt of tasks) {
                    if (taskInBlock(gt.task, block)) bTasks.push(gt);
                }
            }
            const isCurrent = nowMs >= block.startDate.getTime() && nowMs <= block.endDate.getTime();
            let todayPct = 0;
            if (isCurrent && block.totalDays > 0) {
                todayPct = Math.max(0, Math.min(100, ((nowMs - block.startDate.getTime()) / (block.totalDays * 86400000)) * 100));
            }
            return { block, tasks: bTasks, isCurrent, todayPct };
        });
    }, [sortedBlocks, grouped]);

    const toggleProject = (pid: string) => { setCollapsedProjects(prev => { const n = new Set(prev); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; }); };

    // Stats pour l'intro
    const ganttStats = useMemo(() => {
        let count = 0;
        for (const p of projects) { if (p.tasks?.length) count += p.tasks.length; }
        const projCount = projects.filter(p => p.tasks?.length).length;
        return { tasks: count, projects: projCount };
    }, [projects]);

    if (!showGantt) return <GanttIntro totalTasks={ganttStats.tasks} totalProjects={ganttStats.projects} onEnter={() => setShowGantt(true)} />;

    if (!allTasks.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4"><CalendarRange size={36} className="text-primary-yellow" /></div>
                <h2 className="text-lg font-black text-slate-800 mb-2">Diagramme de Gantt</h2>
                <p className="text-xs text-slate-600 font-semibold text-center">Aucune tâche. Créez des projets avec des tâches.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barre supérieure */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5"><CalendarRange size={16} className="text-primary-yellow" /><h2 className="text-[12px] font-black text-slate-800 uppercase">Gantt</h2></div>
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                        <button onClick={() => setViewMode("cartes")} className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "cartes" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>Cartes</button>
                        <button onClick={() => setViewMode("timeline")} className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all ${viewMode === "timeline" ? "bg-vibrant-blue text-white shadow-sm" : "text-slate-500"}`}>Timeline</button>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    <Filter size={9} className="text-slate-400 shrink-0" />
                    <button onClick={() => setFilterStatus("all")} className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 ${filterStatus === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>Tous ({stats.total})</button>
                    {Object.entries(statusConfig).map(([k, c]) => (
                        <button key={k} onClick={() => setFilterStatus(k)} className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0 ${filterStatus === k ? `${c.bg} ${c.text}` : "bg-slate-100 text-slate-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label} ({stats[k as keyof typeof stats]})
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-400" />
                        {(["mois", "semaine", "jour"] as ZoomLevel[]).map(z => (
                            <button key={z} onClick={() => setZoom(z)} className={`px-2 py-1 rounded-lg text-[9px] font-bold ${zoom === z ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"}`}>{z.charAt(0).toUpperCase() + z.slice(1)}</button>
                        ))}
                    </div>
                    {viewMode === "timeline" && (
                        <button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-bold text-slate-600">
                            {sortOrder === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}{sortOrder === "desc" ? "Récent ↑" : "Ancien ↓"}
                        </button>
                    )}
                </div>
                {/* Sélecteur de période */}
                {viewMode === "timeline" && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <CalendarDays size={10} className="text-slate-400 shrink-0" />
                        <button onClick={() => setUseCustomPeriod(!useCustomPeriod)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 ${useCustomPeriod ? "bg-vibrant-blue text-white" : "bg-slate-100 text-slate-600"}`}>
                            Période
                        </button>
                        {useCustomPeriod && (
                            <>
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} title="Date début"
                                    aria-label="Date début de période" placeholder="Début"
                                    className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[110px]" />
                                <span className="text-[9px] text-slate-400">→</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} title="Date fin"
                                    aria-label="Date fin de période" placeholder="Fin"
                                    className="text-[9px] font-semibold border border-slate-200 rounded-lg px-1.5 py-1 bg-white w-[110px]" />
                                <button onClick={() => { setUseCustomPeriod(false); setCustomStart(""); setCustomEnd(""); }}
                                    className="p-1 rounded-lg bg-slate-100" title="Réinitialiser" aria-label="Réinitialiser période">
                                    <RotateCcw size={10} className="text-slate-400" />
                                </button>
                            </>
                        )}
                    </div>
                )}
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

            {/* ═══ MODE TIMELINE VERTICAL AVEC BARRES ═══ */}
            {viewMode === "timeline" && (
                <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                    {blockData.map((bd, bi) => {
                        const { block, tasks: bTasks, isCurrent, todayPct } = bd;
                        return (
                            <div key={bi} className={`border-b-2 ${isCurrent ? "border-primary-yellow/50 bg-amber-50/20" : "border-slate-100"}`}>
                                <div className={`sticky top-0 z-10 px-3 py-2 flex items-center gap-2 ${isCurrent ? "bg-amber-50" : "bg-slate-50"}`}>
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCurrent ? "bg-primary-yellow" : "bg-slate-300"}`} />
                                    <span className={`text-[11px] font-black ${isCurrent ? "text-primary-yellow" : "text-slate-500"}`}>{block.label}</span>
                                    <span className="text-[9px] font-bold text-slate-300 ml-auto">{bTasks.length}</span>
                                </div>

                                {bTasks.length > 0 ? (
                                    <div className="px-3 pb-3 space-y-1.5">
                                        {bTasks.map(gt => {
                                            const cfg = statusConfig[gt.task.statut] || statusConfig["todo"];
                                            const sD = parseDate(gt.task.dateDebut), eD = parseDate(gt.task.dateFin);
                                            const sel = selectedTask?.taskId === gt.taskId;

                                            let barLeftPct = 0, barWidthPct = 100;
                                            if (sD && eD && block.totalDays > 0) {
                                                const bSt = Math.max(block.startDate.getTime(), sD.getTime());
                                                const bEn = Math.min(block.endDate.getTime(), eD.getTime());
                                                barLeftPct = Math.max(0, ((bSt - block.startDate.getTime()) / (block.totalDays * 86400000)) * 100);
                                                barWidthPct = Math.max(8, (((bEn - bSt) + 86400000) / (block.totalDays * 86400000)) * 100);
                                            } else if (sD) { barLeftPct = 0; barWidthPct = 50; }
                                            else if (eD) { barLeftPct = 50; barWidthPct = 50; }

                                            return (
                                                <button key={gt.taskId} onClick={() => setSelectedTask(sel ? null : gt)}
                                                    className={`w-full rounded-xl transition-all active:scale-[0.98] ${sel ? "ring-2 ring-vibrant-blue ring-offset-1" : ""}`}>
                                                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                                                        <span className="text-[10px] font-bold text-slate-700 truncate">{gt.task.designation}</span>
                                                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} shrink-0`}>{cfg.label}</span>
                                                        <span className="text-[8px] text-slate-400 font-semibold ml-auto shrink-0">📁 {gt.projectName}</span>
                                                    </div>
                                                    <div className="w-full h-7 bg-slate-100 rounded-lg relative overflow-hidden">
                                                        <div className={`absolute inset-y-0.5 rounded-md ${cfg.bar} shadow-sm flex items-center`}
                                                            style={{ left: `${barLeftPct}%`, width: `${barWidthPct}%`, opacity: gt.task.statut === "termine" ? 0.7 : 1 }}>
                                                            {barWidthPct > 20 && (
                                                                <span className="text-[8px] font-bold text-white px-1.5 truncate leading-5">
                                                                    {sD ? fmtShort(sD) : "?"} → {eD ? fmtShort(eD) : "?"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isCurrent && todayPct > 0 && (
                                                            <div className="absolute top-0 bottom-0 w-0.5 bg-primary-yellow/80 z-10" style={{ left: `${todayPct}%` }} />
                                                        )}
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

            {/* Détail complet */}
            {selectedTask && <TaskDetail ganttTask={selectedTask} onClose={() => setSelectedTask(null)} allProjects={projects} />}
        </div>
    );
}