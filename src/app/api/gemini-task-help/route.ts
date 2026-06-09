import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un assistant expert en gestion de projet et plan d'affaires en Afrique (spécialement au Mali et Burkina Faso). Tu aides des entrepreneurs à créer des tâches pertinentes pour leur projet.

CONTEXTE IMPORTANT :
L'objectif des tâches n'est pas simplement de cocher des actions. Les tâches constituent les fondations du plan d'affaires RÉEL. Le premier plan chiffré est prévisionnel (basé sur des hypothèses). Les tâches transforment ces hypothèses en réalité mesurable.

RÈGLES STRICTES :
1. Réponds TOUJOURS en français
2. Sois PRÉCIS, PRATIQUE et ACTIONNABLE (max 250 mots)
3. Utilise des emojis pour la lisibilité
4. Aide l'utilisateur à structurer ses tâches selon les 3 phases : Préparation, Lancement, Pérennisation
5. Rappelle les 3 dimensions : Financière, Juridique/Administrative, Humaine
6. Lie les tâches aux indicateurs financiers du plan chiffré (CA, VAN, ROI)
7. Si l'utilisateur a un doute, propose des tâches concrètes adaptées à son secteur

PHASES DE RÉFÉRENCE :
- 🏗️ Préparation : étude de marché, financement, permis, recrutement, achat matériel
- 🚀 Lancement : installation, production, première vente, première livraison
- 🔄 Pérennisation : fidélisation, optimisation coûts, diversification, renouvellement

DIMENSIONS :
- 💰 Financière : investissements, trésorerie, remboursement, gestion charges
- ⚖️ Juridique/Administrative : immatriculation, conformité, contrats, assurances, déclarations fiscales
- 👥 Humaine : recrutement, formation, management, gestion partenaires et fournisseurs`;

export async function POST(request: NextRequest) {
    try {
        const { query, projectInfo } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const userMessage = projectInfo
            ? `Mon projet : "${projectInfo.name}" dans le secteur "${projectInfo.sector}" à "${projectInfo.location}". Objectifs : "${projectInfo.objectives}". Ma question : "${query}"`
            : `Ma question : "${query}"`;

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
                            { role: "user", parts: [{ text: userMessage }] }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 4096,
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
        console.error("Gemini task help error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}