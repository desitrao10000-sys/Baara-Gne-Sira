"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, Sparkles, AlertCircle, CheckCircle2, X, Loader2, ShieldCheck, Lock, FolderKanban, Building2, MapPin, Globe2, Calendar, Clock, Target, Calculator, Landmark, Percent, TrendingUp, CreditCard, PiggyBank, CircleDollarSign, FileSpreadsheet, BarChart3, Receipt, Users, UserCircle, Phone, Mail, Globe, ListChecks, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { ProjectInfo } from "./ProjectCreationWizard";
import { BusinessPlanData } from "./BusinessPlanWizard";
import { Project, ProjectManager, ProjectMember, ProjectTask } from "@/lib/useSupabaseProjects";

interface DocumentAnalysis {
    resume: string;
    sections: Record<string, any>;
    tachesProposees?: any[];
    champsManquants: string[];
    confiance: number;
}

interface Props {
    onComplete: (project: Project) => void;
    onCancel: () => void;
}

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
];

function getExt(name: string): string {
    return name.split(".").pop()?.toLowerCase() || "";
}

function fmtMoney(n: number | string | null): string {
    if (n === null || n === undefined) return "";
    const num = typeof n === "string" ? parseFloat(n) : n;
    if (isNaN(num)) return String(n);
    return num.toLocaleString("fr-FR") + " FCFA";
}

function fmtPct(n: number | string | null): string {
    if (n === null || n === undefined) return "";
    return `${n}%`;
}

function DetailTable({ items, columns }: { items: any[]; columns: { key: string; label: string; fmt?: (v: any) => string }[] }) {
    return (
        <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[10px]">
                <thead>
                    <tr className="border-b border-slate-200">
                        {columns.map(c => <th key={c.key} className="text-left py-1.5 px-2 font-black text-slate-500 uppercase">{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                            {columns.map(c => (
                                <td key={c.key} className="py-1.5 px-2 font-semibold text-slate-700">
                                    {c.fmt ? c.fmt(item[c.key]) : String(item[c.key] ?? "")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ExpandableSection({ title, icon, color, children, count }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode; count?: number }) {
    const [open, setOpen] = useState(true);
    const colorMap: Record<string, string> = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-emerald-600",
        purple: "from-purple-500 to-violet-600",
        orange: "from-orange-500 to-amber-600",
        red: "from-red-500 to-rose-600",
        teal: "from-teal-500 to-cyan-600",
        indigo: "from-indigo-500 to-indigo-600",
    };
    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-slate-100">
            <button onClick={() => setOpen(!open)} className={`w-full bg-gradient-to-r ${colorMap[color] || colorMap.blue} px-4 py-3 flex items-center gap-2`}>
                {icon}
                <span className="text-white font-black text-sm flex-1 text-left">{title}</span>
                {count !== undefined && <span className="text-white/80 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{count}</span>}
                {open ? <ChevronUp size={16} className="text-white/80" /> : <ChevronDown size={16} className="text-white/80" />}
            </button>
            {open && <div className="bg-white p-3">{children}</div>}
        </div>
    );
}

export default function DocumentUploadFlow({ onComplete, onCancel }: Props) {
    const [step, setStep] = useState<"upload" | "analyzing" | "review">("upload");
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = getExt(file.name);
        if (!ACCEPTED_TYPES.includes(file.type) && !["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"].includes(ext)) {
            setError(`Format non supporté : ${file.name}. Utilise PDF, Word ou images.`);
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setError(`Fichier trop volumineux (max 20 Mo)`);
            return;
        }

        setFileName(file.name);
        setStep("analyzing");
        setError(null);

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        try {
            const resp = await fetch("/api/analyze-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileBase64: base64,
                    fileName: file.name,
                    mimeType: file.type || `application/${ext}`,
                }),
            });

            const data = await resp.json();

            if (data.error) {
                setError(data.error);
                setStep("upload");
                return;
            }

            setAnalysis(data.result);
            setStep("review");
        } catch (err) {
            setError("Erreur lors de l'analyse. Vérifie ta connexion.");
            setStep("upload");
        }
    };

    const handleValidate = () => {
        if (!analysis) return;
        const sec = analysis.sections || {};

        const info: ProjectInfo = {
            name: sec.nom || "Projet importé",
            sector: sec.secteur || "",
            location: sec.localisation || "",
            zone: sec.zone || "",
            startDate: sec.dateDemarrage || "",
            duration: sec.duree || "",
            description: sec.description || "",
            objectives: sec.objectifs || "",
        };

        const bpData: BusinessPlanData = {
            investissementMateriel: sec.investissementMateriel ? String(sec.investissementMateriel) : "",
            investissementImateriel: sec.investissementImateriel ? String(sec.investissementImateriel) : "",
            fondsDeRoulement: sec.fondsDeRoulement ? String(sec.fondsDeRoulement) : "",
            fondsPropres: sec.fondsPropres ? String(sec.fondsPropres) : "",
            emprunt: sec.emprunt ? String(sec.emprunt) : "",
            tauxInteret: "",
            tauxSansRisque: "",
            primeSectorielle: "",
            primePays: "",
            tauxIS: sec.tauxIS ? String(sec.tauxIS) : "",
            dureeAmortissement: sec.dureeAmortissement ? String(sec.dureeAmortissement) : "",
            caAnnees: sec.caAnnees ? JSON.stringify(sec.caAnnees) : "",
            chargesVariables: sec.chargesVariables ? String(sec.chargesVariables) : "",
            chargesFixes: sec.chargesFixes ? String(sec.chargesFixes) : "",
            chargesFinancieres: sec.chargesFinancieres ? String(sec.chargesFinancieres) : "",
        };

        const hasFinancialData = Object.values(bpData).some(v => v !== "" && v !== undefined);

        // Create manager from detailsEquipe or responsables
        let manager: ProjectManager | null = null;
        const detailsEquipe = sec.detailsEquipe;
        const responsables = sec.responsables;

        if (Array.isArray(detailsEquipe) && detailsEquipe.length > 0) {
            const validMembers = detailsEquipe.filter((m: any) => m && (m.nom || m.name));
            if (validMembers.length > 0) {
                const membres: ProjectMember[] = validMembers.slice(1).map((m: any, i: number) => ({
                    id: crypto.randomUUID(),
                    nom: (m.nom || m.name || "").split(" ").slice(1).join(" ") || "",
                    prenom: (m.nom || m.name || "").split(" ")[0] || "",
                    contact: m.contact || m.telephone || m.email || "",
                    role: m.poste || m.role || `Membre ${i + 1}`,
                }));
                manager = {
                    nomComplet: validMembers[0].nom || validMembers[0].name || "",
                    contact: validMembers[0].contact || validMembers[0].telephone || validMembers[0].email || "",
                    role: validMembers[0].poste || validMembers[0].role || "Responsable principal",
                    niveauAcces: "administrateur",
                    membres: membres.length > 0 ? membres : undefined,
                };
            }
        } else if (Array.isArray(responsables) && responsables.length > 0) {
            const validNames = responsables.filter((r: string) => r && r.trim() !== "");
            if (validNames.length > 0) {
                const membres: ProjectMember[] = validNames.slice(1).map((name: string, i: number) => ({
                    id: crypto.randomUUID(),
                    nom: name.trim().split(" ").slice(1).join(" ") || name.trim(),
                    prenom: name.trim().split(" ")[0] || "",
                    contact: "",
                    role: `Membre ${i + 1}`,
                }));
                manager = {
                    nomComplet: validNames[0].trim(),
                    contact: "",
                    role: "Responsable principal",
                    niveauAcces: "administrateur",
                    membres: membres.length > 0 ? membres : undefined,
                };
            }
        }

        // Create tasks from tachesProposees
        const tasks: ProjectTask[] = (analysis.tachesProposees || []).map((t: any) => ({
            id: crypto.randomUUID(),
            designation: t.designation || "Tâche sans titre",
            description: t.description || "",
            objectifs: t.objectifs || "",
            responsable: t.responsable || "",
            dateDebut: t.dateDebut || "",
            dateFin: t.dateFin || "",
            statut: "todo" as const,
            budgetEntreesPrev: t.budgetPrev ? [{ id: crypto.randomUUID(), designation: "Budget prévu", montant: Number(t.budgetPrev) || 0 }] : [],
            budgetSortiesPrev: [],
            budgetEntreesReel: [],
            budgetSortiesReel: [],
            risques: t.risques || "",
            suggestionResolution: "",
            commentaires: "",
        }));

        const project: Project = {
            id: crypto.randomUUID(),
            info,
            createdAt: new Date().toISOString(),
            businessPlan: hasFinancialData ? JSON.stringify(bpData) : null,
            manager,
            tasks,
        };

        onComplete(project);
    };

    return (
        <div className="flex flex-col h-screen bg-pastel">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onCancel} className="text-white p-1" aria-label="Retour"><ArrowLeft size={24} /></button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide">
                            {step === "upload" ? "Remplissage par document" : step === "analyzing" ? "Analyse en cours..." : "Vérification du projet"}
                        </h1>
                        <p className="text-white/60 text-xs font-bold">
                            {step === "upload" ? "Étape 1/2 — Télécharger le document" : step === "analyzing" ? "L'IA analyse votre document..." : "Étape 2/2 — Vérifiez et validez"}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <Sparkles size={22} className="text-yellow-300" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                {/* ═══ STEP 1 : UPLOAD ═══ */}
                {step === "upload" && (
                    <div className="mt-4">
                        <div className="rounded-2xl overflow-hidden shadow-lg border border-purple-100 mb-4">
                            <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Upload size={20} className="text-yellow-300" />
                                    <span className="text-white font-black text-base">Télécharger un document</span>
                                </div>
                                <p className="text-white/70 text-xs font-semibold mb-4">
                                    L'Assistant IA lira le document et remplira automatiquement toutes les sections du projet, du plan d'affaires et proposera des tâches.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    title="Sélectionner un fichier"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full p-6 rounded-2xl border-2 border-dashed border-white/40 hover:border-white/70 bg-white/10 backdrop-blur-sm transition-all flex flex-col items-center gap-3"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <Upload size={32} className="text-white" />
                                    </div>
                                    <span className="text-white font-bold text-sm">Cliquer pour sélectionner un fichier</span>
                                    <span className="text-white/60 text-[11px] font-semibold block text-center">PDF • Word • Images (max 20 Mo)</span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 rounded-xl p-3 border border-red-200 mb-3 flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-700">{error}</p>
                                <button onClick={() => setError(null)} className="p-1 ml-auto" title="Fermer"><X size={14} className="text-red-400" /></button>
                            </div>
                        )}

                        <div className="bg-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-md mt-4">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                                <Lock size={18} className="text-yellow-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-white flex items-center gap-1"><ShieldCheck size={12} className="text-yellow-400" /> Sécurisé</p>
                                <p className="text-[11px] text-slate-400 font-semibold">Votre document est analysé localement et n'est pas stocké</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2 : ANALYZING ═══ */}
                {step === "analyzing" && (
                    <div className="mt-8 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-3xl bg-purple-100 flex items-center justify-center mb-6">
                            <Loader2 size={40} className="text-purple-600 animate-spin" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 mb-2">Analyse approfondie en cours...</h2>
                        <p className="text-sm text-slate-500 font-semibold text-center mb-4">
                            L'IA lit <span className="text-purple-600 font-bold">{fileName}</span> en détail et extrait toutes les informations
                        </p>
                        <div className="space-y-2 text-center">
                            <div className="flex items-center gap-2 text-purple-500 justify-center">
                                <Sparkles size={16} className="animate-pulse" />
                                <span className="text-xs font-bold">L'IA analyse le document en profondeur (1-3 min)...</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold">Extraction des contacts, matériels, montants, tâches...</p>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3 : REVIEW ═══ */}
                {step === "review" && analysis && (() => {
                    const sec = analysis.sections || {};
                    const contacts = sec.contacts || [];
                    const detailsMateriel = sec.detailsMateriel || [];
                    const detailsImateriel = sec.detailsImateriel || [];
                    const detailsFR = sec.detailsFondsRoulement || [];
                    const detailsFinancement = sec.detailsFinancement || [];
                    const detailsCV = sec.detailsChargesVariables || [];
                    const detailsCF = sec.detailsChargesFixes || [];
                    const detailsEquipe = sec.detailsEquipe || [];
                    const detailsRisques = sec.detailsRisques || [];
                    const taches = analysis.tachesProposees || [];
                    const totalFound = Object.keys(sec).filter(k => sec[k] !== null && sec[k] !== undefined).length;

                    return (
                        <div className="mt-4 space-y-3">
                            {/* Resume */}
                            <div className="bg-white rounded-2xl p-4 shadow-md border border-purple-200">
                                <p className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles size={14} /> Résumé du document</p>
                                <p className="text-sm text-slate-700 font-semibold leading-relaxed">{analysis.resume}</p>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">✅ Confiance : {analysis.confiance}%</span>
                                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">📋 {totalFound} champs trouvés</span>
                                    {taches.length > 0 && <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">📝 {taches.length} tâches proposées</span>}
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{fileName}</span>
                                </div>
                            </div>

                            {/* 1. INFOS PROJET */}
                            <ExpandableSection title="Informations du projet" icon={<FolderKanban size={16} className="text-white" />} color="orange" count={totalFound}>
                                <div className="space-y-2">
                                    {[
                                        { key: "nom", icon: <FolderKanban size={14} />, label: "Nom" },
                                        { key: "secteur", icon: <Building2 size={14} />, label: "Secteur" },
                                        { key: "localisation", icon: <MapPin size={14} />, label: "Localisation" },
                                        { key: "zone", icon: <Globe2 size={14} />, label: "Zone" },
                                        { key: "dateDemarrage", icon: <Calendar size={14} />, label: "Démarrage" },
                                        { key: "duree", icon: <Clock size={14} />, label: "Durée" },
                                        { key: "description", icon: <FileText size={14} />, label: "Description" },
                                        { key: "objectifs", icon: <Target size={14} />, label: "Objectifs" },
                                    ].map(({ key, icon, label }) => {
                                        const value = sec[key];
                                        const isMissing = value === null || value === undefined;
                                        const isLong = typeof value === "string" && value.length > 80;
                                        return (
                                            <div key={key} className={`rounded-xl px-3 py-2 border ${isMissing ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                                                <div className="flex items-center gap-2">
                                                    {isMissing ? <X size={12} className="text-orange-400" /> : <CheckCircle2 size={12} className="text-green-500" />}
                                                    <span className={`text-[11px] font-black ${isMissing ? "text-orange-600" : "text-green-700"}`}>{label}</span>
                                                </div>
                                                {!isMissing && (
                                                    <p className="text-[11px] font-semibold text-slate-700 mt-1 ml-6 whitespace-pre-wrap leading-relaxed">
                                                        {isLong ? value : String(value)}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Extra fields */}
                                    {[
                                        { key: "clientsCibles", label: "👥 Clients cibles" },
                                        { key: "concurrents", label: "🏁 Concurrents" },
                                        { key: "fournisseurs", label: "🏭 Fournisseurs" },
                                        { key: "partenaires", label: "🤝 Partenaires" },
                                        { key: "autresInformations", label: "📌 Autres infos" },
                                    ].filter(({ key }) => sec[key]).map(({ key, label }) => (
                                        <div key={key} className="rounded-xl px-3 py-2 border bg-blue-50 border-blue-200">
                                            <span className="text-[11px] font-black text-blue-700">{label}</span>
                                            <p className="text-[11px] font-semibold text-slate-700 mt-1 ml-0 whitespace-pre-wrap">{String(sec[key])}</p>
                                        </div>
                                    ))}
                                </div>
                            </ExpandableSection>

                            {/* 2. CONTACTS */}
                            {contacts.length > 0 && (
                                <ExpandableSection title="Contacts & Coordonnées" icon={<Phone size={16} className="text-white" />} color="teal" count={contacts.length}>
                                    <div className="space-y-1.5">
                                        {contacts.map((c: any, i: number) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                {c.type === "telephone" ? <Phone size={13} className="text-teal-600 shrink-0" /> :
                                                    c.type === "email" ? <Mail size={13} className="text-teal-600 shrink-0" /> :
                                                        <Globe size={13} className="text-teal-600 shrink-0" />}
                                                <span className="text-[11px] font-bold text-slate-800">{String(c.valeur)}</span>
                                                {c.qui && <span className="text-[10px] text-slate-400 font-semibold ml-auto">({c.qui})</span>}
                                            </div>
                                        ))}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 3. MATÉRIEL DÉTAILLÉ */}
                            {(detailsMateriel.length > 0 || sec.investissementMateriel) && (
                                <ExpandableSection title="Investissement Matériel" icon={<Calculator size={16} className="text-white" />} color="blue" count={detailsMateriel.length || 1}>
                                    {detailsMateriel.length > 0 && (
                                        <DetailTable items={detailsMateriel} columns={[
                                            { key: "designation", label: "Désignation" },
                                            { key: "quantite", label: "Qté" },
                                            { key: "prixUnitaire", label: "P.U.", fmt: (v) => v ? fmtMoney(v) : "" },
                                            { key: "montant", label: "Total", fmt: (v) => v ? fmtMoney(v) : "" },
                                        ]} />
                                    )}
                                    {sec.investissementMateriel && (
                                        <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 flex justify-between items-center border border-blue-200">
                                            <span className="text-xs font-black text-blue-700">TOTAL MATÉRIEL</span>
                                            <span className="text-sm font-black text-blue-800">{fmtMoney(sec.investissementMateriel)}</span>
                                        </div>
                                    )}
                                </ExpandableSection>
                            )}

                            {/* 4. IMMATÉRIEL DÉTAILLÉ */}
                            {(detailsImateriel.length > 0 || sec.investissementImateriel) && (
                                <ExpandableSection title="Investissement Immatériel" icon={<FileSpreadsheet size={16} className="text-white" />} color="indigo" count={detailsImateriel.length || 1}>
                                    {detailsImateriel.length > 0 && (
                                        <DetailTable items={detailsImateriel} columns={[
                                            { key: "designation", label: "Désignation" },
                                            { key: "montant", label: "Montant", fmt: (v) => v ? fmtMoney(v) : "" },
                                        ]} />
                                    )}
                                    {sec.investissementImateriel && (
                                        <div className="mt-2 bg-indigo-50 rounded-lg px-3 py-2 flex justify-between items-center border border-indigo-200">
                                            <span className="text-xs font-black text-indigo-700">TOTAL IMMATÉRIEL</span>
                                            <span className="text-sm font-black text-indigo-800">{fmtMoney(sec.investissementImateriel)}</span>
                                        </div>
                                    )}
                                </ExpandableSection>
                            )}

                            {/* 5. FONDS DE ROULEMENT */}
                            {(detailsFR.length > 0 || sec.fondsDeRoulement) && (
                                <ExpandableSection title="Fonds de Roulement" icon={<PiggyBank size={16} className="text-white" />} color="green" count={detailsFR.length || 1}>
                                    {detailsFR.length > 0 && (
                                        <DetailTable items={detailsFR} columns={[
                                            { key: "designation", label: "Désignation" },
                                            { key: "montant", label: "Montant", fmt: (v) => v ? fmtMoney(v) : "" },
                                        ]} />
                                    )}
                                    {sec.fondsDeRoulement && (
                                        <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 flex justify-between items-center border border-green-200">
                                            <span className="text-xs font-black text-green-700">TOTAL FDR</span>
                                            <span className="text-sm font-black text-green-800">{fmtMoney(sec.fondsDeRoulement)}</span>
                                        </div>
                                    )}
                                </ExpandableSection>
                            )}

                            {/* 6. FINANCEMENT */}
                            {(detailsFinancement.length > 0 || sec.fondsPropres || sec.emprunt) && (
                                <ExpandableSection title="Financement" icon={<Landmark size={16} className="text-white" />} color="purple" count={detailsFinancement.length || 1}>
                                    {detailsFinancement.length > 0 && (
                                        <DetailTable items={detailsFinancement} columns={[
                                            { key: "source", label: "Source" },
                                            { key: "montant", label: "Montant", fmt: (v) => v ? fmtMoney(v) : "" },
                                        ]} />
                                    )}
                                    <div className="mt-2 space-y-1">
                                        {sec.fondsPropres && (
                                            <div className="bg-purple-50 rounded-lg px-3 py-2 flex justify-between items-center border border-purple-200">
                                                <span className="text-xs font-black text-purple-700">Fonds propres</span>
                                                <span className="text-sm font-black text-purple-800">{fmtMoney(sec.fondsPropres)}</span>
                                            </div>
                                        )}
                                        {sec.emprunt && (
                                            <div className="bg-purple-50 rounded-lg px-3 py-2 flex justify-between items-center border border-purple-200">
                                                <span className="text-xs font-black text-purple-700">Emprunt</span>
                                                <span className="text-sm font-black text-purple-800">{fmtMoney(sec.emprunt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 7. CHARGES */}
                            {(detailsCF.length > 0 || detailsCV.length > 0 || sec.chargesFixes || sec.chargesVariables) && (
                                <ExpandableSection title="Charges d'exploitation" icon={<CreditCard size={16} className="text-white" />} color="red">
                                    <div className="space-y-3">
                                        {detailsCV.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-red-600 uppercase mb-1">Charges variables ({fmtPct(sec.chargesVariables)})</p>
                                                <DetailTable items={detailsCV} columns={[
                                                    { key: "designation", label: "Désignation" },
                                                    { key: "montant", label: "Montant/%", fmt: (v) => v ? String(v) : "" },
                                                ]} />
                                            </div>
                                        )}
                                        {detailsCF.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-red-600 uppercase mb-1">Charges fixes ({fmtMoney(sec.chargesFixes)}/an)</p>
                                                <DetailTable items={detailsCF} columns={[
                                                    { key: "designation", label: "Désignation" },
                                                    { key: "montant", label: "Montant", fmt: (v) => v ? fmtMoney(v) : "" },
                                                ]} />
                                            </div>
                                        )}
                                        {sec.chargesFinancieres && (
                                            <div className="bg-red-50 rounded-lg px-3 py-2 flex justify-between items-center border border-red-200">
                                                <span className="text-xs font-black text-red-700">Charges financières</span>
                                                <span className="text-sm font-black text-red-800">{fmtMoney(sec.chargesFinancieres)}</span>
                                            </div>
                                        )}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 8. PLAN FINANCIER SYNTHÈSE */}
                            {(sec.tauxIS || sec.dureeAmortissement || sec.caAnnees) && (
                                <ExpandableSection title="Plan financier" icon={<BarChart3 size={16} className="text-white" />} color="teal">
                                    <div className="space-y-2">
                                        {sec.tauxIS && (
                                            <div className="flex justify-between items-center bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
                                                <span className="text-xs font-black text-teal-700">Taux IS</span>
                                                <span className="text-sm font-black text-teal-800">{fmtPct(sec.tauxIS)}</span>
                                            </div>
                                        )}
                                        {sec.dureeAmortissement && (
                                            <div className="flex justify-between items-center bg-teal-50 rounded-lg px-3 py-2 border border-teal-200">
                                                <span className="text-xs font-black text-teal-700">Durée amortissement</span>
                                                <span className="text-sm font-black text-teal-800">{sec.dureeAmortissement} ans</span>
                                            </div>
                                        )}
                                        {sec.caAnnees && Array.isArray(sec.caAnnees) && (
                                            <div>
                                                <p className="text-[10px] font-black text-teal-600 uppercase mb-1">CA prévisionnel par année</p>
                                                {sec.caAnnees.map((ca: number, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-teal-50 rounded-lg px-3 py-1.5 border border-teal-100 mb-1">
                                                        <span className="text-[11px] font-bold text-teal-700">Année {i + 1}</span>
                                                        <span className="text-[11px] font-black text-teal-800">{fmtMoney(ca)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 9. ÉQUIPE DÉTAILLÉE */}
                            {(detailsEquipe.length > 0 || (sec.responsables && sec.responsables.length > 0)) && (
                                <ExpandableSection title="Équipe & Responsables" icon={<Users size={16} className="text-white" />} color="green" count={detailsEquipe.length || sec.responsables?.length || 0}>
                                    <div className="space-y-2">
                                        {detailsEquipe.length > 0 ? detailsEquipe.map((m: any, i: number) => (
                                            <div key={i} className="bg-green-50 rounded-xl p-3 border border-green-200">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle size={16} className="text-green-600 shrink-0" />
                                                    <span className="text-xs font-black text-slate-800">{m.nom || m.name}</span>
                                                    {m.poste && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{m.poste}</span>}
                                                </div>
                                                {(m.contact || m.telephone || m.email) && (
                                                    <div className="flex items-center gap-2 mt-1 ml-6">
                                                        <Phone size={10} className="text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-semibold">{m.contact || m.telephone || m.email}</span>
                                                    </div>
                                                )}
                                                {m.role && <p className="text-[10px] text-slate-500 font-semibold mt-1 ml-6">Rôle : {m.role}</p>}
                                            </div>
                                        )) : (sec.responsables || []).map((name: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                                                <UserCircle size={14} className="text-green-600" />
                                                <span className="text-xs font-bold text-slate-800">{name}</span>
                                                <span className="text-[10px] text-slate-400 ml-auto">{i === 0 ? "Responsable principal" : `Membre ${i}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 10. RISQUES DÉTAILLÉS */}
                            {(detailsRisques.length > 0 || sec.risques) && (
                                <ExpandableSection title="Risques identifiés" icon={<AlertCircle size={16} className="text-white" />} color="red" count={detailsRisques.length || 1}>
                                    <div className="space-y-2">
                                        {detailsRisques.length > 0 ? detailsRisques.map((r: any, i: number) => (
                                            <div key={i} className="bg-red-50 rounded-xl p-3 border border-red-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-black text-red-700">{r.risque}</span>
                                                    {r.niveau && (
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.niveau === "élevé" ? "bg-red-200 text-red-800" :
                                                            r.niveau === "moyen" ? "bg-yellow-200 text-yellow-800" :
                                                                "bg-green-200 text-green-800"
                                                            }`}>{r.niveau}</span>
                                                    )}
                                                </div>
                                                {r.mitigation && <p className="text-[10px] text-slate-600 font-semibold">💡 {r.mitigation}</p>}
                                            </div>
                                        )) : (
                                            <p className="text-xs text-slate-600 font-semibold">{String(sec.risques)}</p>
                                        )}
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* 11. TÂCHES PROPOSÉES */}
                            {taches.length > 0 && (
                                <ExpandableSection title={`📝 ${taches.length} tâche(s) proposée(s) par l'IA`} icon={<ListChecks size={16} className="text-white" />} color="purple" count={taches.length}>
                                    <div className="space-y-2">
                                        {taches.map((t: any, i: number) => (
                                            <div key={i} className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-purple-800">{i + 1}. {t.designation}</span>
                                                    <span className="text-[9px] font-bold bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Nouveau</span>
                                                </div>
                                                {t.description && <p className="text-[10px] text-slate-600 font-semibold mb-1">{t.description}</p>}
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {t.responsable && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">👤 {t.responsable}</span>}
                                                    {t.dateDebut && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">📅 {t.dateDebut}</span>}
                                                    {t.dateFin && <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⏰ {t.dateFin}</span>}
                                                    {t.budgetPrev > 0 && <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">💰 {fmtMoney(t.budgetPrev)}</span>}
                                                </div>
                                                {t.objectifs && <p className="text-[10px] text-purple-600 font-semibold mt-1">🎯 {t.objectifs}</p>}
                                                {t.risques && <p className="text-[10px] text-red-500 font-semibold mt-1">⚠️ {t.risques}</p>}
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-slate-400 font-semibold text-center mt-2">Ces tâches seront ajoutées au projet. Vous pourrez les modifier ensuite.</p>
                                    </div>
                                </ExpandableSection>
                            )}

                            {/* Champs manquants */}
                            {analysis.champsManquants.length > 0 && (
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
                                    <p className="text-xs font-black text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <AlertCircle size={14} /> ⚠️ {analysis.champsManquants.length} information(s) à compléter
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.champsManquants.map((field) => (
                                            <span key={field} className="text-[10px] font-bold text-orange-700 bg-white px-2 py-1 rounded-full border border-orange-200">
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-orange-500 font-semibold mt-2">Vous pourrez les remplir manuellement après validation.</p>
                                </div>
                            )}

                            {/* Bouton Valider */}
                            <button onClick={handleValidate} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 active:scale-95 transition-transform">
                                <CheckCircle2 size={22} /> ✨ Créer le projet ({totalFound} infos + {taches.length} tâches)
                            </button>

                            <button onClick={() => { setStep("upload"); setAnalysis(null); }} className="w-full py-3 bg-white text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50">
                                <Upload size={16} /> Choisir un autre document
                            </button>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}