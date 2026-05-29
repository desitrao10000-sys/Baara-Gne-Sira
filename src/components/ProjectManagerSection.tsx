"use client";
import { useState } from "react";
import { UserCircle2, Phone, Briefcase, ShieldCheck, Pencil, Check, X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { ProjectManager } from "@/lib/useSupabaseProjects";

interface Props {
    manager: ProjectManager | null | undefined;
    onSave: (manager: ProjectManager | null) => void;
}

const ACCESS_LEVELS = [
    { value: "administrateur", label: "Administrateur", desc: "Accès complet : lecture, écriture, suppression", color: "bg-red-100 text-red-700 border-red-200" },
    { value: "editeur", label: "Éditeur", desc: "Peut modifier les données du projet", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: "lecteur", label: "Lecteur", desc: "Accès en lecture seule", color: "bg-green-100 text-green-700 border-green-200" },
] as const;

const emptyManager = (): ProjectManager => ({ nomComplet: "", contact: "", role: "", niveauAcces: "editeur" });

export default function ProjectManagerSection({ manager, onSave }: Props) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProjectManager>(manager ?? emptyManager());
    const [showDelete, setShowDelete] = useState(false);

    const startEdit = () => { setForm(manager ?? emptyManager()); setEditing(true); };
    const cancel = () => { setEditing(false); setShowDelete(false); };
    const save = () => { if (!form.nomComplet.trim()) return; onSave(form); setEditing(false); };
    const confirmDelete = () => { onSave(null); setShowDelete(false); setEditing(false); };

    const accessLevel = ACCESS_LEVELS.find((a) => a.value === (manager?.niveauAcces ?? "editeur"));

    return (
        <div className="mt-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-purple-300" />
                <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Section 3 — Responsable du projet</span>
                <div className="h-px flex-1 bg-purple-300" />
            </div>

            {!editing ? (
                manager ? (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <UserCircle2 size={26} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-black text-base truncate">{manager.nomComplet}</p>
                                <p className="text-white/70 text-xs font-bold truncate">{manager.role}</p>
                            </div>
                            <button onClick={startEdit} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors" aria-label="Modifier responsable">
                                <Pencil size={16} className="text-white" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><Phone size={15} className="text-purple-600" /></div>
                                <div><p className="text-[11px] font-black text-purple-500 uppercase tracking-wider">Contact</p><p className="text-sm font-bold text-slate-800">{manager.contact || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><Briefcase size={15} className="text-purple-600" /></div>
                                <div><p className="text-[11px] font-black text-purple-500 uppercase tracking-wider">Rôle</p><p className="text-sm font-bold text-slate-800">{manager.role || "—"}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><ShieldCheck size={15} className="text-purple-600" /></div>
                                <div>
                                    <p className="text-[11px] font-black text-purple-500 uppercase tracking-wider">Niveau d&apos;accès</p>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${accessLevel?.color || "bg-slate-100 text-slate-600 border-slate-200"}`}>{accessLevel?.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={startEdit} className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform">
                        <Plus size={18} /> Ajouter le responsable du projet
                    </button>
                )
            ) : (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 space-y-4">
                    <p className="text-sm font-black text-purple-700 flex items-center gap-2"><UserCircle2 size={16} />{manager ? "Modifier le responsable" : "Nouveau responsable"}</p>

                    {/* Nom complet */}
                    <div>
                        <label className="text-[12px] font-black text-purple-600 uppercase tracking-wider mb-1 block">Nom complet *</label>
                        <input type="text" value={form.nomComplet} onChange={(e) => setForm({ ...form, nomComplet: e.target.value })} placeholder="Ex: Moussa Traoré" inputMode="text" autoFocus
                            className="w-full p-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-sm font-semibold text-slate-900 outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="text-[12px] font-black text-purple-600 uppercase tracking-wider mb-1 block">Contact (tél / email)</label>
                        <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Ex: +223 70 00 00 00" inputMode="text"
                            className="w-full p-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-sm font-semibold text-slate-900 outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    {/* Rôle */}
                    <div>
                        <label className="text-[12px] font-black text-purple-600 uppercase tracking-wider mb-1 block">Rôle dans le projet</label>
                        <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Chef de projet, Directeur..." inputMode="text"
                            className="w-full p-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-sm font-semibold text-slate-900 outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    {/* Niveau d'accès */}
                    <div>
                        <label className="text-[12px] font-black text-purple-600 uppercase tracking-wider mb-2 block">Niveau d&apos;accès dans l&apos;application</label>
                        <div className="space-y-2">
                            {ACCESS_LEVELS.map((lvl) => (
                                <button key={lvl.value} onClick={() => setForm({ ...form, niveauAcces: lvl.value })}
                                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${form.niveauAcces === lvl.value ? lvl.color + " border-current" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    <ShieldCheck size={16} />
                                    <div>
                                        <p className="text-sm font-black">{lvl.label}</p>
                                        <p className="text-[11px] font-semibold opacity-70">{lvl.desc}</p>
                                    </div>
                                    {form.niveauAcces === lvl.value && <Check size={16} className="ml-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-2">
                        <button onClick={save} disabled={!form.nomComplet.trim()} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${form.nomComplet.trim() ? "bg-purple-600 text-white active:scale-95 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                            <Check size={15} /> Enregistrer
                        </button>
                        <button onClick={cancel} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                            <X size={15} /> Annuler
                        </button>
                    </div>

                    {manager && !showDelete && (
                        <button onClick={() => setShowDelete(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-red-200 text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} /> Supprimer le responsable
                        </button>
                    )}
                    {showDelete && (
                        <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200">
                            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-500" /><span className="text-sm font-black text-red-700">Confirmer la suppression ?</span></div>
                            <div className="flex gap-2">
                                <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Trash2 size={13} /> Supprimer</button>
                                <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"><X size={13} /> Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
