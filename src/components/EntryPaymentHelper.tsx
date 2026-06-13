"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, X, Check, Wallet, CreditCard, History, RotateCcw } from "lucide-react";
import { PaymentHistoryEntry } from "@/lib/useSupabaseProjects";

interface CreditRow { id: string; designation: string; montant: number; }
interface PaymentRow { id: string; designation: string; montant: number; }

interface Props {
    onValidate: (items: { designation: string; montant: number }[]) => void;
    initialItems?: { designation: string; montant: number }[];
    history?: PaymentHistoryEntry[];
    onHistoryChange?: (history: PaymentHistoryEntry[]) => void;
}

export default function EntryPaymentHelper({ onValidate, initialItems, history = [], onHistoryChange }: Props) {
    const [showPC, setShowPC] = useState(false);
    const [showFP, setShowFP] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [credits, setCredits] = useState<CreditRow[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [selectedPF, setSelectedPF] = useState<number | null>(null);
    const [pfTotals, setPfTotals] = useState([0, 0, 0, 0]);
    const [pfWithdraw, setPfWithdraw] = useState(0);
    const [pfWithdraws, setPfWithdraws] = useState([0, 0, 0, 0]);
    const initialized = useRef(false);
    const oldValRef = useRef<Record<string, number>>({});
    const focusVal = (id: string, val: number) => { oldValRef.current[id] = val; };

    const newSession = () => {
        setCredits([]);
        setPayments([]);
        setPfWithdraws([0, 0, 0, 0]);
        setPfWithdraw(0);
        setSelectedPF(null);
    };

    const addHistory = (type: PaymentHistoryEntry["type"], label: string, montant: number, details?: string, designation?: string) => {
        if (!onHistoryChange) return;
        const totalEntree = (payments.reduce((s, p) => s + (p.montant || 0), 0)) + (pfWithdraws.reduce((s, w) => s + w, 0));
        onHistoryChange([...history, { id: crypto.randomUUID(), date: new Date().toISOString(), type, label, montant, designation, soldeAfter: totalEntree + (montant > 0 ? montant : 0), details }]);
    };

    useEffect(() => {
        if (initialized.current || !initialItems || initialItems.length === 0) return;
        initialized.current = true;
        let restoredPayments = 0;
        const restoredWithdraws = [0, 0, 0, 0];
        initialItems.forEach(item => {
            if (item.designation === "Paiement client" && item.montant > 0) restoredPayments += item.montant;
            else if (item.designation.startsWith("Fonds Portefeuille ") && item.montant > 0) {
                const idx = parseInt(item.designation.replace("Fonds Portefeuille ", "")) - 1;
                if (idx >= 0 && idx < 4) restoredWithdraws[idx] = item.montant;
            }
        });
        if (restoredPayments > 0) { setPayments([{ id: crypto.randomUUID(), designation: "Paiement client restauré", montant: restoredPayments }]); setShowPC(true); }
        if (restoredWithdraws.some(w => w > 0)) { setPfWithdraws(restoredWithdraws); setShowFP(true); }
    }, [initialItems]);

    const uid = () => crypto.randomUUID();
    const total1 = credits.reduce((s, c) => s + (c.montant || 0), 0);
    const total2Payments = payments.reduce((s, p) => s + (p.montant || 0), 0);
    const total2PF = pfWithdraws.reduce((s, w) => s + w, 0);

    useEffect(() => {
        const items: { designation: string; montant: number }[] = [];
        if (total2Payments > 0) items.push({ designation: "Paiement client", montant: total2Payments });
        if (total2PF > 0) pfWithdraws.forEach((w, i) => { if (w > 0) items.push({ designation: `Fonds Portefeuille ${i + 1}`, montant: w }); });
        if (items.length > 0) onValidate(items);
    }, [total2Payments, total2PF, pfWithdraws]);

    const updateCredit = (id: string, field: "designation" | "montant", val: string | number) => {
        setCredits(cs => cs.map(c => c.id === id ? { ...c, [field]: field === "montant" ? (parseFloat(String(val).replace(/\s/g, "").replace(",", ".")) || 0) : val } : c));
    };
    const updatePayment = (id: string, field: "designation" | "montant", val: string | number) => {
        setPayments(ps => ps.map(p => p.id === id ? { ...p, [field]: field === "montant" ? (parseFloat(String(val).replace(/\s/g, "").replace(",", ".")) || 0) : val } : p));
    };

    const confirmPFWithdraw = () => {
        if (selectedPF === null || pfWithdraw <= 0) return;
        if (pfWithdraw > pfTotals[selectedPF] - pfWithdraws[selectedPF]) return;
        addHistory("retrait_pf", `Retrait Portefeuille ${selectedPF + 1}`, pfWithdraw, undefined, `Portefeuille ${selectedPF + 1}`);
        setPfWithdraws(ws => ws.map((w, i) => i === selectedPF ? w + pfWithdraw : w));
        setPfWithdraw(0);
    };

    const removePayment = (id: string) => {
        const p = payments.find(x => x.id === id);
        if (p && p.montant > 0) addHistory("paiement", `Suppression paiement`, -p.montant, undefined, p.designation);
        setPayments(ps => ps.filter(x => x.id !== id));
    };
    const removeCredit = (id: string) => {
        const c = credits.find(x => x.id === id);
        if (c && c.montant > 0) addHistory("credit", `Suppression crédit`, -c.montant, undefined, c.designation);
        setCredits(cs => cs.filter(x => x.id !== id));
    };
    const commitPaymentAmount = (id: string, oldVal: number) => {
        const p = payments.find(x => x.id === id);
        if (p && p.montant !== oldVal && p.montant > 0) {
            const label = oldVal > 0 ? "Modification paiement client" : "Nouveau paiement client";
            addHistory("paiement", label, p.montant - oldVal, oldVal > 0 ? `Ancien: ${fmt(oldVal)} FCFA → Nouveau: ${fmt(p.montant)} FCFA` : `Montant: ${fmt(p.montant)} FCFA`, p.designation);
        }
    };
    const commitCreditAmount = (id: string, oldVal: number) => {
        const c = credits.find(x => x.id === id);
        if (c && c.montant !== oldVal && c.montant > 0) {
            const label = oldVal > 0 ? "Modification crédit client" : "Nouveau crédit client";
            addHistory("credit", label, c.montant - oldVal, oldVal > 0 ? `Ancien: ${fmt(oldVal)} FCFA → Nouveau: ${fmt(c.montant)} FCFA` : `Montant: ${fmt(c.montant)} FCFA`, c.designation);
        }
    };

    const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };
    const fmtTime = (d: string) => { try { return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch { return ""; } };
    const fmtDateTime = (d: string) => `${fmtDate(d)} à ${fmtTime(d)}`;
    const fmtDay = (d: string) => { try { return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); } catch { return fmtDate(d); } };
    const inputCls = "w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-blue-400";
    const amtCls = "w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:border-blue-400";

    const renderHistoryBlock = (title: string, icon: string, entries: PaymentHistoryEntry[], bgHeader: string, textColor: string) => {
        if (entries.length === 0) {
            return (
                <div className="rounded-xl p-3 border border-slate-200 bg-white">
                    <p className={`text-[11px] font-black ${textColor} flex items-center gap-1 mb-2`}>{icon} {title}</p>
                    <p className="text-[10px] text-slate-400 text-center py-2 font-semibold">Aucune transaction</p>
                </div>
            );
        }
        const totalIn = entries.filter(h => h.montant > 0).reduce((s, h) => s + h.montant, 0);
        // Trier du plus ancien au plus récent, puis regrouper paiements et crédits
        const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const dayMap = new Map<string, PaymentHistoryEntry[]>();
        sortedEntries.forEach(entry => {
            const dayKey = fmtDay(entry.date);
            if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
            dayMap.get(dayKey)!.push(entry);
        });
        // Dans chaque jour, regrouper par type: paiements ensemble, crédits ensemble
        dayMap.forEach(dayEntries => {
            dayEntries.sort((a, b) => {
                const typeOrder: Record<string, number> = { paiement: 0, credit: 1, retrait_pf: 2 };
                const diff = (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
                if (diff !== 0) return diff;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
        });
        return (
            <div className="rounded-xl p-3 border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-black ${textColor} flex items-center gap-1`}>{icon} {title}</p>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{entries.length}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                    {Array.from(dayMap.entries()).map(([dayLabel, dayEntries]) => (
                        <div key={dayLabel} className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-[9px] font-black text-slate-400 uppercase px-1.5">{dayLabel}</span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            {dayEntries.map(entry => {
                                const isPositive = entry.montant >= 0;
                                const isCredit = entry.type === "credit";
                                let actionLabel = "";
                                if (isCredit) {
                                    actionLabel = isPositive
                                        ? "Crédit client enregistré (somme due par le client, pas encore reçue)"
                                        : "Crédit client supprimé ou réduit (annulation de la dette)";
                                } else if (entry.type === "retrait_pf") {
                                    actionLabel = isPositive
                                        ? `${fmt(entry.montant)} FCFA retiré du ${entry.designation || "Portefeuille"}`
                                        : `Retrait annulé sur le ${entry.designation || "Portefeuille"}`;
                                } else {
                                    actionLabel = isPositive
                                        ? "Paiement client reçu (argent effectivement reçu du client pour un produit/service)"
                                        : "Paiement client supprimé ou remboursé (sortie d'argent)";
                                }
                                return (
                                    <div key={entry.id} className={`rounded-lg p-2.5 border ${isCredit ? (isPositive ? "bg-orange-50 border-orange-200" : "bg-orange-50 border-orange-200") : (isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")} space-y-1.5`}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-black ${isCredit ? "text-orange-700" : "text-slate-700"}`}>{actionLabel}</p>
                                                {!isCredit && entry.type !== "retrait_pf" && entry.designation && <p className="text-[10px] font-semibold text-slate-500 mt-0.5">📌 Désignation: {entry.designation}</p>}
                                            </div>
                                            <span className={`text-[11px] font-black shrink-0 ${isCredit ? "text-orange-700" : (isPositive ? "text-green-700" : "text-red-600")}`}>
                                                {isCredit ? "💳" : (isPositive ? "+" : "-")}{fmt(Math.abs(entry.montant))} FCFA
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold">
                                            <span>🕐 {fmtTime(entry.date)}</span>
                                        </div>
                                        {entry.details && <p className="text-[9px] text-slate-500 bg-white/70 rounded px-1.5 py-0.5 font-medium">{entry.details}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                    {entries.some(e => e.type === "credit") ? (
                        <>
                            <div className="text-center bg-orange-50 rounded-lg py-1">
                                <p className="text-[9px] font-black text-orange-700 uppercase">Crédits total client enregistrés</p>
                                <p className="text-[11px] font-black text-orange-700">💳 {fmt(entries.filter(e => e.type === "credit" && e.montant > 0).reduce((s, e) => s + e.montant, 0))} FCFA</p>
                            </div>
                            <div className="text-center bg-green-50 rounded-lg py-1">
                                <p className="text-[9px] font-black text-green-700 uppercase">Paiement total client reçues</p>
                                <p className="text-[11px] font-black text-green-700">+{fmt(entries.filter(e => e.type === "paiement" && e.montant > 0).reduce((s, e) => s + e.montant, 0))} FCFA</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center bg-green-50 rounded-lg py-1 col-span-2">
                            <p className="text-[9px] font-black text-green-700 uppercase">Total reçu (entrées budget prévisionnel)</p>
                            <p className="text-[11px] font-black text-green-700">+{fmt(totalIn)} FCFA</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderHistorySection = () => {
        if (!showHistory) return null;
        const pcEntries = history.filter(h => h.type === "credit" || h.type === "paiement");
        const fpEntries = history.filter(h => h.type === "retrait_pf");
        const allTotalIn = history.filter(h => h.montant > 0).reduce((s, h) => s + h.montant, 0);
        const allTotalOut = history.filter(h => h.montant < 0).reduce((s, h) => s + Math.abs(h.montant), 0);
        return (
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-300 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><History size={14} className="text-slate-600" /> Historique des transactions</p>
                    {history.length > 0 && <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{history.length}</span>}
                </div>
                {history.length === 0 ? (
                    <div className="text-center py-6 space-y-1">
                        <History size={24} className="text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-400 font-bold">Aucune transaction enregistrée</p>
                        <p className="text-[10px] text-slate-300">Les paiements et retraits apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {renderHistoryBlock("Historique — Fonds Portefeuille", "📁", fpEntries, "bg-amber-50", "text-amber-700")}
                        {renderHistoryBlock("Historique — Paiement Client", "💰", pcEntries, "bg-indigo-50", "text-indigo-700")}
                    </div>
                )}
                {history.length > 0 && (() => {
                    const creditTotalEnregistres = history.filter(h => h.type === "credit" && h.montant > 0).reduce((s, h) => s + h.montant, 0);
                    const paiementTotalRecus = history.filter(h => h.type === "paiement" && h.montant > 0).reduce((s, h) => s + h.montant, 0);
                    const creditRestant = Math.max(0, total1 - total2Payments);
                    const creditsRegles = creditRestant === 0 ? creditTotalEnregistres : Math.max(0, creditTotalEnregistres - creditRestant);
                    const totalGeneralEntree = total2Payments + total2PF;
                    return (
                        <div className="bg-white rounded-xl p-3 border-2 border-slate-200">
                            <p className="text-[10px] font-black text-slate-700 uppercase text-center mb-2">Résumé général</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center bg-green-50 rounded-lg py-1.5">
                                    <p className="text-[9px] font-black text-green-700 uppercase">Total général entrées</p>
                                    <p className="text-[11px] font-black text-green-700">+{fmt(totalGeneralEntree)} FCFA</p>
                                </div>
                                <div className="text-center bg-orange-50 rounded-lg py-1.5">
                                    <p className="text-[9px] font-black text-orange-700 uppercase">Crédit total client enregistrés</p>
                                    <p className="text-[11px] font-black text-orange-700">💳 {fmt(creditTotalEnregistres)} FCFA</p>
                                </div>
                                <div className="text-center bg-blue-50 rounded-lg py-1.5">
                                    <p className="text-[9px] font-black text-blue-700 uppercase">Crédits clients réglés</p>
                                    <p className="text-[11px] font-black text-blue-700">✅ {fmt(creditsRegles)} FCFA</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    };

    return (
        <div className="space-y-2 mt-2">
            <div className="flex gap-2">
                <button onClick={() => setShowPC(!showPC)} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${showPC ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                    <CreditCard size={14} /> Paiement Client
                </button>
                <button onClick={() => setShowFP(!showFP)} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${showFP ? "bg-amber-500 text-white border-amber-500" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    <Wallet size={14} /> Fonds Portefeuille
                </button>
                <button onClick={() => setShowHistory(!showHistory)} title="Historique des transactions" className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-2 transition-all ${showHistory ? "bg-slate-700 text-white border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    <History size={14} />
                </button>
            </div>

            {showPC && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 space-y-3">
                    <div>
                        <p className="text-[11px] font-black text-indigo-700 mb-2">📋 État de crédit</p>
                        <div className="space-y-1.5">
                            {credits.map(c => (
                                <div key={c.id} className="grid grid-cols-[1fr_100px_28px] gap-1.5 items-center">
                                    <input type="text" value={c.designation} onChange={e => updateCredit(c.id, "designation", e.target.value)} placeholder="Désignation..." className={inputCls} />
                                    <input type="text" inputMode="numeric" value={c.montant || ""} onChange={e => updateCredit(c.id, "montant", e.target.value)} onFocus={() => focusVal(c.id, c.montant)} onBlur={() => commitCreditAmount(c.id, oldValRef.current[c.id] ?? 0)} placeholder="Crédit" className={amtCls} />
                                    <button onClick={() => removeCredit(c.id)} className="p-1 rounded-lg bg-red-50" aria-label="Supprimer"><X size={12} className="text-red-400" /></button>
                                </div>
                            ))}
                            <button onClick={() => setCredits([...credits, { id: uid(), designation: "", montant: 0 }])} className="w-full py-1.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1"><Plus size={12} /> Ajouter crédit</button>
                        </div>
                        {credits.length > 0 && (<div className="flex justify-between text-xs border-t border-indigo-200 pt-2 mt-2"><span className="font-black text-indigo-700">Total 1 (Crédits)</span><span className="font-black text-red-600">{fmt(total1)} FCFA</span></div>)}
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-indigo-700 mb-2">💰 Paiement du jour</p>
                        <div className="space-y-1.5">
                            {payments.map(p => (
                                <div key={p.id} className="grid grid-cols-[1fr_100px_28px] gap-1.5 items-center">
                                    <input type="text" value={p.designation} onChange={e => updatePayment(p.id, "designation", e.target.value)} placeholder="Désignation..." className={inputCls} />
                                    <input type="text" inputMode="numeric" value={p.montant || ""} onChange={e => updatePayment(p.id, "montant", e.target.value)} onFocus={() => focusVal(p.id, p.montant)} onBlur={() => commitPaymentAmount(p.id, oldValRef.current[p.id] ?? 0)} placeholder="Montant" className={amtCls} />
                                    <button onClick={() => removePayment(p.id)} className="p-1 rounded-lg bg-red-50" aria-label="Supprimer"><X size={12} className="text-red-400" /></button>
                                </div>
                            ))}
                            <button onClick={() => setPayments([...payments, { id: uid(), designation: "", montant: 0 }])} className="w-full py-1.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1"><Plus size={12} /> Ajouter paiement</button>
                        </div>
                        {payments.length > 0 && (<div className="flex justify-between text-xs border-t border-indigo-200 pt-2 mt-2"><span className="font-black text-indigo-700">Total 2 (Paiements)</span><span className="font-black text-green-700">+{fmt(total2Payments)} FCFA</span></div>)}
                    </div>
                </div>
            )}

            {(showPC || showFP) && (credits.length > 0 || payments.length > 0 || pfWithdraws.some(w => w > 0)) && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-300 space-y-1">
                    {showPC && total1 > 0 && (<div className="flex justify-between text-xs"><span className="font-bold text-slate-600">Total 1 (Crédits clients)</span><span className="font-black text-red-600">{fmt(total1)} FCFA</span></div>)}
                    {total2Payments > 0 && (<div className="flex justify-between text-xs"><span className="font-bold text-indigo-600">→ Paiement client</span><span className="font-black text-green-700">+{fmt(total2Payments)} FCFA</span></div>)}
                    {total2PF > 0 && (<div className="flex justify-between text-xs"><span className="font-bold text-amber-600">→ Fonds portefeuille</span><span className="font-black text-green-700">+{fmt(total2PF)} FCFA</span></div>)}
                    {showPC && total1 > 0 && (() => { const r = total1 - total2Payments; return (<div className="flex justify-between text-sm border-t border-slate-300 pt-2"><span className="font-black text-slate-800">Total crédit restant</span><span className={`font-black ${r > 0 ? "text-red-600" : "text-green-700"}`}>{r > 0 ? fmt(r) : "0"} FCFA</span></div>); })()}
                    {(() => { const t = total2Payments + total2PF; return t > 0 ? (<div className="flex justify-between text-sm border-t border-slate-200 pt-2"><span className="font-black text-slate-800">Total général entrée</span><span className="font-black text-green-700 text-base">+{fmt(t)} FCFA</span></div>) : null; })()}
                    <button onClick={newSession} className="w-full mt-2 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-indigo-100 text-indigo-700 border-2 border-dashed border-indigo-300 hover:bg-indigo-200 transition-all">
                        <RotateCcw size={12} /> Nouvelle saisie (vider les champs)
                    </button>
                </div>
            )}

            {showFP && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-3">
                    <p className="text-[11px] font-black text-amber-700 mb-2">📁 Choisir un portefeuille</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[0, 1, 2, 3].map(i => (<button key={i} onClick={() => setSelectedPF(selectedPF === i ? null : i)} className={`py-2 rounded-xl text-[11px] font-black border-2 transition-all ${selectedPF === i ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200"}`}>P.{i + 1}</button>))}
                    </div>
                    {selectedPF !== null && (
                        <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-2">
                            <div className="flex justify-between text-xs"><span className="font-bold text-amber-700">Portefeuille {selectedPF + 1} — Montant total</span><span className="font-black text-amber-800">{fmt(pfTotals[selectedPF])} FCFA</span></div>
                            <input type="text" inputMode="numeric" value={pfTotals[selectedPF] || ""} onChange={e => { const v = parseFloat(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0; setPfTotals(ts => ts.map((t, idx) => idx === selectedPF ? v : t)); }} placeholder="Définir le montant total du portefeuille" className={amtCls} />
                            <div className="flex justify-between text-xs text-slate-500"><span>Déjà retiré</span><span className="font-bold">{fmt(pfWithdraws[selectedPF])} FCFA</span></div>
                            <div className="flex gap-1.5 items-end">
                                <div className="flex-1"><label className="text-[10px] font-bold text-amber-600 block mb-0.5">Montant à retirer</label><input type="text" inputMode="numeric" value={pfWithdraw || ""} onChange={e => setPfWithdraw(parseFloat(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0)} placeholder="0" className={amtCls} /></div>
                                <button onClick={confirmPFWithdraw} disabled={pfWithdraw <= 0} title="Confirmer le retrait" className={`px-3 py-2 rounded-xl text-xs font-bold ${pfWithdraw > 0 ? "bg-amber-500 text-white active:scale-95" : "bg-slate-100 text-slate-400"}`}><Check size={14} /></button>
                            </div>
                            <div className="flex justify-between text-xs border-t border-amber-200 pt-2"><span className="font-black text-amber-700">Nouveau solde</span><span className={`font-black ${pfTotals[selectedPF] - pfWithdraws[selectedPF] >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(pfTotals[selectedPF] - pfWithdraws[selectedPF])} FCFA</span></div>
                        </div>
                    )}
                    {pfWithdraws.some(w => w > 0) && (
                        <div className="space-y-1">
                            {pfWithdraws.map((w, i) => w > 0 ? (<div key={i} className="flex justify-between text-xs bg-white rounded-lg p-2 border border-amber-200"><span className="font-bold text-amber-700">Portefeuille {i + 1}</span><span className="font-black text-green-700">+{fmt(w)} FCFA</span></div>) : null)}
                            <div className="flex justify-between text-xs border-t border-amber-300 pt-1"><span className="font-black text-amber-800">Paiement du jour</span><span className="font-black text-green-700">+{fmt(total2PF)} FCFA</span></div>
                        </div>
                    )}
                </div>
            )}

            {renderHistorySection()}
        </div>
    );
}