"use client";
import { useState, useRef } from "react";
import { Upload, FileText, Image, FileCheck, Sparkles, AlertCircle, CheckCircle2, X, Loader2, ChevronDown, ChevronUp, ShieldCheck, Eye, Trash2, Lock } from "lucide-react";

interface ProjectDocument {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    base64?: string;
    analysis?: DocumentAnalysis | null;
}

interface DocumentAnalysis {
    resume: string;
    sections: Record<string, any>;
    champsManquants: string[];
    confiance: number;
}

interface Props {
    projectId: string;
    savedDocuments?: ProjectDocument[];
    onSaveDocuments: (docs: ProjectDocument[]) => void;
    onApplyToProject: (data: DocumentAnalysis) => void;
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

const TYPE_ICONS: Record<string, React.ReactNode> = {
    pdf: <FileText size={18} className="text-red-500" />,
    doc: <FileText size={18} className="text-blue-500" />,
    docx: <FileText size={18} className="text-blue-500" />,
    png: <Image size={18} className="text-green-500" />,
    jpg: <Image size={18} className="text-green-500" />,
    jpeg: <Image size={18} className="text-green-500" />,
    webp: <Image size={18} className="text-green-500" />,
};

function getExt(name: string): string {
    return name.split(".").pop()?.toLowerCase() || "";
}

function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fmtDate(iso: string) {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}

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

export default function ProjectDocumentsSection({ projectId, savedDocuments = [], onSaveDocuments, onApplyToProject }: Props) {
    const [documents, setDocuments] = useState<ProjectDocument[]>(savedDocuments);
    const [analyzing, setAnalyzing] = useState<string | null>(null);
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
    const [applyConfirm, setApplyConfirm] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setError(null);

        for (const file of Array.from(files)) {
            const ext = getExt(file.name);
            if (!ACCEPTED_TYPES.includes(file.type) && !["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"].includes(ext)) {
                setError(`Format non supporté : ${file.name}. Utilise PDF, Word ou images.`);
                continue;
            }
            if (file.size > 20 * 1024 * 1024) {
                setError(`Fichier trop volumineux : ${file.name} (max 20 Mo)`);
                continue;
            }

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
            const doc: ProjectDocument = {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type || `application/${ext}`,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                base64,
                analysis: null,
            };

            const updated = [...documents, doc];
            setDocuments(updated);
            onSaveDocuments(updated);

            // Auto-analyze
            analyzeDocument(doc, updated);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const analyzeDocument = async (doc: ProjectDocument, currentDocs?: ProjectDocument[]) => {
        setAnalyzing(doc.id);
        setError(null);

        try {
            const resp = await fetch("/api/analyze-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileBase64: doc.base64,
                    fileName: doc.name,
                    mimeType: doc.type,
                }),
            });

            const data = await resp.json();

            if (data.error) {
                setError(data.error);
                setAnalyzing(null);
                return;
            }

            const analysis: DocumentAnalysis = data.result;
            const updated = (currentDocs || documents).map((d) =>
                d.id === doc.id ? { ...d, analysis } : d
            );
            setDocuments(updated);
            onSaveDocuments(updated);
        } catch (err) {
            setError("Erreur lors de l'analyse. Vérifie ta connexion.");
        } finally {
            setAnalyzing(null);
        }
    };

    const deleteDocument = (docId: string) => {
        const updated = documents.filter((d) => d.id !== docId);
        setDocuments(updated);
        onSaveDocuments(updated);
        if (expandedDoc === docId) setExpandedDoc(null);
    };

    const applyAnalysis = (doc: ProjectDocument) => {
        if (doc.analysis) {
            onApplyToProject(doc.analysis);
            setApplyConfirm(null);
        }
    };

    return (
        <div className="mt-6 mb-4">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-400" />
                <span className="text-xs font-black text-purple-600 uppercase tracking-widest px-1">Section 5 — Projet / Plan d'affaire par document</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-400" />
            </div>

            {/* Upload zone */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-purple-100 mb-4">
                <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Upload size={18} className="text-yellow-300" />
                        <span className="text-white font-black text-sm">Télécharger un document</span>
                    </div>
                    <p className="text-white/70 text-[11px] font-semibold mb-3 text-center">PDF, Word ou photos — L'Assistant IA lira et remplira automatiquement les sections du projet
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-white/40 hover:border-white/70 bg-white/10 backdrop-blur-sm transition-all flex flex-col items-center gap-2"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Upload size={24} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-sm">Cliquer pour sélectionner des fichiers</span>
                        <span className="text-white/60 text-[11px] font-semibold block text-center">PDF • Word • Images (max 20 Mo)</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 rounded-xl p-3 border border-red-200 mb-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-red-700">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-1"><X size={14} className="text-red-400" /></button>
                </div>
            )}

            {/* Documents list */}
            {documents.length > 0 && (
                <div className="space-y-3 mb-4">
                    {documents.map((doc) => {
                        const ext = getExt(doc.name);
                        const icon = TYPE_ICONS[ext] || <FileText size={18} className="text-slate-400" />;
                        const expanded = expandedDoc === doc.id;
                        const isAnalyzing = analyzing === doc.id;
                        const hasAnalysis = !!doc.analysis;

                        return (
                            <div key={doc.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                                {/* Doc header */}
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-slate-400 font-semibold uppercase">{ext}</span>
                                                <span className="text-[11px] text-slate-400">•</span>
                                                <span className="text-[11px] text-slate-400 font-semibold">{fmtSize(doc.size)}</span>
                                                <span className="text-[11px] text-slate-400">•</span>
                                                <span className="text-[11px] text-slate-400 font-semibold">{fmtDate(doc.uploadedAt)}</span>
                                            </div>
                                            {/* Status badge */}
                                            {isAnalyzing && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <Loader2 size={14} className="text-purple-500 animate-spin" />
                                                    <span className="text-[11px] font-bold text-purple-600">Analyse en cours par l'Assistant IA...</span>
                                                </div>
                                            )}
                                            {!isAnalyzing && hasAnalysis && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                    <span className="text-[11px] font-bold text-green-600">Analyse terminée — Confiance : {doc.analysis!.confiance}%</span>
                                                </div>
                                            )}
                                            {!isAnalyzing && !hasAnalysis && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <AlertCircle size={14} className="text-orange-400" />
                                                    <span className="text-[11px] font-bold text-orange-500">Non analysé</span>
                                                    <button onClick={() => analyzeDocument(doc)} className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-black hover:bg-purple-200 transition-colors">
                                                        Analyser
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button onClick={() => setExpandedDoc(expanded ? null : doc.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" aria-label="Détails">
                                                {expanded ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
                                            </button>
                                            <button onClick={() => deleteDocument(doc.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors" aria-label="Supprimer">
                                                <Trash2 size={14} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded analysis */}
                                {expanded && doc.analysis && (
                                    <div className="border-t border-slate-100 p-4 space-y-3 bg-purple-50/30">
                                        {/* Résumé */}
                                        <div className="bg-white rounded-xl p-3 border border-purple-200">
                                            <p className="text-[11px] font-black text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles size={12} /> Résumé du document</p>
                                            <p className="text-xs text-slate-700 font-semibold leading-relaxed">{doc.analysis.resume}</p>
                                        </div>

                                        {/* Données extraites */}
                                        <div className="bg-white rounded-xl p-3 border border-purple-200">
                                            <p className="text-[11px] font-black text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><FileCheck size={12} /> Informations extraites</p>
                                            <div className="space-y-1.5">
                                                {Object.entries(doc.analysis.sections).map(([key, value]) => {
                                                    if (value === null || value === undefined) return null;
                                                    const label = SECTION_LABELS[key] || key;
                                                    const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
                                                    return (
                                                        <div key={key} className="flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-1.5 border border-green-200">
                                                            <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                                            <span className="text-[11px] font-bold text-green-700 shrink-0">{label} :</span>
                                                            <span className="text-[11px] font-semibold text-slate-800 truncate">{displayValue}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Champs manquants */}
                                        {doc.analysis.champsManquants.length > 0 && (
                                            <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                                                <p className="text-[11px] font-black text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle size={12} /> Informations manquantes (à compléter)</p>
                                                <div className="space-y-1">
                                                    {doc.analysis.champsManquants.map((field) => (
                                                        <div key={field} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-orange-200">
                                                            <X size={12} className="text-orange-400 shrink-0" />
                                                            <span className="text-[11px] font-bold text-orange-700">{SECTION_LABELS[field] || field}</span>
                                                            <span className="text-[10px] text-orange-400 font-semibold ml-auto">Non trouvé dans le document</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Apply button */}
                                        <div className="flex gap-2">
                                            {applyConfirm !== doc.id ? (
                                                <button onClick={() => setApplyConfirm(doc.id)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition-transform">
                                                    <Sparkles size={14} className="text-yellow-300" /> Remplir le projet avec ces données
                                                </button>
                                            ) : (
                                                <div className="flex-1 bg-purple-100 rounded-xl p-3 border border-purple-300">
                                                    <p className="text-xs font-black text-purple-700 mb-2 flex items-center gap-1"><AlertCircle size={13} /> Confirmer le remplissage automatique ?</p>
                                                    <p className="text-[11px] text-purple-500 font-semibold mb-2">Les champs vides du projet seront complétés avec les données extraites.</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => applyAnalysis(doc)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><CheckCircle2 size={12} /> Oui, remplir</button>
                                                        <button onClick={() => setApplyConfirm(null)} className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200">Annuler</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {documents.length === 0 && (
                <div className="text-center py-6 mb-4">
                    <FileText size={40} className="text-purple-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-sm">Aucun document téléchargé</p>
                    <p className="text-slate-400 text-xs mt-1 text-center">Télécharge un PDF, Word ou photo pour démarrer</p>
                </div>
            )}

            {/* Coffre-fort indicator */}
            <div className="bg-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Lock size={18} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-white flex items-center gap-1"><ShieldCheck size={12} className="text-yellow-400" /> Coffre-fort numérique</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{documents.length} document{documents.length !== 1 ? "s" : ""} conservé{documents.length !== 1 ? "s" : ""} automatiquement</p>
                </div>
                <div className="bg-yellow-500/20 rounded-xl px-3 py-1.5">
                    <span className="text-yellow-400 font-black text-sm">{documents.length}</span>
                </div>
            </div>
        </div>
    );
}