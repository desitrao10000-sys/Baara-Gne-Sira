"use client";
import { useState } from "react";
import { Plus, X, Check, Wallet, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

interface CreditRow { id: string; designation: string; montant: number; }
interface PaymentRow { id: string; designation: string; montant: number; }
interface Portefeuille { total: number; }

interface Props {
    onValidate: (items: { designation: string; montant: number }[]) => void;
}

export default function EntryPaymentHelper({ onValidate }: Props) {
    const [showPC, setShowPC] = useState(false);
    const [showFP, setShowFP] = useState(false);

    // Paiement Client state
    const [credits, setCredits] = useState<CreditRow[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([]);

    // Fonds Portefeuille state
    const [selectedPF, setSelectedPF] = useState<number | null>(null);
    const [portefeuilles] = useState<Portefeuille[]>([
        { total: 0 }, { total: 0 }, { total: 0 }, { total: 0 }
    ]);
    const [pfTotals, setPfTotals] = useState([0, 0, 0, 0]);
    const [pfWithdraw, setPfWithdraw] = useState(0);
    const [pfWithdraws, setPfWithdraws] = useState([0, 0, 0, 0]);

    const uid = () => crypto.randomUUID();

    // Paiement Client totals
    const total1 = credits.reduce((s, c) => s + (c.montant || 0), 0);
    const total2Payments = payments.reduce((s, p) => s + (p.montant || 0), 0);

    // Portefeuille totals
    const total2PF = pfWithdraws.reduce((s, w) => s + w, 0);

    // Combined Total 2
    const total2Combined = total2Payments + total2PF;
    const totalGeneral = total2Combined - total1;

    // Validate: combine Total PC + Total FP, send to parent
    const handleValidate = () => {
        const items: { designation: string; montant: number }[] = [];

        // Paiement Client — Total général entrée
        if (showPC && total2Payments > 0) {
            items.push({ designation: "Paiement client", montant: total2Payments });
        }

        // Fonds Portefeuille — Total général entrée
        if (showFP && total2PF > 0) {
            pfWithdraws.forEach((w, i) => {
                if (w > 0) items.push({ designation: `Fonds Portefeuille ${i + 1}`, montant: w });
            });
        }

        if (items.length > 0) onValidate(items);
    };

    const updateCredit = (id: string, field: "designation" | "montant", val: string | number) => {
        setCredits(cs => cs.map(c => c.id === id ? { ...c, [field]: field === "montant" ? (parseFloat(String(val).replace(/\s/g, "").replace(",", ".")) || 0) : val } : c));
    };
    const updatePayment = (id: string, field: "designation" | "montant", val: string | number) => {
        setPayments(ps => ps.map(p => p.id === id ? { ...p, [field]: field === "montant" ? (parseFloat(String(val).replace(/\s/g, "").replace(",", ".")) || 0) : val } : p));
    };

    const confirmPFWithdraw = () => {
        if (selectedPF === null || pfWithdraw <= 0) return;
        const pfIdx = selectedPF;
        if (pfWithdraw > pfTotals[pfIdx] - pfWithdraws[pfIdx]) return;
        setPfWithdraws(ws => ws.map((w, i) => i === pfIdx ? w + pfWithdraw : w));
        setPfWithdraw(0);
    };

    const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

    const inputCls = "w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-blue-400";
    const amtCls = "w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-blue-400";

    return (
        <div className="space-y-2 mt-2">
            {/* Deux boutons */}
            <div className="flex gap-2">
                <button onClick={() => setShowPC(!showPC)} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${showPC ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                    <CreditCard size={14} /> Paiement Client
                </button>
                <button onClick={() => setShowFP(!showFP)} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${showFP ? "bg-amber-500 text-white border-amber-500" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    <Wallet size={14} /> Fonds Portefeuille
                </button>
            </div>

            {/* PAIEMENT CLIENT */}
            {showPC && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 space-y-3">
                    {/* État de crédit */}
                    <div>
                        <p className="text-[11px] font-black text-indigo-700 mb-2">📋 État de crédit</p>
                        <div className="space-y-1.5">
                            {credits.map(c => (
                                <div key={c.id} className="grid grid-cols-[1fr_100px_28px] gap-1.5 items-center">
                                    <input type="text" value={c.designation} onChange={e => updateCredit(c.id, "designation", e.target.value)} placeholder="Désignation..." className={inputCls} />
                                    <input type="text" inputMode="numeric" value={c.montant || ""} onChange={e => updateCredit(c.id, "montant", e.target.value)} placeholder="Crédit" className={amtCls} />
                                    <button onClick={() => setCredits(cs => cs.filter(x => x.id !== c.id))} className="p-1 rounded-lg bg-red-50" aria-label="Supprimer"><X size={12} className="text-red-400" /></button>
                                </div>
                            ))}
                            <button onClick={() => setCredits([...credits, { id: uid(), designation: "", montant: 0 }])} className="w-full py-1.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1">
                                <Plus size={12} /> Ajouter crédit
                            </button>
                        </div>
                        {credits.length > 0 && (
                            <div className="flex justify-between text-xs border-t border-indigo-200 pt-2 mt-2">
                                <span className="font-black text-indigo-700">Total 1 (Crédits)</span>
                                <span className="font-black text-red-600">{fmt(total1)} FCFA</span>
                            </div>
                        )}
                    </div>

                    {/* Paiement du jour */}
                    <div>
                        <p className="text-[11px] font-black text-indigo-700 mb-2">💰 Paiement du jour</p>
                        <div className="space-y-1.5">
                            {payments.map(p => (
                                <div key={p.id} className="grid grid-cols-[1fr_100px_28px] gap-1.5 items-center">
                                    <input type="text" value={p.designation} onChange={e => updatePayment(p.id, "designation", e.target.value)} placeholder="Désignation..." className={inputCls} />
                                    <input type="text" inputMode="numeric" value={p.montant || ""} onChange={e => updatePayment(p.id, "montant", e.target.value)} placeholder="Montant" className={amtCls} />
                                    <button onClick={() => setPayments(ps => ps.filter(x => x.id !== p.id))} className="p-1 rounded-lg bg-red-50" aria-label="Supprimer"><X size={12} className="text-red-400" /></button>
                                </div>
                            ))}
                            <button onClick={() => setPayments([...payments, { id: uid(), designation: "", montant: 0 }])} className="w-full py-1.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1">
                                <Plus size={12} /> Ajouter paiement
                            </button>
                        </div>
                        {payments.length > 0 && (
                            <div className="flex justify-between text-xs border-t border-indigo-200 pt-2 mt-2">
                                <span className="font-black text-indigo-700">Total 2 (Paiements)</span>
                                <span className="font-black text-green-700">+{fmt(total2Payments)} FCFA</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FONDS PORTEFEUILLE */}
            {showFP && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-3">
                    <p className="text-[11px] font-black text-amber-700 mb-2">📁 Choisir un portefeuille</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[0, 1, 2, 3].map(i => (
                            <button key={i} onClick={() => setSelectedPF(selectedPF === i ? null : i)}
                                className={`py-2 rounded-xl text-[11px] font-black border-2 transition-all ${selectedPF === i ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200"}`}>
                                P.{i + 1}
                            </button>
                        ))}
                    </div>

                    {selectedPF !== null && (
                        <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-amber-700">Portefeuille {selectedPF + 1} — Montant total</span>
                                <span className="font-black text-amber-800">{fmt(pfTotals[selectedPF])} FCFA</span>
                            </div>
                            <input type="text" inputMode="numeric"
                                value={pfTotals[selectedPF] || ""}
                                onChange={e => {
                                    const v = parseFloat(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0;
                                    setPfTotals(ts => ts.map((t, idx) => idx === selectedPF ? v : t));
                                }}
                                placeholder="Définir le montant total du portefeuille"
                                className={amtCls} />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Déjà retiré</span>
                                <span className="font-bold">{fmt(pfWithdraws[selectedPF])} FCFA</span>
                            </div>
                            <div className="flex gap-1.5 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-amber-600 block mb-0.5">Montant à retirer</label>
                                    <input type="text" inputMode="numeric" value={pfWithdraw || ""} onChange={e => setPfWithdraw(parseFloat(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0)} placeholder="0" className={amtCls} />
                                </div>
                                <button onClick={confirmPFWithdraw} disabled={pfWithdraw <= 0} title="Confirmer le retrait" className={`px-3 py-2 rounded-xl text-xs font-bold ${pfWithdraw > 0 ? "bg-amber-500 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}>
                                    <Check size={14} />
                                </button>
                            </div>
                            <div className="flex justify-between text-xs border-t border-amber-200 pt-2">
                                <span className="font-black text-amber-700">Nouveau solde</span>
                                <span className={`font-black ${pfTotals[selectedPF] - pfWithdraws[selectedPF] >= 0 ? "text-green-700" : "text-red-600"}`}>
                                    {fmt(pfTotals[selectedPF] - pfWithdraws[selectedPF])} FCFA
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Résumé portefeuilles */}
                    {pfWithdraws.some(w => w > 0) && (
                        <div className="space-y-1">
                            {pfWithdraws.map((w, i) => w > 0 ? (
                                <div key={i} className="flex justify-between text-xs bg-white rounded-lg p-2 border border-amber-200">
                                    <span className="font-bold text-amber-700">Portefeuille {i + 1}</span>
                                    <span className="font-black text-green-700">+{fmt(w)} FCFA</span>
                                </div>
                            ) : null)}
                            <div className="flex justify-between text-xs border-t border-amber-300 pt-1">
                                <span className="font-black text-amber-800">Paiement du jour</span>
                                <span className="font-black text-green-700">+{fmt(total2PF)} FCFA</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* RÉSUMÉ GLOBAL — Total général entrée */}
            {(showPC || showFP) && (credits.length > 0 || payments.length > 0 || pfWithdraws.some(w => w > 0)) && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-300 space-y-1">
                    {showPC && total1 > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-600">Total 1 (Crédits clients)</span>
                            <span className="font-black text-red-600">{fmt(total1)} FCFA</span>
                        </div>
                    )}
                    {total2Payments > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-indigo-600">→ Paiement client</span>
                            <span className="font-black text-green-700">+{fmt(total2Payments)} FCFA</span>
                        </div>
                    )}
                    {total2PF > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-amber-600">→ Fonds portefeuille</span>
                            <span className="font-black text-green-700">+{fmt(total2PF)} FCFA</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-slate-300 pt-2">
                        <span className="font-black text-slate-800">Total général entrée</span>
                        <span className="font-black text-green-700 text-base">+{fmt(total2Combined)} FCFA</span>
                    </div>
                    {showPC && total1 > 0 && (() => {
                        const creditRestant = total1 - total2Combined;
                        return (
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                                <span className="font-black text-slate-800">Total crédit restant</span>
                                <span className={`font-black ${creditRestant > 0 ? "text-red-600" : "text-green-700"}`}>
                                    {creditRestant > 0 ? fmt(creditRestant) : "0"} FCFA
                                </span>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}