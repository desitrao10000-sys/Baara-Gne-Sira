"use client";

import { useState } from "react";
import {
    ArrowLeft, Pencil, Check, X, FolderKanban, Building2, MapPin, Globe2,
    Calendar, Clock, FileText, Target, Sparkles, Trash2, Save, AlertTriangle,
    Calculator, Landmark, Percent, TrendingUp, CreditCard, PiggyBank,
    CircleDollarSign, FileSpreadsheet, BarChart3, Receipt,
} from "lucide-react";
import { ProjectInfo } from "./ProjectCreationWizard";
import { BusinessPlanData } from "./BusinessPlanWizard";

interface ProjectDetailViewProps {
    project: { id: string; info: ProjectInfo; createdAt: string; businessPlan?: string | null };
    onBack: () => void;
    onSave: (updatedInfo: ProjectInfo) => void;
    onDelete: (projectId: string) => void;
    onStartBusinessPlan: () => void;
    onSaveBusinessPlan: (bpData: BusinessPlanData) => void;
    onDeleteBusinessPlan: () => void;
}

const fieldConfig: { id: keyof ProjectInfo; label: string; icon: React.ReactNode; type: "text" | "date" | "textarea" }[] = [
    { id: "name", label: "Nom du projet", icon: <Sparkles size={18} className="text-primary-yellow" />, type: "text" },
    { id: "sector", label: "Secteur d'activité", icon: <Building2 size={18} className="text-primary-yellow" />, type: "text" },
    { id: "location", label: "Localisation", icon: <MapPin size={18} className="text-primary-yellow" />, type: "text" },
    { id: "zone", label: "Zone d'intervention", icon: <Globe2 size={18} className="text-primary-yellow" />, type: "text" },
    { id: "startDate", label: "Date de démarrage", icon: <Calendar size={18} className="text-primary-yellow" />, type: "date" },
    { id: "duration", label: "Durée prévue", icon: <Clock size={18} className="text-primary-yellow" />, type: "text" },
    { id: "description", label: "Description", icon: <FileText size={18} className="text-primary-yellow" />, type: "textarea" },
    { id: "objectives", label: "Objectifs", icon: <Target size={18} className="text-primary-yellow" />, type: "textarea" },
];

export default function ProjectDetailView({ project, onBack, onSave, onDelete, onStartBusinessPlan, onSaveBusinessPlan, onDeleteBusinessPlan }: ProjectDetailViewProps) {
    const [info, setInfo] = useState<ProjectInfo>({ ...project.info });
    const [editingField, setEditingField] = useState<keyof ProjectInfo | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteBpConfirm, setShowDeleteBpConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [bpData, setBpData] = useState<BusinessPlanData | null>(project.businessPlan ? JSON.parse(project.businessPlan) : null);
    const [editingBpField, setEditingBpField] = useState<string | null>(null);
    const [editBpValue, setEditBpValue] = useState("");
    const [editingCaIndex, setEditingCaIndex] = useState<number | null>(null);
    const [editCaValue, setEditCaValue] = useState("");

    const startCaEdit = (i: number, v: number) => { setEditingCaIndex(i); setEditCaValue(String(v)); };
    const confirmCaEdit = () => {
        if (editingCaIndex !== null && bpData) {
            const arr: number[] = bpData.caAnnees ? JSON.parse(bpData.caAnnees) : [];
            arr[editingCaIndex] = parseFloat(editCaValue) || 0;
            const u = { ...bpData, caAnnees: JSON.stringify(arr) }; setBpData(u); onSaveBusinessPlan(u); setHasChanges(true);
        }
        setEditingCaIndex(null); setEditCaValue("");
    };
    const cancelCaEdit = () => { setEditingCaIndex(null); setEditCaValue(""); };
    const startEdit = (f: keyof ProjectInfo) => { setEditingField(f); setEditValue(info[f]); };
    const cancelEdit = () => { setEditingField(null); setEditValue(""); };
    const confirmEdit = () => {
        if (editValue.trim()) { const u = { ...info, [editingField!]: editValue }; setInfo(u); onSave(u); setHasChanges(true); }
        setEditingField(null); setEditValue("");
    };
    const startBpEdit = (k: string, v: string) => { setEditingBpField(k); setEditBpValue(v || ""); };
    const confirmBpEdit = () => {
        if (editingBpField && bpData) { const u = { ...bpData, [editingBpField]: editBpValue }; setBpData(u); onSaveBusinessPlan(u); setHasChanges(true); }
        setEditingBpField(null); setEditBpValue("");
    };
    const cancelBpEdit = () => { setEditingBpField(null); setEditBpValue(""); };
    const handleDelete = () => { onDelete(project.id); };
    const formatDate = (d: string) => { if (!d) return "Non renseigné"; try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; } };
    const formatCreatedAt = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">{info.name}</h1>
                        <p className="text-white/60 text-xs font-bold">Section 1 — Informations générales</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"><FolderKanban size={22} className="text-primary-yellow" /></div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-5" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-200">📅 Créé le {formatCreatedAt(project.createdAt)}</span>
                    {hasChanges && <span className="text-[13px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1"><Save size={12} /> Modifié</span>}
                </div>

                <div className="bg-gradient-to-br from-vibrant-blue to-blue-700 rounded-2xl p-4 mb-5 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles size={20} className="text-primary-yellow" /></div>
                        <div className="flex-1 min-w-0"><h3 className="font-black text-lg truncate">{info.name}</h3><p className="text-white/90 text-sm font-bold">{info.sector}</p></div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white font-bold">
                        {info.location && <span className="flex items-center gap-1"><MapPin size={13} /> {info.location}</span>}
                        {info.duration && <span className="flex items-center gap-1"><Clock size={13} /> {info.duration}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-yellow-400" /><span className="text-[13px] font-black text-yellow-600 uppercase tracking-widest">Détails du projet</span><div className="h-px flex-1 bg-yellow-400" />
                </div>

                <div className="space-y-3">
                    {fieldConfig.map((field, index) => {
                        const isEditing = editingField === field.id;
                        const displayValue = field.id === "startDate" ? formatDate(info[field.id]) : info[field.id] || "Non renseigné";
                        return (
                            <div key={field.id} className="bg-white rounded-2xl p-4 shadow-md border border-slate-200 hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center">{field.icon}</div>
                                        <span className="text-[13px] font-black text-yellow-600 uppercase tracking-wider">{field.label}</span>
                                    </div>
                                    {!isEditing && <button onClick={() => startEdit(field.id)} className="p-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors" aria-label={`Modifier ${field.label}`}><Pencil size={13} className="text-primary-yellow" /></button>}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        {field.type === "textarea" ? (
                                            <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder={`Tape ton ${field.label.toLowerCase()}...`} rows={3} className="w-full p-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-sm font-semibold text-slate-900 outline-none resize-none" autoFocus />
                                        ) : field.type === "date" ? (
                                            <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} title={field.label} className="w-full p-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-sm font-semibold text-slate-900 outline-none" />
                                        ) : (
                                            <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder={`Tape ton ${field.label.toLowerCase()}...`} className="w-full p-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-sm font-semibold text-slate-900 outline-none" autoFocus />
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={confirmEdit} disabled={!editValue.trim()} className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${editValue.trim() ? "bg-green-500 text-white active:scale-95 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><Check size={14} /> Valider</button>
                                            <button onClick={cancelEdit} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><X size={14} /> Annuler</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-[15px] font-bold leading-relaxed pl-9 ${info[field.id] ? "text-slate-900" : "text-slate-400 italic"}`}>{displayValue}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Section 2 — Plan d'affaires */}
                <div className="mt-6 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-yellow-400" /><span className="text-xs font-black text-yellow-600 uppercase tracking-widest">Section 2 — Plan d'affaires chiffré</span><div className="h-px flex-1 bg-yellow-400" />
                    </div>
                    {bpData ? (() => {
                        const bp = bpData;
                        const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
                        const numFromPart = (s: string): number => { const a = s.includes(":") ? s.split(":").pop()! : s; const c = a.trim().replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "."); const m = c.match(/\d+\.?\d*/); return m ? (parseFloat(m[0]) || 0) : 0; };
                        const num = (v: string | undefined | null): number => { if (!v) return 0; return String(v).split("/").reduce((t, p) => t + numFromPart(p), 0); };
                        const nIM = num(bp.investissementMateriel), nII = num(bp.investissementImateriel), nFDR = num(bp.fondsDeRoulement), nFP = num(bp.fondsPropres), nE = num(bp.emprunt);
                        const nTSR = num(bp.tauxSansRisque), nPS = num(bp.primeSectorielle), nPP = num(bp.primePays), nIS = num(bp.tauxIS), nDA = num(bp.dureeAmortissement);
                        const nCV = num(bp.chargesVariables), nCF = num(bp.chargesFixes), nCFi = num(bp.chargesFinancieres), nInt = num(bp.tauxInteret);
                        const investTotal = nIM + nII + nFDR, finTotal = nFP + nE, tauxActu = nTSR + nPS + nPP, amortAnnuel = investTotal / (nDA || 5);
                        const caAnnees: number[] = bp.caAnnees ? JSON.parse(bp.caAnnees) : [];
                        const txVar = nCV / 100, txFixe = nCF, txFi = nCFi, txIS2 = nIS / 100, txActu = tauxActu / 100;
                        let cumulFNT = 0, delaiRecup = -1;
                        const yearlyResults = caAnnees.map((ca: number, i: number) => {
                            const cv = ca * txVar, mb = ca - cv, bai = mb - txFixe - txFi - amortAnnuel, imp = bai > 0 ? bai * txIS2 : 0;
                            const bn = bai - imp, fnt = bn + amortAnnuel, fntA = fnt / Math.pow(1 + txActu, i + 1);
                            cumulFNT += fntA; if (delaiRecup === -1 && cumulFNT >= investTotal) delaiRecup = i + 1;
                            return { annee: i + 1, ca, margeBrute: mb, bai, impot: imp, benefNet: bn, fnt, fntActu: fntA, cumulFNT };
                        });
                        const van = cumulFNT - investTotal, benefTotal = yearlyResults.reduce((s: number, r: { benefNet: number }) => s + r.benefNet, 0);
                        const roi = investTotal > 0 ? (benefTotal / investTotal * 100) : 0, ip = investTotal > 0 ? cumulFNT / investTotal : 0;
                        let tri = 0;
                        for (let t = 1; t <= 100; t += 0.5) { let npv = -investTotal; caAnnees.forEach((ca: number, i: number) => { const cv2 = ca * txVar, bai2 = ca - cv2 - txFixe - txFi - amortAnnuel, imp2 = bai2 > 0 ? bai2 * txIS2 : 0; npv += ((bai2 - imp2) + amortAnnuel) / Math.pow(1 + t / 100, i + 1); }); if (npv < 0) { tri = t; break; } }

                        const bpFields: { label: string; icon: React.ReactNode; key: keyof BusinessPlanData; value: string; montant: number; suffix?: string }[] = [
                            { label: "Investissement matériel", icon: <Calculator size={16} className="text-primary-yellow" />, key: "investissementMateriel", value: bp.investissementMateriel, montant: nIM },
                            { label: "Investissement immatériel", icon: <FileSpreadsheet size={16} className="text-primary-yellow" />, key: "investissementImateriel", value: bp.investissementImateriel, montant: nII },
                            { label: "Fonds de roulement", icon: <PiggyBank size={16} className="text-primary-yellow" />, key: "fondsDeRoulement", value: bp.fondsDeRoulement, montant: nFDR },
                            { label: "Fonds propres", icon: <CircleDollarSign size={16} className="text-primary-yellow" />, key: "fondsPropres", value: bp.fondsPropres, montant: nFP },
                            { label: "Emprunt bancaire", icon: <Landmark size={16} className="text-primary-yellow" />, key: "emprunt", value: bp.emprunt, montant: nE },
                            { label: "Taux d'intérêt", icon: <Percent size={16} className="text-primary-yellow" />, key: "tauxInteret", value: bp.tauxInteret, montant: nInt, suffix: "%" },
                            { label: "Taux sans risque", icon: <TrendingUp size={16} className="text-primary-yellow" />, key: "tauxSansRisque", value: bp.tauxSansRisque, montant: nTSR, suffix: "%" },
                            { label: "Prime sectorielle", icon: <BarChart3 size={16} className="text-primary-yellow" />, key: "primeSectorielle", value: bp.primeSectorielle, montant: nPS, suffix: "%" },
                            { label: "Prime pays", icon: <CreditCard size={16} className="text-primary-yellow" />, key: "primePays", value: bp.primePays, montant: nPP, suffix: "%" },
                            { label: "Impôt (IS)", icon: <Receipt size={16} className="text-primary-yellow" />, key: "tauxIS", value: bp.tauxIS, montant: nIS, suffix: "%" },
                            { label: "Durée amortissement", icon: <Calculator size={16} className="text-primary-yellow" />, key: "dureeAmortissement", value: bp.dureeAmortissement, montant: nDA, suffix: " ans" },
                            { label: "Charges variables", icon: <TrendingUp size={16} className="text-primary-yellow" />, key: "chargesVariables", value: bp.chargesVariables, montant: nCV, suffix: " % du CA" },
                            { label: "Charges fixes annuelles", icon: <CreditCard size={16} className="text-primary-yellow" />, key: "chargesFixes", value: bp.chargesFixes, montant: nCF },
                            { label: "Charges financières", icon: <Landmark size={16} className="text-primary-yellow" />, key: "chargesFinancieres", value: bp.chargesFinancieres, montant: nCFi },
                        ];
                        const displayFieldVal = (f: { montant: number; suffix?: string; value: string }) => { if (f.suffix) return `${f.montant}${f.suffix}`; if (f.montant > 0) return `${fmt(f.montant)} FCFA`; return f.value || "—"; };

                        return (
                            <div className="space-y-3">
                                <div className="bg-gradient-to-br from-vibrant-blue to-blue-700 rounded-2xl p-4 shadow-lg shadow-blue-500/20 text-white">
                                    <div className="flex items-center gap-2 mb-3"><Calculator size={18} className="text-primary-yellow" /><span className="text-[17px] font-black uppercase tracking-wider text-white/80">Résumé financier</span></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">Invest. total</p><p className="text-[21px] font-black">{investTotal > 0 ? fmt(investTotal) : "—"}</p><p className="text-[14px] text-white/50">FCFA</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">Financement</p><p className="text-[21px] font-black">{finTotal > 0 ? fmt(finTotal) : "—"}</p><p className="text-[14px] text-white/50">FCFA</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">Taux actualisation</p><p className="text-[21px] font-black text-primary-yellow">{tauxActu > 0 ? `${tauxActu.toFixed(1)}%` : "—"}</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">Amort. annuel</p><p className="text-[21px] font-black">{amortAnnuel > 0 ? fmt(amortAnnuel) : "—"}</p><p className="text-[14px] text-white/50">FCFA</p></div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-4 shadow-lg shadow-slate-500/20 text-white">
                                    <div className="flex items-center gap-2 mb-3"><BarChart3 size={18} className="text-primary-yellow" /><span className="text-[17px] font-black uppercase tracking-wider text-white/80">Indicateurs clés</span></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">VAN</p><p className={`text-[21px] font-black ${van >= 0 ? "text-green-200" : "text-red-200"}`}>{van >= 0 ? "+" : ""}{fmt(van)}</p><p className="text-[14px] text-white/50">{van >= 0 ? "✅ Rentable" : "⚠️ Non rentable"}</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">TRI</p><p className="text-[21px] font-black text-primary-yellow">{tri.toFixed(1)}%</p><p className="text-[14px] text-white/50">Taux rentabilité</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">ROI</p><p className="text-[21px] font-black">{roi.toFixed(1)}%</p><p className="text-[14px] text-white/50">Retour invest.</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center"><p className="text-[15px] text-white/60 font-bold">IP</p><p className="text-[21px] font-black">{ip.toFixed(2)}</p><p className="text-[14px] text-white/50">{ip >= 1 ? "✅ IP≥1" : "⚠️ IP<1"}</p></div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center col-span-2"><p className="text-[15px] text-white/60 font-bold">⏱ Délai récupération</p><p className="text-[21px] font-black">{delaiRecup > 0 ? `${delaiRecup} an(s)` : "Non atteint"}</p></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2"><div className="h-px flex-1 bg-yellow-400" /><span className="text-[13px] font-black text-yellow-600 uppercase tracking-widest">Données saisies</span><div className="h-px flex-1 bg-yellow-400" /></div>
                                {bpFields.map((field) => {
                                    const isEditingBp = editingBpField === field.key;
                                    return (
                                        <div key={field.key} className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center">{field.icon}</div><span className="text-[13px] font-black text-yellow-600 uppercase tracking-wider">{field.label}</span></div>
                                                {!isEditingBp && <button onClick={() => startBpEdit(field.key, field.value)} className="p-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors" aria-label={`Modifier ${field.label}`}><Pencil size={13} className="text-primary-yellow" /></button>}
                                            </div>
                                            {isEditingBp ? (
                                                <div className="space-y-2 pl-8">
                                                    <input type="text" value={editBpValue} onChange={(e) => setEditBpValue(e.target.value)} placeholder={`Modifier ${field.label.toLowerCase()}...`} className="w-full p-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 text-sm font-semibold text-slate-900 outline-none" autoFocus />
                                                    <div className="flex gap-2">
                                                        <button onClick={confirmBpEdit} disabled={!editBpValue.trim()} className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${editBpValue.trim() ? "bg-green-500 text-white active:scale-95 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><Check size={14} /> Valider</button>
                                                        <button onClick={cancelBpEdit} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><X size={14} /> Annuler</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pl-8 flex items-center justify-between"><p className="text-[13px] text-slate-600 font-semibold">{field.value || "—"}</p><p className="text-[17px] font-black text-blue-700">{displayFieldVal(field)}</p></div>
                                            )}
                                        </div>
                                    );
                                })}
                                {caAnnees.length > 0 && (
                                    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center"><TrendingUp size={16} className="text-primary-yellow" /></div><span className="text-[13px] font-black text-yellow-600 uppercase tracking-wider">CA prévisionnel</span></div>
                                        <div className="space-y-2 pl-8">
                                            {caAnnees.map((val: number, i: number) => (
                                                <div key={i} className="flex items-center justify-between gap-2">
                                                    <span className="text-[13px] font-black text-white bg-blue-700 rounded-full w-7 h-7 flex items-center justify-center shrink-0">A{i + 1}</span>
                                                    {editingCaIndex === i ? (
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <input type="text" value={editCaValue} onChange={(e) => setEditCaValue(e.target.value)} placeholder="Nouveau CA..." title={`CA Année ${i + 1}`} className="flex-1 p-2 rounded-lg border-2 border-yellow-400 bg-yellow-50 text-sm font-semibold text-slate-900 outline-none" autoFocus />
                                                            <button onClick={confirmCaEdit} disabled={!editCaValue.trim()} title="Valider" className={`p-1.5 rounded-lg ${editCaValue.trim() ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}><Check size={14} /></button>
                                                            <button onClick={cancelCaEdit} title="Annuler" className="p-1.5 rounded-lg bg-slate-200 text-slate-700"><X size={14} /></button>
                                                        </div>
                                                    ) : (<><span className="text-[17px] font-bold text-slate-900">{fmt(val)} FCFA</span><button onClick={() => startCaEdit(i, val)} className="p-1 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors shrink-0" aria-label={`Modifier CA Année ${i + 1}`}><Pencil size={12} className="text-primary-yellow" /></button></>)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {yearlyResults.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-yellow-400" /><span className="text-[13px] font-black text-yellow-600 uppercase tracking-widest">Détail par année</span><div className="h-px flex-1 bg-yellow-400" /></div>
                                        {yearlyResults.map((r: { annee: number; ca: number; margeBrute: number; bai: number; impot: number; benefNet: number; fntActu: number }) => (
                                            <div key={r.annee} className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
                                                <div className="flex items-center justify-between mb-3"><span className="text-[13px] font-black text-white bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center">A{r.annee}</span><span className="text-[17px] font-bold text-slate-900">CA : {fmt(r.ca)} FCFA</span></div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between"><span className="text-[13px] text-yellow-600 font-semibold">Marge brute</span><b className="text-[14px] text-slate-900">{fmt(r.margeBrute)} FCFA</b></div>
                                                    <div className="flex justify-between"><span className="text-[13px] text-yellow-600 font-semibold">Bénéfice Avant Impôt</span><b className="text-[14px] text-slate-900">{fmt(r.bai)} FCFA</b></div>
                                                    <div className="flex justify-between"><span className="text-[13px] text-yellow-600 font-semibold">Impôt</span><b className="text-[14px] text-red-600">{fmt(r.impot)} FCFA</b></div>
                                                    <div className="flex justify-between"><span className="text-[13px] text-yellow-600 font-semibold">Bénéfice net</span><b className={`text-[14px] ${r.benefNet >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(r.benefNet)} FCFA</b></div>
                                                    <div className="flex justify-between"><span className="text-[13px] text-yellow-600 font-semibold">Flux Net de Trésorerie Actualisé</span><b className="text-[14px] text-blue-700">{fmt(r.fntActu)} FCFA</b></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    })() : (
                        <button onClick={onStartBusinessPlan} className="w-full p-4 rounded-2xl bg-gradient-to-r from-vibrant-blue to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"><Sparkles size={18} />Commencer le Plan d'affaires chiffré</button>
                    )}
                </div>

                {bpData && (
                    <div className="mt-4 mb-4">
                        <div className="flex items-center gap-2 mb-3"><div className="h-px flex-1 bg-orange-200" /><span className="text-xs font-black text-orange-400 uppercase tracking-widest">Plan d'affaires</span><div className="h-px flex-1 bg-orange-200" /></div>
                        {!showDeleteBpConfirm ? (
                            <button onClick={() => setShowDeleteBpConfirm(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 text-orange-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-all"><Trash2 size={16} />Supprimer le plan d'affaires</button>
                        ) : (
                            <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200">
                                <div className="flex items-center gap-2 mb-3"><AlertTriangle size={20} className="text-orange-500" /><span className="text-sm font-black text-orange-700">Supprimer le plan d'affaires ?</span></div>
                                <p className="text-xs text-orange-500 mb-4 font-semibold">Toutes les données financières seront supprimées. Les infos du projet seront conservées.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => { setBpData(null); onDeleteBusinessPlan(); setShowDeleteBpConfirm(false); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md shadow-orange-500/30"><Trash2 size={14} /> Oui, supprimer</button>
                                    <button onClick={() => setShowDeleteBpConfirm(false)} className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-slate-200"><X size={14} /> Annuler</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 mb-4">
                    <div className="flex items-center gap-2 mb-3"><div className="h-px flex-1 bg-red-200" /><span className="text-xs font-black text-red-400 uppercase tracking-widest">Zone danger</span><div className="h-px flex-1 bg-red-200" /></div>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all"><Trash2 size={16} />Supprimer ce projet</button>
                    ) : (
                        <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={20} className="text-red-500" /><span className="text-sm font-black text-red-700">Confirmer la suppression ?</span></div>
                            <p className="text-xs text-red-500 mb-4 font-semibold">Cette action est irréversible. Toutes les données du projet seront perdues.</p>
                            <div className="flex gap-2">
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md shadow-red-500/30"><Trash2 size={14} /> Oui, supprimer</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-slate-200"><X size={14} /> Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}