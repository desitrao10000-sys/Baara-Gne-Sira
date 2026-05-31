"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, Image, Sparkles, AlertCircle, CheckCircle2, X, Loader2, ShieldCheck, Lock, ArrowRight, FolderKanban, Building2, MapPin, Globe2, Calendar, Clock, Target, Calculator, Landmark, Percent, TrendingUp, CreditCard, PiggyBank, CircleDollarSign, FileSpreadsheet, BarChart3, Receipt, Users, UserCircle } from "lucide-react";
import { ProjectInfo } from "./ProjectCreationWizard";
import { BusinessPlanData } from "./BusinessPlanWizard";
import { Project, ProjectManager, ProjectMember } from "@/lib/useSupabaseProjects";

interface DocumentAnalysis {
    resume: string;
    sections: Record<string, any>;
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

const SECTION_LABELS: Record<string, string> = {
    nom: "Nom du projet", secteur: "Secteur d'activité", localisation: "Localisation",
    zone: "Zone d'intervention", dateDemarrage: "Date de démarrage", duree: "Durée",
    description: "Description", objectifs: "Objectifs",
    investissementMateriel: "Invest. matériel", investissementImateriel: "Invest. immatériel",
    fondsDeRoulement: "Fonds de roulement", fondsPropres: "Fonds propres", emprunt: "Emprunt",
    chargesVariables: "Charges variables (%)", chargesFixes: "Charges fixes/an",
    chargesFinancieres: "Charges financières", tauxIS: "Taux IS (%)",
    dureeAmortissement: "Durée amortissement", caAnnees: "CA prévisionnel",
    responsables: "Responsables", risques: "Risques identifiés",
};

function getExt(name: string): string {
    return name.split(".").pop()?.toLowerCase() || "";
}

function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        // Analyze
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

        // Create project from analysis
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

        // Create business plan data from analysis
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

        // Create manager from responsables
        let manager: ProjectManager | null = null;
        const responsables = sec.responsables;
        if (Array.isArray(responsables) && responsables.length > 0) {
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

        const project: Project = {
            id: crypto.randomUUID(),
            info,
            createdAt: new Date().toISOString(),
            businessPlan: hasFinancialData ? JSON.stringify(bpData) : null,
            manager,
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
                                    L'Assistant IA lira le document et remplira automatiquement toutes les sections du projet et du plan d'affaires.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    title="Sélectionner un fichier"
                                    placeholder="Fichier"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full p-6 rounded-2xl border-2 border-dashed border-white/40 hover:border-white/70 bg-white/10 backdrop-blur-sm transition-all flex flex-col items-center gap-3"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <Upload size={32} className="text-white" />
                                    </div>
                                    <span className="text-white font-bold text-sm">Cliquer pour sélectionner un fichier</span>
                                    <span className="text-white/60 text-[11px] font-semibold">PDF • Word • Images (max 20 Mo)</span>
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
                        <h2 className="text-lg font-black text-slate-900 mb-2">Analyse en cours...</h2>
                        <p className="text-sm text-slate-500 font-semibold text-center mb-4">
                            L'Assistant IA lit <span className="text-purple-600 font-bold">{fileName}</span> et extrait les informations
                        </p>
                        <div className="flex items-center gap-2 text-purple-500">
                            <Sparkles size={16} className="animate-pulse" />
                            <span className="text-xs font-bold">L'IA analyse le document en profondeur, ça peut prendre 1-2 minutes...</span>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3 : REVIEW ═══ */}
                {step === "review" && analysis && (
                    <div className="mt-4 space-y-4">
                        {/* Resume */}
                        <div className="bg-white rounded-2xl p-4 shadow-md border border-purple-200">
                            <p className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles size={14} /> Résumé du document</p>
                            <p className="text-sm text-slate-700 font-semibold leading-relaxed">{analysis.resume}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Confiance : {analysis.confiance}%</span>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{fileName}</span>
                            </div>
                        </div>

                        {/* INFOS PROJET (Section 1) */}
                        <div className="rounded-2xl overflow-hidden shadow-md border border-yellow-100">
                            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-3 flex items-center gap-2">
                                <FolderKanban size={16} className="text-white" />
                                <span className="text-white font-black text-sm">Section 1 — Informations du projet</span>
                            </div>
                            <div className="bg-white p-3 space-y-2">
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
                                    const value = analysis.sections[key];
                                    const isMissing = value === null || value === undefined;
                                    return (
                                        <div key={key} className={`rounded-xl px-3 py-2 border ${isMissing ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                                            <div className="flex items-center gap-2">
                                                {isMissing ? <X size={12} className="text-orange-400" /> : <CheckCircle2 size={12} className="text-green-500" />}
                                                <span className={`text-[11px] font-black ${isMissing ? "text-orange-600" : "text-green-700"}`}>{label}</span>
                                                {!isMissing && <span className="text-[11px] font-semibold text-slate-700 ml-auto truncate max-w-[200px]">{Array.isArray(value) ? value.join(", ") : String(value)}</span>}
                                                {isMissing && <span className="text-[10px] text-orange-400 font-semibold ml-auto">⚠️ À compléter</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ÉQUIPE (Section 3) */}
                        <div className="rounded-2xl overflow-hidden shadow-md border border-emerald-100">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 flex items-center gap-2">
                                <Users size={16} className="text-white" />
                                <span className="text-white font-black text-sm">Section 3 — Équipe & Responsables</span>
                            </div>
                            <div className="bg-white p-3 space-y-2">
                                {(() => {
                                    const responsables = analysis.sections.responsables;
                                    const hasResponsables = Array.isArray(responsables) && responsables.length > 0 && responsables.some((r: string) => r && r.trim() !== "");
                                    if (hasResponsables) {
                                        return (
                                            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                                                <p className="text-[11px] font-black text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-green-500" /> Responsables identifiés ({responsables.filter((r: string) => r && r.trim()).length})
                                                </p>
                                                <div className="space-y-1.5">
                                                    {responsables.filter((r: string) => r && r.trim()).map((name: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-green-100">
                                                            <UserCircle size={14} className="text-green-600 shrink-0" />
                                                            <span className="text-xs font-bold text-slate-800">{name}</span>
                                                            <span className="text-[10px] text-slate-400 font-semibold ml-auto">{i === 0 ? "Responsable principal" : `Membre ${i}`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="bg-orange-50 rounded-xl px-3 py-2 border border-orange-200">
                                            <div className="flex items-center gap-2">
                                                <X size={12} className="text-orange-400" />
                                                <span className="text-[11px] font-black text-orange-600">Responsables</span>
                                                <span className="text-[10px] text-orange-400 font-semibold ml-auto">⚠️ À compléter</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* PLAN D'AFFAIRES (Section 3) */}
                        <div className="rounded-2xl overflow-hidden shadow-md border border-blue-100">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                                <Calculator size={16} className="text-white" />
                                <span className="text-white font-black text-sm">Section 2 — Plan d'affaires chiffré</span>
                            </div>
                            <div className="bg-white p-3 space-y-2">
                                {[
                                    { key: "investissementMateriel", icon: <Calculator size={14} />, label: "Invest. matériel" },
                                    { key: "investissementImateriel", icon: <FileSpreadsheet size={14} />, label: "Invest. immatériel" },
                                    { key: "fondsDeRoulement", icon: <PiggyBank size={14} />, label: "Fonds de roulement" },
                                    { key: "fondsPropres", icon: <CircleDollarSign size={14} />, label: "Fonds propres" },
                                    { key: "emprunt", icon: <Landmark size={14} />, label: "Emprunt" },
                                    { key: "chargesVariables", icon: <TrendingUp size={14} />, label: "Charges variables (%)" },
                                    { key: "chargesFixes", icon: <CreditCard size={14} />, label: "Charges fixes/an" },
                                    { key: "chargesFinancieres", icon: <Landmark size={14} />, label: "Charges financières" },
                                    { key: "tauxIS", icon: <Receipt size={14} />, label: "Taux IS (%)" },
                                    { key: "dureeAmortissement", icon: <Calculator size={14} />, label: "Durée amortissement" },
                                    { key: "caAnnees", icon: <BarChart3 size={14} />, label: "CA prévisionnel" },
                                ].map(({ key, icon, label }) => {
                                    const value = analysis.sections[key];
                                    const isMissing = value === null || value === undefined;
                                    return (
                                        <div key={key} className={`rounded-xl px-3 py-2 border ${isMissing ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
                                            <div className="flex items-center gap-2">
                                                {isMissing ? <X size={12} className="text-orange-400" /> : <CheckCircle2 size={12} className="text-green-500" />}
                                                <span className={`text-[11px] font-black ${isMissing ? "text-orange-600" : "text-green-700"}`}>{label}</span>
                                                {!isMissing && <span className="text-[11px] font-semibold text-slate-700 ml-auto truncate max-w-[200px]">{Array.isArray(value) ? value.join(", ") : String(value)}</span>}
                                                {isMissing && <span className="text-[10px] text-orange-400 font-semibold ml-auto">⚠️ À compléter</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Champs manquants résumé */}
                        {analysis.champsManquants.length > 0 && (
                            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
                                <p className="text-xs font-black text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <AlertCircle size={14} /> ⚠️ {analysis.champsManquants.length} information(s) manquante(s) à compléter
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.champsManquants.map((field) => (
                                        <span key={field} className="text-[10px] font-bold text-orange-700 bg-white px-2 py-1 rounded-full border border-orange-200">
                                            {SECTION_LABELS[field] || field}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] text-orange-500 font-semibold mt-2">Vous pourrez les remplir manuellement après validation.</p>
                            </div>
                        )}

                        {/* Bouton Valider */}
                        <button onClick={handleValidate} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 active:scale-95 transition-transform">
                            <CheckCircle2 size={22} /> ✨ Créer le projet avec ces données
                        </button>

                        <button onClick={() => { setStep("upload"); setAnalysis(null); }} className="w-full py-3 bg-white text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors">
                            <Upload size={16} /> Choisir un autre document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}