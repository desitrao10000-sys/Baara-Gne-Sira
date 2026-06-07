"use client";

import { useState, useMemo, useEffect } from "react";
import {
    UserCheck, Calendar, User, AlertTriangle,
    CheckCircle2, Search, X, ArrowRight, Plus, Pencil,
} from "lucide-react";

interface PersoTask {
    id: string;
    designation: string;
    description: string;
    responsable: string;
    dateDebut: string;
    dateFin: string;
    statut: "todo" | "en-cours" | "en-retard" | "termine";
    commentaires: string;
}

const statusCfg: Record<string, { bg: string; border: string; text: string; dot: string; label: string; emoji: string }> = {
    "todo": { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", dot: "bg-indigo-500", label: "À faire", emoji: "📋" },
    "en-cours": { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", dot: "bg-orange-500", label: "En cours", emoji: "⏳" },
    "en-retard": { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", dot: "bg-rose-500", label: "En retard", emoji: "⚠️" },
    "termine": { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500", label: "Terminé", emoji: "✅" },
};

function parseDate(d: string): Date | null { if (!d) return null; const p = new Date(d + "T00:00:00"); return isNaN(p.getTime()) ? null : p; }
function fmtDate(d: Date): string { return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function daysBetween(a: Date, b: Date): number { return Math.ceil((b.getTime() - a.getTime()) / 86400000); }

function getEffectiveStatus(t: PersoTask): PersoTask["statut"] {
    if (t.statut === "termine") return "termine";
    const fin = parseDate(t.dateFin), debut = parseDate(t.dateDebut);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (fin && fin < now) return "en-retard";
    if (debut && debut <= now && (!fin || fin >= now)) return "en-cours";
    return "todo";
}

function emptyTask(): PersoTask {
    return { id: crypto.randomUUID(), designation: "", description: "", responsable: "", dateDebut: "", dateFin: "", statut: "todo", commentaires: "" };
}

function getExampleTasks(): PersoTask[] {
    const now = new Date();
    const d = (offset: number) => { const x = new Date(now); x.setDate(x.getDate() + offset); return x.toISOString().slice(0, 10); };
    return [
        { id: crypto.randomUUID(), designation: "Renouveler abonnement Internet", description: "Payer l'abonnement mensuel Orange Sonatel avant expiration", responsable: "Moi", dateDebut: d(-5), dateFin: d(5), statut: "en-cours", commentaires: "Facture de 25 000 FCFA" },
        { id: crypto.randomUUID(), designation: "Cours de formation Python", description: "Terminer le module 3 du cours DataCamp", responsable: "Moi", dateDebut: d(2), dateFin: d(30), statut: "todo", commentaires: "Objectif : certifier avant fin du mois" },
        { id: crypto.randomUUID(), designation: "Rendez-vous dentiste", description: "Contrôle semestriel chez Dr. Diallo", responsable: "Moi", dateDebut: d(-20), dateFin: d(-10), statut: "todo", commentaires: "Appeler pour confirmer" },
        { id: crypto.randomUUID(), designation: "Achat fournitures bureau", description: "Cahiers, stylos, ramette papier A4", responsable: "Fatou", dateDebut: d(-15), dateFin: d(-3), statut: "termine", commentaires: "Acheté chez Citydia" },
    ];
}

const STORAGE_KEY = "baara-todo-perso";
function loadTasks(): PersoTask[] {
    if (typeof window === "undefined") return [];
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch { /* */ }
    const examples = getExampleTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
    return examples;
}
function saveToStorage(tasks: PersoTask[]) { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

/* ─── Détail / Edition ─── */
function TaskDetailPanel({ task, onClose, onSave }: { task: PersoTask; onClose: () => void; onSave: (t: PersoTask) => void }) {
    const [local, setLocal] = useState<PersoTask>({ ...task });
    const [editField, setEditField] = useState<string | null>(null);
    const es = getEffectiveStatus(local);
    const cfg = statusCfg[es] || statusCfg["todo"];
    const sD = parseDate(local.dateDebut), eD = parseDate(local.dateFin);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const isLate = es === "en-retard";
    const dL = isLate && eD ? daysBetween(eD, now) : 0;
    const dur = (sD && eD) ? daysBetween(sD, eD) + 1 : 0;
    const set = (c: Partial<PersoTask>) => setLocal(p => ({ ...p, ...c }));

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t-2 border-indigo-500 shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={"w-3.5 h-3.5 rounded-full shrink-0 " + cfg.dot} />
                    {editField === "designation" ? (
                        <input value={local.designation} onChange={e => set({ designation: e.target.value })} autoFocus placeholder="Nom de la tâche"
                            className="text-[14px] font-black text-slate-800 bg-transparent border-b-2 border-indigo-500 focus:outline-none flex-1 min-w-0" />
                    ) : (
                        <p className="text-[14px] font-black text-slate-800 flex-1 min-w-0 break-words">{local.designation || "Sans nom"}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditField(editField === "designation" ? null : "designation")} className="p-1.5 bg-slate-100 rounded-full" title="Modifier"><Pencil size={13} className="text-slate-500" /></button>
                    <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full" title="Fermer"><X size={16} className="text-slate-500" /></button>
                </div>
            </div>
            <div className="overflow-y-auto px-4 py-2 space-y-2.5 flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="flex flex-wrap items-center gap-1.5">
                    {(Object.entries(statusCfg) as [string, typeof statusCfg["todo"]][]).map(([k, c]) => (
                        <button key={k} type="button" onClick={() => set({ statut: k as PersoTask["statut"] })}
                            className={"text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 " + (es === k ? c.bg + " " + c.text + " " + c.border + " shadow-sm" : "bg-white text-slate-400 border-slate-200")}>
                            {c.emoji} {c.label}
                        </button>
                    ))}
                </div>
                <p className="text-[9px] text-slate-400 italic">💡 Cliquez un statut pour reclasser. Modifiez les dates pour classement auto.</p>

                {/* Dates */}
                <div className="bg-slate-50 rounded-xl p-2.5">
                    {editField === "dates" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div><label className="text-slate-800 block text-[10px] font-black mb-0.5">Début</label>
                                <input type="date" value={local.dateDebut || ""} onChange={e => set({ dateDebut: e.target.value })} autoFocus className="text-[11px] font-bold border border-indigo-400 rounded-lg px-1.5 py-0.5 bg-white" /></div>
                            <span className="text-slate-300 mt-3">→</span>
                            <div><label className="text-slate-800 block text-[10px] font-black mb-0.5">Fin</label>
                                <input type="date" value={local.dateFin || ""} onChange={e => set({ dateFin: e.target.value })} className="text-[11px] font-bold border border-indigo-400 rounded-lg px-1.5 py-0.5 bg-white" /></div>
                            {dur > 0 && <span className="ml-auto mt-3 text-indigo-600 font-black text-[12px]">{dur}j</span>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar size={12} className="text-slate-500" />
                            <span className="text-[12px] text-slate-700 font-bold break-words">{sD ? fmtDate(sD) : "—"} → {eD ? fmtDate(eD) : "—"}</span>
                            {dur > 0 && <span className="ml-auto text-indigo-600 font-black text-[12px]">{dur}j</span>}
                        </div>
                    )}
                    {isLate && dL > 0 && <div className="flex items-center gap-1 mt-1.5 text-rose-600 bg-rose-50 rounded-lg px-2 py-0.5"><AlertTriangle size={11} /><span className="text-[10px] font-bold">Retard : {dL}j</span></div>}
                    <button onClick={() => setEditField(editField === "dates" ? null : "dates")} className="mt-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-0.5"><Pencil size={9} /> {editField === "dates" ? "Terminer" : "Modifier"}</button>
                </div>

                {/* Responsable */}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-0.5">👤 Responsable / Partenaire</h4>
                    {editField === "responsable" ? (
                        <input value={local.responsable || ""} onChange={e => set({ responsable: e.target.value })} autoFocus placeholder="Ex: Moi, Fatou..."
                            className="w-full text-[11px] text-slate-700 font-bold border border-indigo-400 rounded-xl px-2 py-1.5 bg-white focus:outline-none" />
                    ) : (
                        <p className="text-[12px] text-slate-700 font-bold bg-slate-50 rounded-xl p-2 break-words">{local.responsable || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    )}
                    <button onClick={() => setEditField(editField === "responsable" ? null : "responsable")} className="mt-0.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-0.5"><Pencil size={9} /> {editField === "responsable" ? "Terminer" : "Modifier"}</button>
                </div>

                {/* Description */}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-0.5">📝 Description / Objectifs</h4>
                    {editField === "description" ? (
                        <textarea value={local.description || ""} onChange={e => set({ description: e.target.value })} rows={3} autoFocus
                            className="w-full text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-2 border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
                    ) : (
                        <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-2 whitespace-pre-wrap break-words">
                            {local.description || <span className="italic text-slate-400">Non renseigné</span>}
                        </p>
                    )}
                    <button onClick={() => setEditField(editField === "description" ? null : "description")} className={"mt-0.5 text-[10px] font-bold flex items-center gap-0.5 " + (editField === "description" ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600")}><Pencil size={9} /> {editField === "description" ? "Terminer" : "Modifier"}</button>
                </div>

                {/* Commentaires */}
                <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase mb-0.5">💬 Commentaires</h4>
                    {editField === "commentaires" ? (
                        <textarea value={local.commentaires || ""} onChange={e => set({ commentaires: e.target.value })} rows={2} autoFocus
                            className="w-full text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-2 border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
                    ) : (
                        <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-2 whitespace-pre-wrap break-words">
                            {local.commentaires || <span className="italic text-slate-400">Non renseigné</span>}
                        </p>
                    )}
                    <button onClick={() => setEditField(editField === "commentaires" ? null : "commentaires")} className={"mt-0.5 text-[10px] font-bold flex items-center gap-0.5 " + (editField === "commentaires" ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600")}><Pencil size={9} /> {editField === "commentaires" ? "Terminer" : "Modifier"}</button>
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-t border-slate-200 bg-white">
                <button onClick={() => { onSave(local); onClose(); }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                    <CheckCircle2 size={16} /> Valider
                </button>
                <button onClick={onClose}
                    className="flex-1 py-2.5 bg-white text-rose-600 rounded-xl font-extrabold text-[13px] border-2 border-rose-300 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                    <X size={16} /> Annuler
                </button>
            </div>
        </div>
    );
}

/* ─── Page intro ─── */
function TodoPersoIntro({ totalTasks, onEnter }: { totalTasks: number; onEnter: () => void }) {
    return (
        <div className="flex-1 overflow-y-auto slide-in" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex flex-col items-center p-5 pb-6 min-h-full">
                <div className="w-full rounded-3xl bg-gradient-to-br from-indigo-700 to-purple-600 p-6 mb-5 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3"><UserCheck size={34} className="text-amber-300" /></div>
                    <h1 className="text-[22px] font-black text-white mb-1 uppercase tracking-wide">Todo-Perso</h1>
                    <p className="text-[13px] font-bold text-amber-300">{totalTasks} tâche{totalTasks > 1 ? "s" : ""} personnelle{totalTasks > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 w-full mb-4">
                    <h2 className="text-[15px] font-black text-indigo-800 mb-3">📌 Qu'est-ce que le Todo-Perso ?</h2>
                    <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                        Le <span className="font-black text-indigo-800">Todo-Perso</span> est votre espace autonome pour gérer vos tâches personnelles. <span className="font-bold text-purple-700">Indépendant des projets</span>, il vous permet d'organiser votre quotidien.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">📋</span>
                            <span className="text-[12px] font-black text-indigo-700">À faire</span>
                            <p className="text-[9px] text-indigo-600 font-semibold mt-1 leading-tight">Date début la plus proche → la plus loin</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">⏳</span>
                            <span className="text-[12px] font-black text-orange-700">En cours</span>
                            <p className="text-[9px] text-orange-600 font-semibold mt-1 leading-tight">Durée la plus courte → la plus longue</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">⚠️</span>
                            <span className="text-[12px] font-black text-rose-700">En retard</span>
                            <p className="text-[9px] text-rose-600 font-semibold mt-1 leading-tight">La plus en retard → la moins en retard</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                            <span className="text-[18px] block mb-1">✅</span>
                            <span className="text-[12px] font-black text-emerald-700">Terminé</span>
                            <p className="text-[9px] text-emerald-600 font-semibold mt-1 leading-tight">Terminée le plus tôt → le plus tard</p>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
                        📝 Créez des tâches avec <span className="font-bold">dates</span>, <span className="font-bold">responsable</span>, <span className="font-bold">description</span> et <span className="font-bold">commentaires</span>. Le classement se fait automatiquement.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                        <h3 className="text-[12px] font-black text-indigo-800 mb-1.5">🎯 Autonome et simple</h3>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                            Todo-Perso est <span className="font-bold">indépendant</span> des projets. Vos tâches personnelles sont stockées localement. Ajoutez, modifiez et reclassez en un clic.
                        </p>
                    </div>
                </div>
                <button onClick={onEnter} className="w-full py-4 bg-gradient-to-r from-indigo-700 to-purple-600 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-[15px]">
                    Accéder au Todo-Perso <ArrowRight size={20} className="text-amber-300" />
                </button>
            </div>
        </div>
    );
}

/* ─── Liste ─── */
function TodoPersoList({ tasks, onSave }: { tasks: PersoTask[]; onSave: (t: PersoTask[]) => void }) {
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [selectedTask, setSelectedTask] = useState<PersoTask | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newTask, setNewTask] = useState<PersoTask>(emptyTask());

    const allTasks = useMemo(() => tasks.map(t => ({ ...t, statut: getEffectiveStatus(t) })), [tasks]);
    const filtered = useMemo(() => {
        let r = allTasks;
        if (filterStatus !== "all") r = r.filter(t => t.statut === filterStatus);
        if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); r = r.filter(t => t.designation.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)); }
        if (dateStart) { const ds = new Date(dateStart + "T00:00:00"); r = r.filter(t => { const d = parseDate(t.dateDebut) || parseDate(t.dateFin); return d && d >= ds; }); }
        if (dateEnd) { const de = new Date(dateEnd + "T23:59:59"); r = r.filter(t => { const d = parseDate(t.dateFin) || parseDate(t.dateDebut); return d && d <= de; }); }
        return r;
    }, [allTasks, filterStatus, searchQuery, dateStart, dateEnd]);

    const sorted = useMemo(() => {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        return [...filtered].sort((a, b) => {
            const pr: Record<string, number> = { "en-retard": 0, "en-cours": 1, "todo": 2, "termine": 3 };
            const pa = pr[a.statut] ?? 4, pb = pr[b.statut] ?? 4;
            if (pa !== pb) return pa - pb;
            const sA = parseDate(a.dateDebut), eA = parseDate(a.dateFin), sB = parseDate(b.dateDebut), eB = parseDate(b.dateFin);
            if (pa === 2) return (sA ? Math.abs(sA.getTime() - now.getTime()) : Infinity) - (sB ? Math.abs(sB.getTime() - now.getTime()) : Infinity);
            if (pa === 1) return ((sA && eA) ? eA.getTime() - sA.getTime() : Infinity) - ((sB && eB) ? eB.getTime() - sB.getTime() : Infinity);
            if (pa === 0) return (sB ? Math.abs(sB.getTime() - now.getTime()) : 0) - (sA ? Math.abs(sA.getTime() - now.getTime()) : 0);
            if (pa === 3) return (eA && eB) ? eA.getTime() - eB.getTime() : 0;
            return 0;
        });
    }, [filtered]);

    const stats = useMemo(() => {
        const s: Record<string, number> = { todo: 0, "en-cours": 0, "en-retard": 0, termine: 0, total: allTasks.length };
        for (const t of allTasks) { if (s[t.statut] !== undefined) s[t.statut]++; }
        return s;
    }, [allTasks]);

    const handleSaveTask = (updated: PersoTask) => {
        onSave(tasks.find(t => t.id === updated.id) ? tasks.map(t => t.id === updated.id ? updated : t) : [...tasks, updated]);
        setSelectedTask(null);
    };
    const handleAddTask = () => { if (!newTask.designation.trim()) return; onSave([...tasks, newTask]); setNewTask(emptyTask()); setShowAdd(false); };
    const resetFilters = () => { setFilterStatus("all"); setSearchQuery(""); setDateStart(""); setDateEnd(""); };

    return (
        <div className="flex-1 flex flex-col overflow-hidden slide-in">
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2">
                <div className="flex items-center gap-1 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <button onClick={() => setFilterStatus("all")} className={"px-2.5 py-1 rounded-lg shrink-0 " + (filterStatus === "all" ? "bg-slate-700 text-white" : "bg-slate-100 text-black font-bold")}>
                        <span className="text-[11px] font-black">Tous ({stats.total})</span>
                    </button>
                    {Object.entries(statusCfg).map(([k, c]) => (
                        <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}
                            className={"flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 " + (filterStatus === k ? c.bg + " " + c.text + " ring-2 ring-offset-1 " + c.border : c.bg + " " + c.text + " opacity-70")}>
                            <span className={"w-2 h-2 rounded-full " + c.dot} />
                            <span className="text-[11px] font-black">{c.emoji} {c.label} ({stats[k] || 0})</span>
                        </button>
                    ))}
                </div>
                <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..."
                        className="w-full pl-8 pr-3 py-1.5 text-[12px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                    <Calendar size={13} className="text-slate-500 shrink-0" />
                    <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} title="Début période"
                        className="text-[11px] font-black border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-700 w-[110px]" />
                    <span className="text-[11px] text-slate-400 font-black">→</span>
                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} title="Fin période"
                        className="text-[11px] font-black border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-700 w-[110px]" />
                    {(dateStart || dateEnd) && <button onClick={() => { setDateStart(""); setDateEnd(""); }} className="text-[10px] font-bold text-rose-500 shrink-0">✕</button>}
                </div>
                <button onClick={() => { setNewTask(emptyTask()); setShowAdd(true); }}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform">
                    <Plus size={14} /> Nouvelle tâche
                </button>
            </div>

            {showAdd && (
                <div className="shrink-0 bg-white border-b border-indigo-100 p-3 space-y-2">
                    <input value={newTask.designation} onChange={e => setNewTask({ ...newTask, designation: e.target.value })} placeholder="Nom de la tâche *"
                        className="w-full text-[13px] font-black text-slate-800 border border-slate-200 rounded-xl px-3 py-2 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
                    <div className="flex gap-2">
                        <div className="flex-1"><label className="text-[9px] font-black text-slate-500 block mb-0.5">Début</label>
                            <input type="date" value={newTask.dateDebut} onChange={e => setNewTask({ ...newTask, dateDebut: e.target.value })} className="w-full text-[11px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-white" /></div>
                        <div className="flex-1"><label className="text-[9px] font-black text-slate-500 block mb-0.5">Fin</label>
                            <input type="date" value={newTask.dateFin} onChange={e => setNewTask({ ...newTask, dateFin: e.target.value })} className="w-full text-[11px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-white" /></div>
                    </div>
                    <input value={newTask.responsable} onChange={e => setNewTask({ ...newTask, responsable: e.target.value })} placeholder="Responsable / Partenaire"
                        className="w-full text-[11px] font-semibold border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30" />
                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Description / Objectifs..." rows={2}
                        className="w-full text-[11px] border border-slate-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
                    <div className="flex gap-2">
                        <button onClick={handleAddTask} disabled={!newTask.designation.trim()}
                            className={"flex-1 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 " + (newTask.designation.trim() ? "bg-indigo-600 text-white active:scale-95" : "bg-slate-200 text-slate-400")}>
                            <CheckCircle2 size={14} /> Créer
                        </button>
                        <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl text-[12px] font-bold border border-slate-200 flex items-center justify-center gap-1">
                            <X size={14} /> Annuler
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="space-y-2">
                    {sorted.map(task => {
                        const c = statusCfg[task.statut] || statusCfg["todo"];
                        const sD = parseDate(task.dateDebut), eD = parseDate(task.dateFin);
                        const isLate = task.statut === "en-retard";
                        const dL = isLate && eD ? daysBetween(eD, new Date()) : 0;
                        return (
                            <button key={task.id} onClick={() => setSelectedTask(task)}
                                className={"w-full rounded-2xl border-2 p-3 shadow-sm transition-all text-left active:scale-[0.98] " + c.border + " " + c.bg}>
                                <div className="flex items-start gap-2 mb-1 overflow-hidden">
                                    <span className={"w-3 h-3 rounded-full shrink-0 mt-0.5 " + c.dot} />
                                    <p className="text-[13px] font-black text-slate-800 leading-tight flex-1 min-w-0 overflow-hidden break-words">{task.designation}</p>
                                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border " + c.bg + " " + c.text + " " + c.border}>{c.label}</span>
                                </div>
                                {task.description && <p className="text-[10px] text-slate-500 font-semibold ml-5 mb-1 line-clamp-2 overflow-hidden break-words">{task.description}</p>}
                                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                                    <span className="flex items-center gap-1"><Calendar size={9} /> {sD ? fmtDate(sD) : "—"} → {eD ? fmtDate(eD) : "—"}</span>
                                    {task.responsable && <span className="flex items-center gap-1"><User size={9} /> {task.responsable}</span>}
                                    {isLate && dL > 0 && <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={9} /> {dL}j</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
                {sorted.length === 0 && (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-slate-500 font-bold text-sm">Aucune tâche trouvée</p>
                        <button onClick={resetFilters} className="mt-2 text-[11px] font-bold text-indigo-600">Réinitialiser les filtres</button>
                    </div>
                )}
            </div>

            {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} onSave={handleSaveTask} />}
        </div>
    );
}

/* ─── Main ─── */
export default function TodoPerso() {
    const [showList, setShowList] = useState(false);
    const [tasks, setTasks] = useState<PersoTask[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => { setTasks(loadTasks()); setLoaded(true); }, []);

    const handleSave = (updated: PersoTask[]) => { setTasks(updated); saveToStorage(updated); };

    if (!loaded) return <div className="flex-1 flex items-center justify-center"><p className="text-slate-400 font-bold animate-pulse">Chargement...</p></div>;
    if (!showList) return <TodoPersoIntro totalTasks={tasks.length} onEnter={() => setShowList(true)} />;
    return <TodoPersoList tasks={tasks} onSave={handleSave} />;
}