"use client";
import { useState } from "react";
import {
    ArrowLeft, FolderKanban, Building2, MapPin, Globe2,
    Calendar, Clock, FileText, Target, Sparkles, Trash2, AlertTriangle,
    Calculator, Landmark, Percent, TrendingUp, CreditCard, PiggyBank,
    CircleDollarSign, FileSpreadsheet, BarChart3, Receipt, ChevronDown, ChevronUp, Edit3, Plus,
} from "lucide-react";
import { ProjectInfo } from "./ProjectCreationWizard";
import { BusinessPlanData } from "./BusinessPlanWizard";
import { ProjectManager, ProjectTask } from "@/lib/useSupabaseProjects";
import ProjectManagerSection from "./ProjectManagerSection";
import ProjectTasksSection from "./ProjectTasksSection";

interface ProjectDetailViewProps {
    project: { id: string; info: ProjectInfo; createdAt: string; businessPlan?: string | null; manager?: ProjectManager | null; tasks?: ProjectTask[] };
    onBack: () => void;
    onSave: (updatedInfo: ProjectInfo) => void;
    onDelete: (projectId: string) => void;
    onStartBusinessPlan: () => void;
    onSaveBusinessPlan: (bpData: BusinessPlanData) => void;
    onDeleteBusinessPlan: () => void;
    onSaveManager: (manager: ProjectManager | null) => void;
    onSaveTasks: (tasks: ProjectTask[]) => void;
}

const SECTOR_LABELS: Record<string, string> = {
    commerce: "🛒 Commerce", agriculture: "🌾 Agriculture", service: "💼 Service",
    industrie: "🏭 Industrie", elevage: "🐄 Élevage", artisanat: "🪵 Artisanat",
    transport: "🚚 Transport", technologie: "💻 Technologie", sante: "🏥 Santé",
    education: "📚 Éducation", restauration: "🍽️ Restauration", batiment: "🏗️ Bâtiment"
};
const DURATION_LABELS: Record<string, string> = {
    "3-mois": "3 mois", "6-mois": "6 mois", "1-an": "1 an",
    "2-ans": "2 ans", "3-ans": "3 ans", "5-ans": "5 ans", "10-ans": "10 ans"
};

function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; }
}
function fmtDateTime(iso: string) {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}
function fmt(v: number) { return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }); }

export default function ProjectDetailView({ project, onBack, onSave, onDelete, onStartBusinessPlan, onSaveBusinessPlan, onDeleteBusinessPlan, onSaveManager, onSaveTasks }: ProjectDetailViewProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteBpConfirm, setShowDeleteBpConfirm] = useState(false);
    const [bpData, setBpData] = useState<BusinessPlanData | null>(project.businessPlan ? JSON.parse(project.businessPlan) : null);
    const [bpExpanded, setBpExpanded] = useState(true);

    // BP editing
    const [editingBpField, setEditingBpField] = useState<string | null>(null);
    const [editBpValue, setEditBpValue] = useState("");
    const [editBpLineItems, setEditBpLineItems] = useState<Array<{ desig: string; montant: string }>>([]);
    const [editingCaIndex, setEditingCaIndex] = useState<number | null>(null);
    const [editCaValue, setEditCaValue] = useState("");

    const startCaEdit = (i: number, v: number) => { setEditingCaIndex(i); setEditCaValue(String(v)); };
    const confirmCaEdit = () => {
        if (editingCaIndex !== null && bpData) {
            const arr: number[] = bpData.caAnnees ? JSON.parse(bpData.caAnnees) : [];
            arr[editingCaIndex] = parseFloat(editCaValue) || 0;
            const u = { ...bpData, caAnnees: JSON.stringify(arr) }; setBpData(u); onSaveBusinessPlan(u);
        }
        setEditingCaIndex(null); setEditCaValue("");
    };
    const monetaryBpFieldIds = new Set(["investissementMateriel", "investissementImateriel", "fondsDeRoulement", "fondsPropres", "emprunt", "chargesFixes", "chargesFinancieres"]);
    const isMonBp = (id: string) => monetaryBpFieldIds.has(id);
    const getLI = (): Record<string, Array<{ desig: string; montant: string }>> => {
        if (!bpData?.lineItemsJson) return {};
        try { return JSON.parse(bpData.lineItemsJson); } catch { return {}; }
    };
    const startBpEdit = (k: string, v: string) => {
        setEditingBpField(k); setEditBpValue(v || "");
        if (isMonBp(k)) {
            const stored = getLI()[k];
            if (stored && stored.length > 0 && stored.some(it => it.desig || it.montant)) {
                setEditBpLineItems(stored.map(it => ({ ...it })));
            } else {
                setEditBpLineItems([{ desig: "", montant: v || "" }]);
            }
        } else { setEditBpLineItems([]); }
    };
    const confirmBpEdit = () => {
        if (editingBpField && bpData) {
            if (isMonBp(editingBpField) && editBpLineItems.length > 0) {
                const sum = editBpLineItems.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0);
                const nLI = { ...getLI(), [editingBpField]: editBpLineItems };
                const u = { ...bpData, [editingBpField]: sum > 0 ? sum.toString() : "", lineItemsJson: JSON.stringify(nLI) };
                setBpData(u); onSaveBusinessPlan(u);
            } else {
                const u = { ...bpData, [editingBpField]: editBpValue }; setBpData(u); onSaveBusinessPlan(u);
            }
        }
        setEditingBpField(null); setEditBpValue(""); setEditBpLineItems([]);
    };

    const { info } = project;
    const teamMembers = project.manager ? [project.manager.nomComplet, ...(project.manager.membres ?? []).map((m) => `${m.prenom} ${m.nom}`)] : [];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">{info.name}</h1>
                        <p className="text-white/60 text-xs font-bold">Fiche projet complète</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <FolderKanban size={22} className="text-primary-yellow" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                {/* Date création */}
                <div className="flex items-center justify-center mb-4">
                    <span className="text-[12px] font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">📅 Créé le {fmtDateTime(project.createdAt)}</span>
                </div>

                {/* ===================== SECTION 3 — ÉQUIPE EN PREMIER ===================== */}
                <ProjectManagerSection manager={project.manager} onSave={onSaveManager} />

                {/* ===================== SECTION 2 — DÉTAILS DU PROJET ===================== */}
                <div className="mt-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-400" />
                        <span className="text-xs font-black text-yellow-600 uppercase tracking-widest px-1">Section 2 — Détails du projet</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-400" />
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-yellow-100 mb-4">
                        {/* Barre titre = nom du projet uniquement */}
                        <div className="bg-gradient-to-br from-yellow-500 via-yellow-400 to-amber-500 px-5 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/30 border-2 border-white/40 flex items-center justify-center shrink-0">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <h2 className="text-white font-black text-lg leading-tight flex-1 truncate">{info.name}</h2>
                        </div>
                        {/* Toutes les informations en dessous */}
                        <div className="bg-white divide-y divide-slate-100 text-justify">
                            {info.sector && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Building2 size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Secteur d&apos;activité</p><p className="text-sm font-bold text-slate-900">{SECTOR_LABELS[info.sector] || info.sector}</p></div>
                                </div>
                            )}
                            {info.location && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><MapPin size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Localisation</p><p className="text-sm font-bold text-slate-900">{info.location}</p></div>
                                </div>
                            )}
                            {info.zone && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Globe2 size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Zone d&apos;intervention</p><p className="text-sm font-bold text-slate-900">{info.zone}</p></div>
                                </div>
                            )}
                            {info.startDate && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Calendar size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Date de démarrage</p><p className="text-sm font-bold text-slate-900">{fmtDate(info.startDate)}</p></div>
                                </div>
                            )}
                            {info.duration && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0"><Clock size={15} className="text-yellow-600" /></div>
                                    <div><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider">Durée prévue</p><p className="text-sm font-bold text-slate-900">{DURATION_LABELS[info.duration] || info.duration}</p></div>
                                </div>
                            )}
                            {info.description && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5"><FileText size={15} className="text-yellow-600" /></div>
                                    <div className="flex-1"><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-1">Description</p><p className="text-sm font-semibold text-slate-800 leading-relaxed">{info.description}</p></div>
                                </div>
                            )}
                            {info.objectives && (
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5"><Target size={15} className="text-yellow-600" /></div>
                                    <div className="flex-1"><p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-1">Objectifs</p><p className="text-sm font-semibold text-slate-800 leading-relaxed">{info.objectives}</p></div>
                                </div>
                            )}
                            {/* Clients */}
                            {info.clientsJson && (() => {
                                try {
                                    const clients = JSON.parse(info.clientsJson);
                                    if (!Array.isArray(clients) || clients.length === 0) return null;
                                    return (
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-2">👥 Clients ({clients.length})</p>
                                            <div className="space-y-2">
                                                {clients.map((c: any, i: number) => (
                                                    <div key={c.id || i} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black text-white bg-teal-600 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                                                            <span className="text-xs font-black text-slate-900">{c.nom}</span>
                                                            {c.telephone && <span className="text-[10px] text-slate-500 ml-auto">📞 {c.telephone}</span>}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1 text-[10px] ml-7">
                                                            {c.typeClient && <div><span className="text-slate-400 font-bold">Type: </span><span className="text-slate-700 font-semibold">{c.typeClient}</span></div>}
                                                            {c.modePaiement && <div><span className="text-slate-400 font-bold">Paiement: </span><span className="text-slate-700 font-semibold">{c.modePaiement}</span></div>}
                                                            {c.montantMoyen && <div><span className="text-slate-400 font-bold">Montant moy.: </span><span className="text-slate-700 font-semibold">{c.montantMoyen}</span></div>}
                                                            {c.frequenceAchat && <div><span className="text-slate-400 font-bold">Fréquence: </span><span className="text-slate-700 font-semibold">{c.frequenceAchat}</span></div>}
                                                            {c.plafondAutorise && <div className="col-span-2"><span className="text-slate-400 font-bold">Plafond crédit: </span><span className="text-red-600 font-semibold">{c.plafondAutorise}</span></div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                } catch { return null; }
                            })()}
                        </div>
                    </div>
                </div>

                {/* ===================== SECTION 2 — PLAN D'AFFAIRES ===================== */}
                <div className="mt-2 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-400" />
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest px-1">Section 3 — Plan d&apos;affaires chiffré</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-400" />
                    </div>

                    {bpData ? (() => {
                        const bp = bpData;
                        const numFromPart = (s: string): number => { const a = s.includes(":") ? s.split(":").pop()! : s; const c = a.trim().replace(/\s/g, "").replace(/,/g, "."); const m = c.match(/\d+\.?\d*/); return m ? (parseFloat(m[0]) || 0) : 0; };
                        const num = (v: string | undefined | null): number => { if (!v) return 0; return String(v).split("/").reduce((t, p) => t + numFromPart(p), 0); };
                        const nIM = num(bp.investissementMateriel), nII = num(bp.investissementImateriel), nFDR = num(bp.fondsDeRoulement);
                        const nFP = num(bp.fondsPropres), nE = num(bp.emprunt), nTSR = num(bp.tauxSansRisque), nPS = num(bp.primeSectorielle), nPP = num(bp.primePays);
                        const nIS = num(bp.tauxIS), nDA = num(bp.dureeAmortissement), nCV = num(bp.chargesVariables), nCF = num(bp.chargesFixes), nCFi = num(bp.chargesFinancieres);
                        const investTotal = nIM + nII + nFDR, finTotal = nFP + nE, tauxActu = nTSR + nPS + nPP, amortAnnuel = investTotal / (nDA || 5);
                        const caAnnees: number[] = bp.caAnnees ? JSON.parse(bp.caAnnees) : [];
                        const txVar = nCV / 100, txIS2 = nIS / 100, txActu2 = tauxActu / 100;
                        let cumulFNT = 0, delaiRecup = -1;
                        const yearlyResults = caAnnees.map((ca: number, i: number) => {
                            const cv = ca * txVar, mb = ca - cv, bai = mb - nCF - nCFi - amortAnnuel, imp = bai > 0 ? bai * txIS2 : 0;
                            const bn = bai - imp, fnt = bn + amortAnnuel, fntA = fnt / Math.pow(1 + txActu2, i + 1);
                            cumulFNT += fntA; if (delaiRecup === -1 && cumulFNT >= investTotal) delaiRecup = i + 1;
                            return { annee: i + 1, ca, margeBrute: mb, bai, impot: imp, benefNet: bn, fntActu: fntA };
                        });
                        const van = cumulFNT - investTotal, benefTotal = yearlyResults.reduce((s, r) => s + r.benefNet, 0);
                        const roi = investTotal > 0 ? (benefTotal / investTotal * 100) : 0, ip = investTotal > 0 ? cumulFNT / investTotal : 0;
                        let tri = 0;
                        for (let t = 1; t <= 100; t += 0.5) { let npv = -investTotal; caAnnees.forEach((ca: number, i: number) => { const bai2 = ca - ca * txVar - nCF - nCFi - amortAnnuel, imp2 = bai2 > 0 ? bai2 * txIS2 : 0; npv += ((bai2 - imp2) + amortAnnuel) / Math.pow(1 + t / 100, i + 1); }); if (npv < 0) { tri = t; break; } }

                        return (
                            <div className="space-y-4 text-center">
                                {/* KPIs principaux */}
                                <div className="rounded-2xl overflow-hidden shadow-lg border border-blue-100">
                                    <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <Calculator size={18} className="text-yellow-300" />
                                            <span className="text-white font-black text-base">Résumé financier</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">💰 Invest. total</p>
                                                <p className="text-2xl font-black text-white leading-tight">{investTotal > 0 ? fmt(investTotal) : "—"}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">FCFA</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">🏦 Financement</p>
                                                <p className="text-2xl font-black text-white leading-tight">{finTotal > 0 ? fmt(finTotal) : "—"}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">FCFA</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">📊 Taux actualisation</p>
                                                <p className="text-2xl font-black text-yellow-300 leading-tight">{tauxActu > 0 ? `${tauxActu.toFixed(1)}%` : "—"}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">taux mixé</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">🔄 Amort./an</p>
                                                <p className="text-2xl font-black text-white leading-tight">{amortAnnuel > 0 ? fmt(amortAnnuel) : "—"}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">FCFA</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Indicateurs clés */}
                                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <BarChart3 size={18} className="text-yellow-300" />
                                            <span className="text-white font-black text-base">Indicateurs de rentabilité</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className={`rounded-2xl p-3.5 text-center w-full ${van >= 0 ? "bg-green-500/15 border border-green-400/25" : "bg-red-500/15 border border-red-400/25"}`}>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">📈 VAN</p>
                                                <p className={`text-2xl font-black leading-tight ${van >= 0 ? "text-green-300" : "text-red-300"}`}>{van >= 0 ? "+" : ""}{fmt(van)}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">{van >= 0 ? "✅ Rentable" : "⚠️ Non rentable"}</p>
                                            </div>
                                            <div className="bg-white/10 rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">📊 TRI</p>
                                                <p className="text-2xl font-black text-yellow-300 leading-tight">{tri.toFixed(1)}%</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">Taux rentabilité</p>
                                            </div>
                                            <div className="bg-white/10 rounded-2xl p-3.5 text-center border border-white/10 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">💹 ROI</p>
                                                <p className="text-2xl font-black text-white leading-tight">{roi.toFixed(1)}%</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">Retour investissement</p>
                                            </div>
                                            <div className={`rounded-2xl p-3.5 text-center w-full ${ip >= 1 ? "bg-green-500/15 border border-green-400/25" : "bg-red-500/15 border border-red-400/25"}`}>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">📋 IP</p>
                                                <p className={`text-2xl font-black leading-tight ${ip >= 1 ? "text-green-300" : "text-red-300"}`}>{ip.toFixed(2)}</p>
                                                <p className="text-[9px] text-white/40 font-bold mt-0.5">{ip >= 1 ? "✅ IP≥1" : "⚠️ IP<1"}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl p-3.5 text-center border border-indigo-300/20 col-span-2 w-full">
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">⏱ Délai de récupération</p>
                                                <p className="text-3xl font-black text-white leading-tight">{delaiRecup > 0 ? `${delaiRecup} an(s)` : "Non atteint"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Données saisies (collapsible) */}
                                <div className="rounded-2xl overflow-hidden shadow-md border border-blue-100">
                                    <button onClick={() => setBpExpanded(!bpExpanded)} className="w-full flex items-center gap-3 p-4 bg-blue-50 text-left">
                                        <FileSpreadsheet size={16} className="text-blue-600" />
                                        <span className="font-black text-sm text-blue-700 flex-1">Données saisies &amp; CA prévisionnel</span>
                                        {bpExpanded ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />}
                                    </button>
                                    {bpExpanded && (
                                        <div className="bg-white p-4 space-y-3 text-justify">
                                            {[
                                                { label: "Invest. matériel", icon: <Calculator size={14} />, key: "investissementMateriel", val: bp.investissementMateriel, mont: nIM },
                                                { label: "Invest. immatériel", icon: <FileSpreadsheet size={14} />, key: "investissementImateriel", val: bp.investissementImateriel, mont: nII },
                                                { label: "Fonds de roulement", icon: <PiggyBank size={14} />, key: "fondsDeRoulement", val: bp.fondsDeRoulement, mont: nFDR },
                                                { label: "Fonds propres", icon: <CircleDollarSign size={14} />, key: "fondsPropres", val: bp.fondsPropres, mont: nFP },
                                                { label: "Emprunt bancaire", icon: <Landmark size={14} />, key: "emprunt", val: bp.emprunt, mont: nE },
                                                { label: "Taux d'intérêt", icon: <Percent size={14} />, key: "tauxInteret", val: bp.tauxInteret, mont: num(bp.tauxInteret), suf: "%" },
                                                { label: "Charges variables", icon: <TrendingUp size={14} />, key: "chargesVariables", val: bp.chargesVariables, mont: nCV, suf: "%" },
                                                { label: "Charges fixes/an", icon: <CreditCard size={14} />, key: "chargesFixes", val: bp.chargesFixes, mont: nCF },
                                                { label: "Charges financières", icon: <Landmark size={14} />, key: "chargesFinancieres", val: bp.chargesFinancieres, mont: nCFi },
                                                { label: "Taux IS", icon: <Receipt size={14} />, key: "tauxIS", val: bp.tauxIS, mont: nIS, suf: "%" },
                                                { label: "Durée amortissement", icon: <Calculator size={14} />, key: "dureeAmortissement", val: bp.dureeAmortissement, mont: nDA, suf: " ans" },
                                                { label: "Taux sans risque", icon: <TrendingUp size={14} />, key: "tauxSansRisque", val: bp.tauxSansRisque, mont: nTSR, suf: "%" },
                                                { label: "Prime sectorielle", icon: <BarChart3 size={14} />, key: "primeSectorielle", val: bp.primeSectorielle, mont: nPS, suf: "%" },
                                                { label: "Prime pays", icon: <CreditCard size={14} />, key: "primePays", val: bp.primePays, mont: nPP, suf: "%" },
                                            ].map((f) => {
                                                const isEditing = editingBpField === f.key;
                                                const isMon = isMonBp(f.key);
                                                const storedItems = getLI()[f.key];
                                                const hasDetail = isMon && storedItems && storedItems.some(it => it.desig || parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) > 0);
                                                return (
                                                    <div key={f.key} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                                        {isEditing ? (
                                                            isMon ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{f.label}</p>
                                                                    {editBpLineItems.map((item, idx) => (
                                                                        <div key={idx} className="flex gap-1.5">
                                                                            <input type="text" value={item.desig} onChange={(e) => { const n = editBpLineItems.map((it, i) => i === idx ? { ...it, desig: e.target.value } : it); setEditBpLineItems(n); }} placeholder="Désignation" className="flex-1 p-2 rounded-lg border-2 border-blue-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-blue-500" />
                                                                            <input type="text" inputMode="decimal" value={item.montant} onChange={(e) => { const n = editBpLineItems.map((it, i) => i === idx ? { ...it, montant: e.target.value } : it); setEditBpLineItems(n); }} placeholder="Montant" className="w-24 p-2 rounded-lg border-2 border-blue-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-blue-500 text-center" />
                                                                            {editBpLineItems.length > 1 && (
                                                                                <button onClick={() => { const n = editBpLineItems.filter((_, i) => i !== idx); if (n.length === 0) n.push({ desig: "", montant: "" }); setEditBpLineItems(n); }} className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100" title="Supprimer"><Trash2 size={12} /></button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button onClick={() => setEditBpLineItems([...editBpLineItems, { desig: "", montant: "" }])} className="w-full py-1.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1"><Plus size={12} /> Ajouter</button>
                                                                    {editBpLineItems.some(it => parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) > 0) && (
                                                                        <div className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-200">
                                                                            <span className="text-[10px] font-black text-green-700 uppercase">Total</span>
                                                                            <span className="text-sm font-black text-green-700">{fmt(editBpLineItems.reduce((a, it) => a + (parseFloat(it.montant.replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0))} FCFA</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex gap-2">
                                                                        <button onClick={confirmBpEdit} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">✓ Valider</button>
                                                                        <button onClick={() => { setEditingBpField(null); setEditBpValue(""); setEditBpLineItems([]); }} className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">✕ Annuler</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{f.label}</p>
                                                                    <input type="text" value={editBpValue} onChange={(e) => setEditBpValue(e.target.value)} inputMode="text" placeholder="Valeur" className="w-full p-2 rounded-lg border-2 border-blue-400 bg-white text-sm font-semibold text-slate-900 outline-none" autoFocus />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={confirmBpEdit} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">✓ Valider</button>
                                                                        <button onClick={() => { setEditingBpField(null); setEditBpValue(""); }} className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">✕ Annuler</button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">{f.icon}</div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">{f.label}</p>
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        <p className="text-sm font-black text-slate-900">{f.suf ? `${f.mont}${f.suf}` : f.mont > 0 ? fmt(f.mont) : "—"}</p>
                                                                        {!f.suf && f.mont > 0 && <p className="text-[10px] text-slate-400">FCFA</p>}
                                                                    </div>
                                                                    <button onClick={() => startBpEdit(f.key, f.val)} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 ml-1 shrink-0" aria-label={`Modifier ${f.label}`}><Edit3 size={12} className="text-blue-500" /></button>
                                                                </div>
                                                                {hasDetail && storedItems && (
                                                                    <div className="mt-1.5 ml-9 space-y-0.5 border-t border-slate-200 pt-1.5">
                                                                        {storedItems.map((item, idx) => (
                                                                            (item.desig || item.montant) ? (
                                                                                <div key={idx} className="flex justify-between text-[11px]">
                                                                                    <span className="text-slate-500 font-semibold truncate mr-2">{item.desig || "—"}</span>
                                                                                    <span className="font-bold text-slate-700 whitespace-nowrap">{(() => { const n = parseFloat(item.montant.replace(/[^\d.,]/g, "").replace(",", ".")); return n > 0 ? `${fmt(n)} FCFA` : item.montant || "—"; })()}</span>
                                                                                </div>
                                                                            ) : null
                                                                        ))}
                                                                        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                                                                            <span className="text-[10px] font-black text-green-700 uppercase">Total</span>
                                                                            <span className="text-xs font-black text-green-700">{f.suf ? `${f.mont}${f.suf}` : f.mont > 0 ? `${fmt(f.mont)} FCFA` : "—"}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* CA prévisionnel */}
                                            {caAnnees.length > 0 && (
                                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={12} /> CA prévisionnel</p>
                                                    <div className="space-y-2">
                                                        {caAnnees.map((val: number, i: number) => (
                                                            <div key={i} className="bg-white rounded-xl px-3 py-2 border border-indigo-200 flex items-center gap-2">
                                                                <span className="text-xs font-black text-white bg-indigo-600 rounded-full w-7 h-7 flex items-center justify-center shrink-0">A{i + 1}</span>
                                                                {editingCaIndex === i ? (
                                                                    <div className="flex-1 flex items-center gap-1.5">
                                                                        <input type="text" value={editCaValue} onChange={(e) => setEditCaValue(e.target.value)} inputMode="numeric" title={`CA Année ${i + 1}`} className="flex-1 p-1.5 rounded-lg border-2 border-indigo-400 bg-white text-sm font-semibold text-slate-900 outline-none" autoFocus />
                                                                        <button onClick={confirmCaEdit} className="p-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold" title="Valider">✓</button>
                                                                        <button onClick={() => { setEditingCaIndex(null); }} className="p-1.5 rounded-lg bg-slate-200 text-slate-700 text-[11px]" title="Annuler">✕</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="flex-1 text-sm font-bold text-slate-900">{fmt(val)} FCFA</span>
                                                                        <button onClick={() => startCaEdit(i, val)} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors" aria-label={`Modifier CA Année ${i + 1}`}><Edit3 size={11} className="text-indigo-500" /></button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Résultats par année */}
                                {yearlyResults.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-indigo-200" />
                                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Détail par année</span>
                                            <div className="h-px flex-1 bg-indigo-200" />
                                        </div>
                                        {yearlyResults.map((r) => (
                                            <div key={r.annee} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 flex items-center justify-between">
                                                    <span className="text-xs font-black text-white/80 uppercase">Année {r.annee}</span>
                                                    <span className="text-sm font-black text-white">CA : {fmt(r.ca)} FCFA</span>
                                                </div>
                                                <div className="p-3 grid grid-cols-2 gap-2.5 text-center">
                                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl p-2.5 text-center border border-slate-200/50 w-full">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marge brute</p>
                                                        <p className="text-base font-black text-slate-900 mt-0.5">{fmt(r.margeBrute)}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl p-2.5 text-center border border-slate-200/50 w-full">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BAI</p>
                                                        <p className={`text-base font-black mt-0.5 ${r.bai >= 0 ? "text-slate-900" : "text-red-600"}`}>{fmt(r.bai)}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-red-50 to-orange-50/50 rounded-xl p-2.5 text-center border border-red-100/50 w-full">
                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Impôt</p>
                                                        <p className="text-base font-black text-red-600 mt-0.5">{fmt(r.impot)}</p>
                                                    </div>
                                                    <div className={`rounded-xl p-2.5 text-center border w-full ${r.benefNet >= 0 ? "bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-100/50" : "bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100/50"}`}>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bénéfice net</p>
                                                        <p className={`text-base font-black mt-0.5 ${r.benefNet >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(r.benefNet)}</p>
                                                    </div>
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100/50 col-span-2 w-full">
                                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Flux Net de Trésorerie Actualisé</p>
                                                        <p className="text-lg font-black text-blue-700 mt-0.5">{fmt(r.fntActu)} <span className="text-xs font-bold text-blue-400">FCFA</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })() : (
                        <button onClick={onStartBusinessPlan} className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                            <Sparkles size={18} className="text-yellow-300" /> Commencer le Plan d&apos;affaires chiffré
                        </button>
                    )}

                    {/* Supprimer plan d'affaires */}
                    {bpData && (
                        <div className="mt-4">
                            {!showDeleteBpConfirm ? (
                                <button onClick={() => setShowDeleteBpConfirm(true)} className="w-full p-3 rounded-2xl border-2 border-dashed border-orange-200 text-orange-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
                                    <Trash2 size={14} /> Supprimer le plan d&apos;affaires
                                </button>
                            ) : (
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                                    <p className="text-sm font-black text-orange-700 flex items-center gap-2 mb-1"><AlertTriangle size={16} /> Supprimer le plan d&apos;affaires ?</p>
                                    <p className="text-xs text-orange-500 mb-3">Toutes les données financières seront supprimées.</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setBpData(null); onDeleteBusinessPlan(); setShowDeleteBpConfirm(false); }} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
                                        <button onClick={() => setShowDeleteBpConfirm(false)} className="flex-1 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200">Annuler</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ===================== SECTION 4 — TÂCHES ===================== */}
                <ProjectTasksSection tasks={project.tasks} projectMembers={teamMembers} onSave={onSaveTasks} />

                {/* Zone danger */}
                <div className="mt-4 mb-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-red-200" />
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Zone danger</span>
                        <div className="h-px flex-1 bg-red-200" />
                    </div>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                            <Trash2 size={16} /> Supprimer ce projet
                        </button>
                    ) : (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                            <p className="text-sm font-black text-red-700 flex items-center gap-2 mb-1"><AlertTriangle size={16} /> Confirmer la suppression ?</p>
                            <p className="text-xs text-red-500 mb-3 font-semibold">Action irréversible. Toutes les données seront perdues.</p>
                            <div className="flex gap-2">
                                <button onClick={() => onDelete(project.id)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-500/30"><Trash2 size={13} /> Oui, supprimer</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200">Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
