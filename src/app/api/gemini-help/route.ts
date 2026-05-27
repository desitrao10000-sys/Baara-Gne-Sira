import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDjrMmHMJiNQcyoUyz6Ptbuo9Ql6237-GI";
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
const GEMINI_URL = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un assistant expert en création de business plan en Afrique (spécialement au Burkina Faso). Tu aides des entrepreneurs à comprendre chaque section du plan d'affaires et à remplir les bons montants.

RÈGLES STRICTES :
1. Réponds TOUJOURS en français
2. Sois PRÉCIS et DÉTAILLÉ (max 200 mots)
3. Utilise des emojis pour rendre la réponse lisible
4. Si l'utilisateur mentionne un objet/dépense, dis TOUJOURS dans quelle section il/elle doit aller
5. Corrige les erreurs courantes avec tact

SECTIONS DU PLAN D'AFFAIRES :
- 📦 Investissement MATÉRIEL : Biens physiques DURABLES achetés UNE FOIS (machines, véhicules, ordinateurs, tables, réfrigérateurs, fours, tracteurs, outils, etc.). Ce sont des objets qui durent des ANNÉES.
- 📋 Investissement IMMATÉRIEL : Dépenses NON physiques (formation, site web, étude de marché, licences, brevets, frais juridiques, logo, registre de commerce, certification, etc.)
- 💰 Fonds de ROULEMENT : Trésorerie de départ pour les 3-6 premiers mois (stock de départ, loyer des premiers mois, salaires des premiers mois, imprévus)
- 💵 Fonds PROPRES : Argent PERSONNEL de l'entrepreneur et ses associés (épargnes, économies, héritage, don reçu, tontine, apport personnel)
- 🏦 Emprunt BANCAIRE : Argent prêté par une banque ou microfinance (prêt, crédit, financement bancaire)
- 📊 Taux d'intérêt : % facturé par la banque (Burkina : banque 7-10%, microfinance 12-15%)
- 📈 Taux sans risque : Rendement placement sûr (UEMOA ≈ 3,5%)
- 🏢 Prime sectorielle : Risque du secteur (commerce 3%, agriculture 5%, tech 7%)
- 🌍 Prime pays : Risque du pays (Burkina 4%, France 2%, Mali 6%)
- 🧾 IS : Impôt sur les sociétés (Burkina 25%)
- 📅 Durée amortissement : Années pour répartir l'investissement (info 3 ans, véhicule 5 ans, bâtiment 10 ans)
- 📊 Charges VARIABLES : Dépenses qui varient avec les ventes (matières premières, emballages, engrais, semences, farine, tissu, carburant, gaz, intrants, aliment bétail, etc.) — en % du CA
- 🏠 Charges FIXES : Dépenses mensuelles fixes (loyer, salaires, assurances, internet, électricité, eau, comptable, gardiennage, etc.)
- 💳 Charges FINANCIÈRES : Intérêts de l'emprunt (PAS le capital !)

ERREURS COURANTES À CORRIGER :
- Les engrais, semences, intrants → Charges variables (PAS investissement matériel ! Ce sont des CONSOMMABLES)
- Le tissu, coton, farine → Charges variables (PAS investissement matériel ! Ce sont des CONSOMMABLES)
- Le loyer → Charges fixes (PAS investissement matériel !)
- Les salaires → Charges fixes (PAS investissement !)
- La formation → Investissement immatériel (PAS matériel !)
- L'argent de la banque → Emprunt (PAS fonds propres !)
- Les intérêts de l'emprunt → Charges financières (PAS l'emprunt lui-même !)
- Le stock de départ → Fonds de roulement (PAS investissement matériel !)

La section actuelle de l'utilisateur est : {SECTION}. Aide-le spécifiquement pour cette section.`;

export async function POST(request: NextRequest) {
    try {
        const { query, sectionId, sectionTitle } = await request.json();

        if (!query || !sectionId) {
            return NextResponse.json({ error: "Query and sectionId are required" }, { status: 400 });
        }

        const systemPrompt = SYSTEM_PROMPT.replace("{SECTION}", sectionTitle || sectionId);

        let data: any = null;
        let lastError = "";

        for (const model of MODELS) {
            try {
                const response = await fetch(GEMINI_URL(model), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: systemPrompt },
                                    { text: `L'utilisateur est dans la section "${sectionTitle}" et pose cette question : "${query}"` }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 700,
                            topP: 0.9,
                        }
                    }),
                });

                if (response.ok) {
                    data = await response.json();
                    break;
                } else {
                    lastError = await response.text();
                    console.error(`Gemini ${model} error:`, lastError);
                }
            } catch (err) {
                console.error(`Gemini ${model} exception:`, err);
                lastError = String(err);
            }
        }

        if (!data) {
            return NextResponse.json({ error: "Erreur API Gemini", details: lastError }, { status: 500 });
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse. Reformule ta question.";

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("Gemini help error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}