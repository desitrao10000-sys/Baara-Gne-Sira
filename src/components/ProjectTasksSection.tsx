"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, AlertTriangle, ChevronDown, ChevronUp, ClipboardList, Calendar, User, TrendingUp, TrendingDown, MessageSquare, ShieldAlert } from "lucide-react";
import { ProjectTask, BudgetItem } from "@/lib/useSupabaseProjects";
import EntryPaymentHelper from "./EntryPaymentHelper";

interface Props {
    tasks: ProjectTask[] | undefined;
    projectMembers?: string[];
    onSave: (tasks: ProjectTask[]) => void;
}

const STATUTS = [
    { value: "todo", label: "À faire", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    { value: "en-cours", label: "En cours", color: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
    { value: "en-retard", label: "En retard", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
    { value: "termine", label: "Terminé", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200" },
] as const;

type StatutValue = "todo" | "en-cours" | "en-retard" | "termine";

function newBudgetItem(): BudgetItem {
    return { id: crypto.randomUUID(), designation: "", montant: 0 };
}

function sumItems(items: BudgetItem[]): number {
    return items.reduce((s, it) => s + (it.montant || 0), 0);
}

function migrateTask(t: any): ProjectTask {
    return {
        id: t.id,
        designation: t.designation || "",
        description: t.description || "",
        objectifs: t.objectifs || "",
        responsable: t.responsable || "",
        dateDebut: t.dateDebut || "",
        dateFin: t.dateFin || "",
        statut: t.statut || "todo",
        budgetEntreesPrev: Array.isArray(t.budgetEntreesPrev) ? t.budgetEntreesPrev : (typeof t.budgetEntreesPrev === "number" && t.budgetEntreesPrev > 0 ? [{ id: crypto.randomUUID(), designation: "Entrée prévue", montant: t.budgetEntreesPrev }] : []),
        budgetSortiesPrev: Array.isArray(t.budgetSortiesPrev) ? t.budgetSortiesPrev : (typeof t.budgetSortiesPrev === "number" && t.budgetSortiesPrev > 0 ? [{ id: crypto.randomUUID(), designation: "Sortie prévue", montant: t.budgetSortiesPrev }] : []),
        budgetEntreesReel: Array.isArray(t.budgetEntreesReel) ? t.budgetEntreesReel : (typeof t.budgetEntreesReel === "number" && t.budgetEntreesReel > 0 ? [{ id: crypto.randomUUID(), designation: "Entrée réelle", montant: t.budgetEntreesReel }] : []),
        budgetSortiesReel: Array.isArray(t.budgetSortiesReel) ? t.budgetSortiesReel : (typeof t.budgetSortiesReel === "number" && t.budgetSortiesReel > 0 ? [{ id: crypto.randomUUID(), designation: "Sortie réelle", montant: t.budgetSortiesReel }] : []),
        risques: t.risques || "",
        suggestionResolution: t.suggestionResolution || "",
        commentaires: t.commentaires || "",
    };
}

function emptyTask(): ProjectTask {
    return {
        id: crypto.randomUUID(),
        designation: "", description: "", objectifs: "", responsable: "",
        dateDebut: "", dateFin: "", statut: "todo",
        budgetEntreesPrev: [],
        budgetSortiesPrev: [],
        budgetEntreesReel: [],
        budgetSortiesReel: [],
        risques: "", suggestionResolution: "", commentaires: "",
    };
}

function getEffectiveStatus(task: ProjectTask): ProjectTask["statut"] {
    if (task.statut === "termine") return "termine";
    const fin = task.dateFin ? new Date(task.dateFin + "T00:00:00") : null;
    const debut = task.dateDebut ? new Date(task.dateDebut + "T00:00:00") : null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (fin && fin < now) return "en-retard";
    if (debut && debut <= now && (!fin || fin >= now)) return "en-cours";
    return "todo";
}

function fmt(n: number) { return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { if (!d) return "—"; try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } }

export default function ProjectTasksSection({ tasks = [], projectMembers = [], onSave }: Props) {
    const migratedTasks = tasks.map(migrateTask);
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [form, setForm] = useState<ProjectTask>(emptyTask());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const openAdd = () => { setForm(emptyTask()); setEditingTask(null); setShowForm(true); };
    const openEdit = (t: ProjectTask) => { setForm({ ...t }); setEditingTask(t); setShowForm(true); };
    const cancelForm = () => { setShowForm(false); setEditingTask(null); };

    const saveForm = () => {
        if (!form.designation.trim()) return;
        let updated: ProjectTask[];
        if (editingTask) {
            updated = migratedTasks.map((t) => t.id === editingTask.id ? form : t);
        } else {
            updated = [...migratedTasks, form];
        }
        onSave(updated);
        setShowForm(false);
        setEditingTask(null);
        setExpandedId(form.id); // Auto-expand pour voir le budget
    };

    const deleteTask = (id: string) => {
        onSave(migratedTasks.filter((t) => t.id !== id));
        setDeleteId(null);
        if (expandedId === id) setExpandedId(null);
    };

    const updateStatut = (id: string, statut: StatutValue) => {
        onSave(migratedTasks.map((t) => t.id === id ? { ...t, statut } : t));
    };

    const statut = (v: StatutValue) => STATUTS.find((s) => s.value === v) ?? STATUTS[0];

    // Budget item helpers
    const addItem = (key: keyof Pick<ProjectTask, "budgetEntreesPrev" | "budgetSortiesPrev" | "budgetEntreesReel" | "budgetSortiesReel">) => {
        setForm({ ...form, [key]: [...form[key], newBudgetItem()] });
    };
    const removeItem = (key: keyof Pick<ProjectTask, "budgetEntreesPrev" | "budgetSortiesPrev" | "budgetEntreesReel" | "budgetSortiesReel">, itemId: string) => {
        setForm({ ...form, [key]: form[key].filter((it: BudgetItem) => it.id !== itemId) });
    };
    const updateItem = (key: keyof Pick<ProjectTask, "budgetEntreesPrev" | "budgetSortiesPrev" | "budgetEntreesReel" | "budgetSortiesReel">, itemId: string, field: "designation" | "montant", value: string | number) => {
        setForm({ ...form, [key]: form[key].map((it: BudgetItem) => it.id === itemId ? { ...it, [field]: field === "montant" ? (parseFloat(String(value).replace(/\s/g, "").replace(",", ".")) || 0) : value } : it) });
    };

    const soldePrev = sumItems(form.budgetEntreesPrev) - sumItems(form.budgetSortiesPrev);
    const soldeReel = sumItems(form.budgetEntreesReel) - sumItems(form.budgetSortiesReel);
    const ecart = soldeReel - soldePrev;

    // Render budget items editor
    const renderBudgetEditor = (
        title: string,
        icon: React.ReactNode,
        bgColor: string,
        borderColor: string,
        key: keyof Pick<ProjectTask, "budgetEntreesPrev" | "budgetSortiesPrev" | "budgetEntreesReel" | "budgetSortiesReel">,
        label: string,
        signColor: string,
        sign: string
    ) => (
        <div className={`${bgColor} rounded-xl p-3 border ${borderColor} space-y-3`}>
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">{icon} {title}</p>
            <p className="text-[11px] font-semibold text-slate-500">{label}</p>
            <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_110px_28px] gap-1.5 items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Désignation</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase">Montant</span>
                    <span></span>
                </div>
                {form[key].map((item: BudgetItem) => (
                    <div key={item.id} className="grid grid-cols-[1fr_110px_28px] gap-1.5 items-center">
                        <input type="text" value={item.designation} onChange={(e) => updateItem(key, item.id, "designation", e.target.value)} placeholder="Désignation..." inputMode="text"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-blue-400" />
                        <input type="text" inputMode="numeric" value={item.montant || ""} onChange={(e) => updateItem(key, item.id, "montant", e.target.value)} placeholder="0"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-blue-400" />
                        <button onClick={() => removeItem(key, item.id)} className="p-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors" aria-label="Supprimer">
                            <X size={12} className="text-red-400" />
                        </button>
                    </div>
                ))}
                {/* Add button */}
                <button onClick={() => addItem(key)} className="w-full py-1.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-white/50 transition-colors">
                    <Plus size={12} /> Ajouter une ligne
                </button>
                {/* Total */}
                {form[key].length > 0 && (
                    <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                        <span className="font-black text-slate-700">Total</span>
                        <span className={`font-black ${signColor}`}>{sign}{fmt(sumItems(form[key]))} FCFA</span>
                    </div>
                )}
            </div>
        </div>
    );

    const fieldInput = (label: string, key: keyof ProjectTask, placeholder: string, type: "text" | "date" | "number" | "textarea" = "text") => (
        <div key={key}>
            <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1 block">{label}</label>
            {type === "textarea" ? (
                <textarea value={String(form[key] ?? "")} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} rows={2} inputMode="text"
                    className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 resize-none transition-colors" />
            ) : type === "number" ? (
                <input type="text" inputMode="numeric" value={String(form[key] ?? 0)}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0 })}
                    placeholder={placeholder}
                    className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 transition-colors" />
            ) : (
                <input type={type} value={String(form[key] ?? "")} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} inputMode={type === "text" ? "text" : undefined}
                    className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 transition-colors" />
            )}
        </div>
    );

    // Render budget display for expanded view
    const renderBudgetDisplay = (
        title: string, icon: React.ReactNode, bgColor: string, borderColor: string,
        items: BudgetItem[], totalColor: string, sign: string
    ) => {
        const total = sumItems(items);
        return (
            <div className={`${bgColor} rounded-xl p-3 border ${borderColor}`}>
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">{icon} {title}</p>
                {items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs gap-2 overflow-hidden">
                                <span className="font-semibold text-slate-600 break-words flex-1 min-w-0">{item.designation || "—"}</span>
                                <span className={`font-black ${totalColor} shrink-0 whitespace-nowrap`}>{sign}{fmt(item.montant)} FCFA</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-xs border-t pt-1 mt-1" style={{ borderColor: borderColor.replace("border-", "") }}>
                            <span className="font-black text-slate-700">Total</span>
                            <span className={`font-black ${totalColor}`}>{sign}{fmt(total)} FCFA</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 font-semibold">Aucun élément</p>
                )}
            </div>
        );
    };

    return (
        <div className="mt-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-teal-300" />
                <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Section 4 — Tâches du projet</span>
                <div className="h-px flex-1 bg-teal-300" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 text-center mb-4">💡 Ces tâches s'affichent aussi dans Todo-Projet et Gantt. Toute modification se répercute partout.</p>

            {/* Liste des tâches */}
            {migratedTasks.length > 0 && (
                <div className="space-y-3 mb-4">
                    {migratedTasks.map((task) => {
                        const effectiveStatut = getEffectiveStatus(task);
                        const st = statut(effectiveStatut);
                        const expanded = expandedId === task.id;
                        const totalEP = sumItems(task.budgetEntreesPrev);
                        const totalSP = sumItems(task.budgetSortiesPrev);
                        const totalER = sumItems(task.budgetEntreesReel);
                        const totalSR = sumItems(task.budgetSortiesReel);
                        const soldePrevTask = totalEP - totalSP;
                        const soldeReelTask = totalER - totalSR;
                        const ecartTask = soldeReelTask - soldePrevTask;
                        return (
                            <div key={task.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                                {/* Header tâche */}
                                <div className="p-4 overflow-hidden">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${st.color}`} />
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <p className="text-sm font-black text-slate-900 break-words">{task.designation}</p>
                                            {task.responsable && <p className="text-[12px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 overflow-hidden"><User size={11} className="shrink-0" /> <span className="break-words">{task.responsable}</span></p>}
                                            <div className="flex items-center gap-2 mt-1">
                                                {task.dateDebut && <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-0.5 shrink-0"><Calendar size={10} /> {fmtDate(task.dateDebut)}</span>}
                                                {task.dateFin && <span className="text-[11px] text-slate-400 font-semibold shrink-0">→ {fmtDate(task.dateFin)}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors" aria-label="Modifier"><Pencil size={13} className="text-teal-600" /></button>
                                            <button onClick={() => setExpandedId(expanded ? null : task.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" aria-label="Détails">
                                                {expanded ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Résumé budget sur la carte */}
                                    {(totalEP > 0 || totalSP > 0 || totalER > 0 || totalSR > 0) && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {soldePrevTask !== 0 && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${soldePrevTask >= 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
                                                    📊 Prév. : {soldePrevTask >= 0 ? "+" : ""}{fmt(soldePrevTask)}
                                                </span>
                                            )}
                                            {(totalER > 0 || totalSR > 0) && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${soldeReelTask >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                    💰 Réel : {soldeReelTask >= 0 ? "+" : ""}{fmt(soldeReelTask)}
                                                </span>
                                            )}
                                            {(totalER > 0 || totalSR > 0) && ecartTask !== 0 && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ecartTask >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}>
                                                    {ecartTask >= 0 ? "✅" : "⚠️"} Écart : {ecartTask >= 0 ? "+" : ""}{fmt(ecartTask)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Changer statut */}
                                    <div className="flex gap-1.5 mt-3 flex-wrap">
                                        {STATUTS.map((s) => (
                                            <button key={s.value} onClick={() => updateStatut(task.id, s.value as StatutValue)}
                                                className={`px-2 py-1 rounded-full text-[11px] font-black border transition-all ${effectiveStatut === s.value ? s.bg + " " + s.text : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${s.color}`} />{s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Détails expansibles */}
                                {expanded && (
                                    <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/50">
                                        {task.description && <div><p className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1">Description</p><p className="text-sm text-slate-700 font-semibold break-words whitespace-pre-wrap">{task.description}</p></div>}
                                        {task.objectifs && <div><p className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1">Objectifs</p><p className="text-sm text-slate-700 font-semibold break-words whitespace-pre-wrap">{task.objectifs}</p></div>}

                                        {/* Budget prévisionnel */}
                                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                            <p className="text-[11px] font-black text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={12} /> Budget prévisionnel</p>
                                            <div className="space-y-2">
                                                {renderBudgetDisplay("Entrées prévues (paiements clients / fonds portefeuille)", <TrendingUp size={11} className="text-green-600" />, "bg-white", "border-green-200", task.budgetEntreesPrev, "text-green-700", "+")}
                                                {renderBudgetDisplay("Sorties prévues (dépenses total prévisionnel pour la tache)", <TrendingDown size={11} className="text-red-500" />, "bg-white", "border-red-200", task.budgetSortiesPrev, "text-red-600", "-")}
                                                <div className="flex justify-between text-xs border-t border-blue-200 pt-1 mt-1">
                                                    <span className="font-black text-blue-700">Solde prévisionnel</span>
                                                    <span className={`font-black ${soldePrevTask >= 0 ? "text-green-700" : "text-red-600"}`}>{soldePrevTask >= 0 ? "+" : ""}{fmt(soldePrevTask)} FCFA</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Budget réel */}
                                        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                                            <p className="text-[11px] font-black text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingDown size={12} /> Budget suivi réel</p>
                                            <div className="space-y-2">
                                                {renderBudgetDisplay("Entrées réelles (le montant total réel reçu venant de Sorties prévues pour réaliser la tache)", <TrendingUp size={11} className="text-green-600" />, "bg-white", "border-green-200", task.budgetEntreesReel, "text-green-700", "+")}
                                                {renderBudgetDisplay("Sorties réelles (le montant réellement dépensé pour réaliser la tache)", <TrendingDown size={11} className="text-red-500" />, "bg-white", "border-red-200", task.budgetSortiesReel, "text-red-600", "-")}
                                                <div className="space-y-1 border-t border-green-200 pt-1 mt-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-black text-green-700">Solde réel</span>
                                                        <span className={`font-black ${soldeReelTask >= 0 ? "text-green-700" : "text-red-600"}`}>{soldeReelTask >= 0 ? "+" : ""}{fmt(soldeReelTask)} FCFA</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-black text-slate-700">Écart avec prévisionnel</span>
                                                        <span className={`font-black ${ecartTask >= 0 ? "text-green-700" : "text-red-600"}`}>{ecartTask >= 0 ? "+" : ""}{fmt(ecartTask)} FCFA</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {task.risques && (
                                            <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                                                <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert size={12} /> Risques</p>
                                                <p className="text-xs text-slate-700 font-semibold break-words whitespace-pre-wrap">{task.risques}</p>
                                                {task.suggestionResolution && <><p className="text-[11px] font-black text-orange-700 uppercase tracking-wider mb-1 mt-2">Suggestion de résolution</p><p className="text-xs text-slate-700 font-semibold break-words whitespace-pre-wrap">{task.suggestionResolution}</p></>}
                                            </div>
                                        )}

                                        {task.commentaires && (
                                            <div className="bg-slate-100 rounded-xl p-3">
                                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare size={12} /> Commentaires</p>
                                                <p className="text-xs text-slate-700 font-semibold break-words whitespace-pre-wrap">{task.commentaires}</p>
                                            </div>
                                        )}

                                        {/* Supprimer */}
                                        {deleteId !== task.id ? (
                                            <button onClick={() => setDeleteId(task.id)} className="w-full py-2 rounded-xl border-2 border-dashed border-red-200 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors">
                                                <Trash2 size={13} /> Supprimer cette tâche
                                            </button>
                                        ) : (
                                            <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                                                <p className="text-xs font-black text-red-700 flex items-center gap-1.5 mb-2"><AlertTriangle size={13} /> Confirmer la suppression ?</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => deleteTask(task.id)} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
                                                    <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-slate-200"><X size={12} /> Annuler</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {migratedTasks.length === 0 && !showForm && (
                <div className="text-center py-8 mb-4">
                    <ClipboardList size={40} className="text-teal-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-sm">Aucune tâche pour ce projet</p>
                    <p className="text-slate-400 text-xs mt-1">Ajoute la première tâche pour démarrer</p>
                </div>
            )}

            {/* Bouton ajouter */}
            {!showForm && (
                <button onClick={openAdd} className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-transform">
                    <Plus size={18} /> {migratedTasks.length > 0 ? "Ajouter une tâche" : "Créer la première tâche"}
                </button>
            )}

            {/* Formulaire ajout/modif */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 space-y-4">
                    <p className="text-sm font-black text-teal-700 flex items-center gap-2">
                        <ClipboardList size={16} />{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
                    </p>

                    {fieldInput("Désignation *", "designation", "Ex: Achat équipements")}
                    {fieldInput("Description", "description", "Description détaillée...", "textarea")}
                    {fieldInput("Objectifs", "objectifs", "Objectifs à atteindre...", "textarea")}

                    {/* Responsable */}
                    <div>
                        <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1 block">Responsable assigné</label>
                        {projectMembers.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                                {projectMembers.map((m) => (
                                    <button key={m} onClick={() => setForm({ ...form, responsable: m })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${form.responsable === m ? "bg-teal-600 text-white border-teal-600" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <input type="text" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Ex: Moussa Traoré" inputMode="text"
                                className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 transition-colors" />
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1 block">Date début</label>
                            <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} title="Date début"
                                className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 transition-colors" />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1 block">Date fin prévue</label>
                            <input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} title="Date fin"
                                className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 transition-colors" />
                        </div>
                    </div>

                    {/* Statut */}
                    <div>
                        <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-2 block">Statut</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUTS.map((s) => (
                                <button key={s.value} onClick={() => setForm({ ...form, statut: s.value as StatutValue })}
                                    className={`py-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${form.statut === s.value ? s.bg + " " + s.text : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                    <span className={`w-2 h-2 rounded-full ${s.color}`} />{s.label}
                                    {form.statut === s.value && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget prévisionnel */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 space-y-3">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12} className="text-blue-600" /> Budget prévisionnel — Entrées</p>
                        <p className="text-[11px] font-semibold text-slate-500">Entrées prévues (paiements clients / fonds portefeuille)</p>
                        {/* Helper Paiement Client / Fonds Portefeuille */}
                        <EntryPaymentHelper onValidate={(items) => {
                            const newItems = items.map(it => ({ id: crypto.randomUUID(), designation: it.designation, montant: it.montant }));
                            setForm({ ...form, budgetEntreesPrev: [...form.budgetEntreesPrev, ...newItems] });
                        }} />
                        {/* Lignes validées depuis le helper */}
                        {form.budgetEntreesPrev.length > 0 && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-[1fr_110px_28px] gap-1.5 items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Désignation</span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Montant</span>
                                    <span></span>
                                </div>
                                {form.budgetEntreesPrev.map((item: BudgetItem) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_110px_28px] gap-1.5 items-center">
                                        <input type="text" value={item.designation} onChange={(e) => updateItem("budgetEntreesPrev", item.id, "designation", e.target.value)} placeholder="Désignation..." className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-blue-400" />
                                        <input type="text" inputMode="numeric" value={item.montant || ""} onChange={(e) => updateItem("budgetEntreesPrev", item.id, "montant", e.target.value)} placeholder="0" className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-blue-400" />
                                        <button onClick={() => removeItem("budgetEntreesPrev", item.id)} className="p-1 rounded-lg bg-red-50" aria-label="Supprimer"><X size={12} className="text-red-400" /></button>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                                    <span className="font-black text-slate-700">Total</span>
                                    <span className="font-black text-green-700">+{fmt(sumItems(form.budgetEntreesPrev))} FCFA</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {renderBudgetEditor("Budget prévisionnel — Sorties", <TrendingDown size={12} className="text-blue-600" />, "bg-blue-50", "border-blue-200", "budgetSortiesPrev", "Sorties prévues (dépenses total prévisionnel pour la tache)", "text-red-600", "-")}

                    {/* Solde prévisionnel */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                        <div className="flex justify-between text-sm">
                            <span className="font-black text-blue-700">Solde prévisionnel</span>
                            <span className={`font-black ${soldePrev >= 0 ? "text-green-700" : "text-red-600"}`}>{soldePrev >= 0 ? "+" : ""}{fmt(soldePrev)} FCFA</span>
                        </div>
                    </div>

                    {/* Budget réel */}
                    {renderBudgetEditor("Budget réel — Entrées", <TrendingUp size={12} className="text-green-600" />, "bg-green-50", "border-green-200", "budgetEntreesReel", "Entrées réelles (le montant total réel reçu venant de Sorties prévues pour réaliser la tache)", "text-green-700", "+")}
                    {renderBudgetEditor("Budget réel — Sorties", <TrendingDown size={12} className="text-green-600" />, "bg-green-50", "border-green-200", "budgetSortiesReel", "Sorties réelles (le montant réellement dépensé pour réaliser la tache)", "text-red-600", "-")}

                    {/* Solde réel + écart */}
                    <div className="bg-green-50 rounded-xl p-3 border border-green-200 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-black text-green-700">Solde réel</span>
                            <span className={`font-black ${soldeReel >= 0 ? "text-green-700" : "text-red-600"}`}>{soldeReel >= 0 ? "+" : ""}{fmt(soldeReel)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-black text-slate-700">Écart prévisionnel</span>
                            <span className={`font-black ${ecart >= 0 ? "text-green-700" : "text-red-600"}`}>{ecart >= 0 ? "+" : ""}{fmt(ecart)} FCFA</span>
                        </div>
                    </div>

                    {/* Risques */}
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 space-y-3">
                        <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={12} /> Risques & Résolution</p>
                        <div>
                            <label className="text-[11px] font-semibold text-orange-600 mb-1 block">Risques éventuels</label>
                            <textarea value={form.risques} onChange={(e) => setForm({ ...form, risques: e.target.value })} placeholder="Décris les risques potentiels..." rows={2} inputMode="text"
                                className="w-full p-2.5 rounded-xl border-2 border-orange-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 resize-none" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-orange-600 mb-1 block">Suggestion de résolution</label>
                            <textarea value={form.suggestionResolution} onChange={(e) => setForm({ ...form, suggestionResolution: e.target.value })} placeholder="Plan de mitigation..." rows={2} inputMode="text"
                                className="w-full p-2.5 rounded-xl border-2 border-orange-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 resize-none" />
                        </div>
                    </div>

                    {/* Commentaires */}
                    <div>
                        <label className="text-[11px] font-black text-teal-600 uppercase tracking-wider mb-1 flex items-center gap-1 block"><MessageSquare size={11} /> Commentaires et notes de suivi</label>
                        <textarea value={form.commentaires} onChange={(e) => setForm({ ...form, commentaires: e.target.value })} placeholder="Notes, observations, décisions..." rows={3} inputMode="text"
                            className="w-full p-2.5 rounded-xl border-2 border-teal-200 bg-teal-50 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 resize-none transition-colors" />
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-2">
                        <button onClick={saveForm} disabled={!form.designation.trim()} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${form.designation.trim() ? "bg-teal-600 text-white active:scale-95 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                            <Check size={15} /> {editingTask ? "Mettre à jour" : "Créer la tâche"}
                        </button>
                        <button onClick={cancelForm} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                            <X size={15} /> Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}