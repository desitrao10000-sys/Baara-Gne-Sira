"use client";
import { useState } from "react";
import { UserCircle2, Phone, Briefcase, ShieldCheck, Pencil, Check, X, Plus, Trash2, AlertTriangle, Users, Handshake, ChevronDown, ChevronUp, Zap, AlertCircle, TrendingUp, ShieldAlert } from "lucide-react";
import { ProjectManager, ProjectMember } from "@/lib/useSupabaseProjects";

interface Props {
    manager: ProjectManager | null | undefined;
    onSave: (manager: ProjectManager | null) => void;
}

const ACCESS_LEVELS = [
    { value: "administrateur", label: "Administrateur", desc: "Accès complet", color: "bg-red-100 text-red-700 border-red-300" },
    { value: "editeur", label: "Éditeur", desc: "Peut modifier", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { value: "lecteur", label: "Lecteur", desc: "Lecture seule", color: "bg-green-100 text-green-700 border-green-300" },
] as const;

function emptyManager(): ProjectManager { return { nomComplet: "", contact: "", role: "", niveauAcces: "editeur", membres: [], partenaires: [] }; }
function emptyMember(): ProjectMember { return { id: crypto.randomUUID(), nom: "", prenom: "", contact: "", role: "" }; }

function MemberForm({ title, icon, members, onChange, accent, showSwot = false }: { title: string; icon: React.ReactNode; members: ProjectMember[]; onChange: (m: ProjectMember[]) => void; accent: string; showSwot?: boolean }) {
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState<ProjectMember>(emptyMember());
    const [editId, setEditId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);

    const saveForm = () => {
        if (!form.nom.trim() && !form.prenom.trim()) return;
        if (editId) { onChange(members.map((m) => m.id === editId ? form : m)); setEditId(null); }
        else { onChange([...members, form]); }
        setForm(emptyMember()); setShowAdd(false);
    };
    const startEdit = (m: ProjectMember) => { setForm({ ...m }); setEditId(m.id); setShowAdd(true); };
    const remove = (id: string) => onChange(members.filter((m) => m.id !== id));
    const cancel = () => { setShowAdd(false); setForm(emptyMember()); setEditId(null); };

    return (
        <div className="rounded-2xl border-2 border-slate-100 overflow-hidden bg-white">
            <button onClick={() => setExpanded(!expanded)} className={`w-full flex items-center gap-2 px-4 py-3 ${accent} text-left`}>
                {icon}
                <span className="font-black text-sm flex-1">{title} {members.length > 0 && <span className="font-bold opacity-70">({members.length})</span>}</span>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded && (
                <div className="p-3 space-y-2">
                    {members.map((m) => (
                        <div key={m.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900">{m.prenom} {m.nom}</p>
                                    {m.role && <p className="text-xs text-slate-500 font-semibold">{m.role}</p>}
                                    {m.contact && <p className="text-xs text-slate-400 font-semibold">{m.contact}</p>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => startEdit(m)} title="Modifier" className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"><Pencil size={12} className="text-purple-600" /></button>
                                    <button onClick={() => remove(m.id)} title="Supprimer" className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"><Trash2 size={12} className="text-red-500" /></button>
                                </div>
                            </div>
                            {/* Affichage SWOT résumé pour les partenaires */}
                            {showSwot && (m.force || m.faiblesse || m.opportunite || m.menace) && (
                                <div className="mt-2 grid grid-cols-2 gap-1.5">
                                    {m.force && <div className="bg-green-50 rounded-lg px-2 py-1 border border-green-200"><p className="text-[9px] font-black text-green-700">💪 Force</p><p className="text-[10px] text-green-800 font-semibold line-clamp-2">{m.force}</p></div>}
                                    {m.faiblesse && <div className="bg-orange-50 rounded-lg px-2 py-1 border border-orange-200"><p className="text-[9px] font-black text-orange-700">😟 Faiblesse</p><p className="text-[10px] text-orange-800 font-semibold line-clamp-2">{m.faiblesse}</p></div>}
                                    {m.opportunite && <div className="bg-blue-50 rounded-lg px-2 py-1 border border-blue-200"><p className="text-[9px] font-black text-blue-700">🌟 Opportunité</p><p className="text-[10px] text-blue-800 font-semibold line-clamp-2">{m.opportunite}</p></div>}
                                    {m.menace && <div className="bg-red-50 rounded-lg px-2 py-1 border border-red-200"><p className="text-[9px] font-black text-red-700">⚠️ Menace</p><p className="text-[10px] text-red-800 font-semibold line-clamp-2">{m.menace}</p></div>}
                                </div>
                            )}
                        </div>
                    ))}
                    {members.length === 0 && !showAdd && <p className="text-xs text-slate-400 text-center py-2 italic">Aucun {title.toLowerCase()} ajouté</p>}
                    {showAdd ? (
                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[11px] font-black text-purple-600 uppercase mb-0.5 block">Nom *</label>
                                    <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Traoré" inputMode="text" className="w-full p-2 rounded-lg border border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" autoFocus />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-purple-600 uppercase mb-0.5 block">Prénom *</label>
                                    <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Moussa" inputMode="text" className="w-full p-2 rounded-lg border border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-purple-600 uppercase mb-0.5 block">Contact</label>
                                <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+223 70 00 00 00 / email" inputMode="text" className="w-full p-2 rounded-lg border border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-purple-600 uppercase mb-0.5 block">Rôle dans le projet</label>
                                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Technicien, Financeur..." inputMode="text" className="w-full p-2 rounded-lg border border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                            </div>
                            {/* Champs SWOT pour les partenaires */}
                            {showSwot && (
                                <div className="space-y-2 pt-1">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">📊 Analyse SWOT du partenaire</p>
                                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                                        <label className="text-[10px] font-black text-green-700 uppercase mb-0.5 flex items-center gap-1 block"><Zap size={10} /> 💪 Force</label>
                                        <p className="text-[9px] text-green-600 mb-1">Ce que le partenaire peut faire pour le projet aujourd'hui</p>
                                        <textarea value={form.force || ""} onChange={(e) => setForm({ ...form, force: e.target.value })} placeholder="Ex: Apporte un réseau de distributeurs, dispose d'un local..." rows={2} className="w-full p-2 rounded-lg border border-green-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-green-500 resize-none" />
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                                        <label className="text-[10px] font-black text-orange-700 uppercase mb-0.5 flex items-center gap-1 block"><AlertCircle size={10} /> 😟 Faiblesse</label>
                                        <p className="text-[9px] text-orange-600 mb-1">Malgré sa position, ce que le partenaire ne peut pas faire</p>
                                        <textarea value={form.faiblesse || ""} onChange={(e) => setForm({ ...form, faiblesse: e.target.value })} placeholder="Ex: Pas de capacité financière, manque de personnel qualifié..." rows={2} className="w-full p-2 rounded-lg border border-orange-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-orange-500 resize-none" />
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                        <label className="text-[10px] font-black text-blue-700 uppercase mb-0.5 flex items-center gap-1 block"><TrendingUp size={10} /> 🌟 Opportunité</label>
                                        <p className="text-[9px] text-blue-600 mb-1">Avec des efforts, ce que le partenaire pourra faire</p>
                                        <textarea value={form.opportunite || ""} onChange={(e) => setForm({ ...form, opportunite: e.target.value })} placeholder="Ex: Pourrait étendre la distribution à la sous-région s'il obtient des fonds..." rows={2} className="w-full p-2 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 resize-none" />
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                                        <label className="text-[10px] font-black text-red-700 uppercase mb-0.5 flex items-center gap-1 block"><ShieldAlert size={10} /> ⚠️ Menace</label>
                                        <p className="text-[9px] text-red-600 mb-1">Si on n'y prend garde, ce qui pourrait nuire au projet</p>
                                        <textarea value={form.menace || ""} onChange={(e) => setForm({ ...form, menace: e.target.value })} placeholder="Ex: Peut devenir concurrent, instabilité de sa zone..." rows={2} className="w-full p-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-red-500 resize-none" />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button onClick={saveForm} disabled={!form.nom.trim() && !form.prenom.trim()} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${(form.nom.trim() || form.prenom.trim()) ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><Check size={13} /> {editId ? "Mettre à jour" : "Ajouter"}</button>
                                <button onClick={cancel} className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-slate-200"><X size={13} /> Annuler</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAdd(true)} className="w-full py-2 rounded-xl border-2 border-dashed border-purple-300 text-purple-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-purple-50 transition-colors">
                            <Plus size={13} /> Ajouter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProjectManagerSection({ manager, onSave }: Props) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProjectManager>(manager ?? emptyManager());
    const [showDelete, setShowDelete] = useState(false);

    const startEdit = () => { setForm(manager ? { membres: [], partenaires: [], ...manager } : emptyManager()); setEditing(true); };
    const cancel = () => { setEditing(false); setShowDelete(false); };
    const save = () => { if (!form.nomComplet.trim()) return; onSave(form); setEditing(false); };
    const confirmDelete = () => { onSave(null); setShowDelete(false); setEditing(false); };

    const access = ACCESS_LEVELS.find((a) => a.value === (manager?.niveauAcces ?? "editeur"));
    const allMembers = manager ? [...(manager.membres ?? []), ...(manager.partenaires ?? [])] : [];

    return (
        <div className="mb-4">
            {/* Titre section */}
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-400" />
                <span className="text-xs font-black text-purple-600 uppercase tracking-widest px-1">Section 1 — Équipe du projet</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-400" />
            </div>

            {!editing ? (
                manager ? (
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-purple-100">
                        {/* Header responsable */}
                        <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center">
                                    <UserCircle2 size={28} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-white/60 font-black uppercase tracking-widest">Responsable principal</p>
                                    <p className="text-white font-black text-lg leading-tight truncate">{manager.nomComplet}</p>
                                    <p className="text-white/70 text-xs font-bold truncate">{manager.role}</p>
                                </div>
                                <button onClick={startEdit} className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors border border-white/20" aria-label="Modifier">
                                    <Pencil size={15} className="text-white" />
                                </button>
                            </div>
                            {/* Infos rapides */}
                            <div className="flex gap-2 flex-wrap">
                                {manager.contact && (
                                    <div className="bg-white/15 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                        <Phone size={11} className="text-white/70" />
                                        <span className="text-white text-xs font-semibold">{manager.contact}</span>
                                    </div>
                                )}
                                <div className={`rounded-xl px-3 py-1.5 flex items-center gap-1.5 border ${access?.color ?? "bg-white/15 text-white border-white/20"}`}>
                                    <ShieldCheck size={11} />
                                    <span className="text-xs font-black">{access?.label}</span>
                                </div>
                                {allMembers.length > 0 && (
                                    <div className="bg-white/15 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                        <Users size={11} className="text-white/70" />
                                        <span className="text-white text-xs font-semibold">{allMembers.length} acteur(s)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Membres */}
                        {(manager.membres ?? []).length > 0 && (
                            <div className="bg-blue-50 p-4 border-t border-blue-100">
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={12} /> Membres de l&apos;équipe ({(manager.membres ?? []).length})</p>
                                <div className="space-y-2">
                                    {(manager.membres ?? []).map((m) => (
                                        <div key={m.id} className="bg-white rounded-xl p-2.5 border border-blue-200 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><UserCircle2 size={16} className="text-blue-600" /></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-900">{m.prenom} {m.nom}</p>
                                                <p className="text-[11px] text-slate-500 font-semibold truncate">{m.role || "—"}{m.contact ? " · " + m.contact : ""}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Partenaires */}
                        {(manager.partenaires ?? []).length > 0 && (
                            <div className="bg-emerald-50 p-4 border-t border-emerald-100">
                                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Handshake size={12} /> Partenaires ({(manager.partenaires ?? []).length})</p>
                                <div className="space-y-2">
                                    {(manager.partenaires ?? []).map((p) => (
                                        <div key={p.id} className="bg-white rounded-xl p-2.5 border border-emerald-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Handshake size={16} className="text-emerald-600" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-slate-900">{p.prenom} {p.nom}</p>
                                                    <p className="text-[11px] text-slate-500 font-semibold truncate">{p.role || "—"}{p.contact ? " · " + p.contact : ""}</p>
                                                </div>
                                            </div>
                                            {/* SWOT du partenaire */}
                                            {(p.force || p.faiblesse || p.opportunite || p.menace) && (
                                                <div className="mt-2 grid grid-cols-2 gap-1.5">
                                                    {p.force && <div className="bg-green-50 rounded-lg px-2 py-1 border border-green-200"><p className="text-[9px] font-black text-green-700">💪 Force</p><p className="text-[10px] text-green-800 font-semibold line-clamp-2">{p.force}</p></div>}
                                                    {p.faiblesse && <div className="bg-orange-50 rounded-lg px-2 py-1 border border-orange-200"><p className="text-[9px] font-black text-orange-700">😟 Faiblesse</p><p className="text-[10px] text-orange-800 font-semibold line-clamp-2">{p.faiblesse}</p></div>}
                                                    {p.opportunite && <div className="bg-blue-50 rounded-lg px-2 py-1 border border-blue-200"><p className="text-[9px] font-black text-blue-700">🌟 Opportunité</p><p className="text-[10px] text-blue-800 font-semibold line-clamp-2">{p.opportunite}</p></div>}
                                                    {p.menace && <div className="bg-red-50 rounded-lg px-2 py-1 border border-red-200"><p className="text-[9px] font-black text-red-700">⚠️ Menace</p><p className="text-[10px] text-red-800 font-semibold line-clamp-2">{p.menace}</p></div>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={startEdit} className="w-full p-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 transition-transform">
                        <Plus size={18} /> Ajouter le responsable &amp; l&apos;équipe du projet
                    </button>
                )
            ) : (
                <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-4 space-y-4">
                    <p className="text-sm font-black text-purple-700 flex items-center gap-2"><UserCircle2 size={16} /> {manager ? "Modifier l'équipe" : "Configurer l'équipe"}</p>

                    {/* Responsable */}
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 space-y-3">
                        <p className="text-[11px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5"><UserCircle2 size={13} /> Responsable principal</p>
                        <div>
                            <label className="text-[11px] font-black text-purple-600 uppercase mb-1 block">Nom complet *</label>
                            <input type="text" value={form.nomComplet} onChange={(e) => setForm({ ...form, nomComplet: e.target.value })} placeholder="Ex: Moussa Traoré" inputMode="text" autoFocus className="w-full p-3 rounded-xl border-2 border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-purple-600 uppercase mb-1 block">Contact (tél / email)</label>
                            <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+223 70 00 00 00" inputMode="text" className="w-full p-3 rounded-xl border-2 border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-purple-600 uppercase mb-1 block">Rôle dans le projet</label>
                            <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Chef de projet, Directeur..." inputMode="text" className="w-full p-3 rounded-xl border-2 border-purple-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-purple-600 uppercase mb-2 block">Niveau d&apos;accès</label>
                            <div className="flex gap-2">
                                {ACCESS_LEVELS.map((lvl) => (
                                    <button key={lvl.value} onClick={() => setForm({ ...form, niveauAcces: lvl.value })} className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-0.5 ${form.niveauAcces === lvl.value ? lvl.color : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                        <ShieldCheck size={14} />
                                        {lvl.label}
                                        {form.niveauAcces === lvl.value && <Check size={11} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Membres de l'équipe */}
                    <MemberForm
                        title="Membres de l'équipe"
                        icon={<Users size={15} className="text-blue-600" />}
                        members={form.membres ?? []}
                        onChange={(m) => setForm({ ...form, membres: m })}
                        accent="bg-blue-50 text-blue-700"
                    />

                    {/* Partenaires avec analyse SWOT */}
                    <MemberForm
                        title="Partenaires"
                        icon={<Handshake size={15} className="text-emerald-600" />}
                        members={form.partenaires ?? []}
                        onChange={(p) => setForm({ ...form, partenaires: p })}
                        accent="bg-emerald-50 text-emerald-700"
                        showSwot={true}
                    />

                    {/* Boutons */}
                    <div className="flex gap-2">
                        <button onClick={save} disabled={!form.nomComplet.trim()} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 ${form.nomComplet.trim() ? "bg-purple-600 text-white shadow-md active:scale-95 transition-transform" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><Check size={15} /> Enregistrer</button>
                        <button onClick={cancel} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><X size={15} /> Annuler</button>
                    </div>
                    {manager && !showDelete && (
                        <button onClick={() => setShowDelete(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-red-200 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"><Trash2 size={13} /> Supprimer le responsable</button>
                    )}
                    {showDelete && (
                        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                            <p className="text-xs font-black text-red-700 flex items-center gap-1.5 mb-2"><AlertTriangle size={13} /> Confirmer la suppression ?</p>
                            <div className="flex gap-2">
                                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
                                <button onClick={() => setShowDelete(false)} className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-slate-200"><X size={12} /> Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
