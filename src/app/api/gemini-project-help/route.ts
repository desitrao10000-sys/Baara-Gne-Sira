import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDjrMmHMJiNQcyoUyz6Ptbuo9Ql6237-GI";
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
const GEMINI_URL = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un assistant expert en création de projets entrepreneuriaux en Afrique (spécialement au Burkina Faso). Tu aides des entrepreneurs à bien remplir les informations de leur projet.

RÈGLES STRICTES :
1. Réponds TOUJOURS en français
2. Sois PRÉCIS et CONCIS (max 150 mots)
3. Utilise des emojis pour rendre la réponse lisible
4. Donne des exemples concrets adaptés au contexte africain (Burkina Faso)

SECTIONS DU PROJET :
- 📛 Nom du projet : Le nom commercial de ton activité. Doit être court, mémorable et professionnel. Ex: "Djiguifa Commerce", "Sahel Agro", "Burkina Tech Solutions"
- 🏢 Secteur d'activité : Le domaine principal de ton activité (commerce, agriculture, service, industrie, élevage, artisanat, transport, technologie, santé, éducation, restauration, bâtiment)
- 📍 Localisation : La ville ou le quartier où se trouve ton activité. Ex: "Ouagadougou, secteur 15" ou "Bobo-Dioulasso, Hamdallaye"
- 🌍 Zone d'intervention : La zone géographique couverte par ton activité. Ex: "Région du Centre", "Tout le Burkina Faso", "Afrique de l'Ouest"
- 📅 Date de démarrage : La date prévue de lancement de l'activité
- ⏱ Durée prévue : La durée estimée du projet. Ex: "1 an", "3 ans", "5 ans", "10 ans"
- 📝 Description : Une description détaillée de ton activité (ce que tu fais, comment tu le fais, pour qui). Ex: "Commerce de détail de produits alimentaires dans le secteur 15 de Ouagadougou. Vente de riz, huile, sucre et produits de première nécessité."
- 🎯 Objectifs : Les buts que tu veux atteindre. Ex: "Atteindre un CA de 10M FCFA la première année, créer 3 emplois, devenir le premier fournisseur du quartier"

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
                            maxOutputTokens: 500,
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
        console.error("Gemini project help error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}