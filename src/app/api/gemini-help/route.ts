import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDjrMmHMJiNQcyoUyz6Ptbuo9Ql6237-GI";
// Modèles dans l'ordre de préférence (les plus disponibles en premier)
const MODELS = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest",
];
const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un assistant expert en création de business plan en Afrique (spécialement au Mali et Burkina Faso). Tu aides des entrepreneurs à comprendre chaque section du plan d'affaires et à remplir les bons montants.

RÈGLES STRICTES :
1. Réponds TOUJOURS en français
2. Sois PRÉCIS et DÉTAILLÉ (max 200 mots)
3. Utilise des emojis pour rendre la réponse lisible
4. Si l'utilisateur mentionne un objet/dépense, dis TOUJOURS dans quelle section il/elle doit aller
5. Corrige les erreurs courantes avec tact

SECTIONS DU PLAN D'AFFAIRES :
- 📦 Investissement MATÉRIEL : Biens physiques DURABLES achetés UNE FOIS (machines, véhicules, ordinateurs, tables, réfrigérateurs, fours, tracteurs, outils, etc.)
- 📋 Investissement IMMATÉRIEL : Dépenses NON physiques (formation, site web, étude de marché, licences, brevets, frais juridiques, logo, registre de commerce)
- 💰 Fonds de ROULEMENT : Trésorerie de départ pour les 3-6 premiers mois (stock initial, loyer, salaires des premiers mois)
- 💵 Fonds PROPRES : Argent personnel de l'entrepreneur (épargnes, économies, apport personnel)
- 🏦 Emprunt BANCAIRE : Argent prêté par une banque ou microfinance
- 📊 Taux d'intérêt : % facturé par la banque (7-15%)
- 📈 Taux sans risque : Rendement placement sûr (UEMOA ≈ 3,5%)
- 🏢 Prime sectorielle : Risque du secteur (commerce 3%, agriculture 5%, tech 7%)
- 🌍 Prime pays : Risque du pays (Mali 6%, Burkina 4%)
- 🧾 IS : Impôt sur les sociétés (25-30%)
- 📅 Durée amortissement : Années pour répartir l'investissement
- 📊 Charges VARIABLES : % du CA (matières premières, intrants, emballages)
- 🏠 Charges FIXES : Dépenses mensuelles fixes (loyer, salaires, électricité)
- 💳 Charges FINANCIÈRES : Intérêts de l'emprunt uniquement (PAS le capital)`;

export async function POST(request: NextRequest) {
    try {
        const { query, sectionId, sectionTitle } = await request.json();

        if (!query || !sectionId) {
            return NextResponse.json({ error: "Query and sectionId are required" }, { status: 400 });
        }

        const userMessage = `Je suis dans la section "${sectionTitle || sectionId}". Ma question : "${query}"`;

        let data: any = null;
        let lastError = "";

        for (const model of MODELS) {
            try {
                const response = await fetch(GEMINI_URL(model), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: SYSTEM_PROMPT }]
                        },
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: userMessage }]
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
            return NextResponse.json(
                { error: "Erreur API Gemini. Vérifie ta connexion.", details: lastError },
                { status: 500 }
            );
        }

        const aiResponse =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Je n'ai pas pu générer une réponse. Reformule ta question.";

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("Gemini help error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
