import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDjrMmHMJiNQcyoUyz6Ptbuo9Ql6237-GI";
const MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
];
const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es un assistant expert en création de projets entrepreneuriaux en Afrique (Mali, Burkina Faso, Côte d'Ivoire). Tu aides des entrepreneurs à bien remplir les informations de leur projet.

RÈGLES STRICTES :
1. Réponds TOUJOURS en français
2. Sois PRÉCIS et CONCIS (max 150 mots)
3. Utilise des emojis pour rendre la réponse lisible
4. Donne des exemples concrets adaptés au contexte africain

SECTIONS DU PROJET :
- 📛 Nom du projet : Le nom commercial de ton activité. Court, mémorable, professionnel. Ex: "Djiguifa Commerce", "Sahel Agro", "Mali Tech Solutions"
- 🏢 Secteur d'activité : Le domaine principal (commerce, agriculture, service, industrie, élevage, artisanat, transport, technologie, santé, éducation, restauration, bâtiment)
- 📍 Localisation : La ville ou quartier. Ex: "Bamako, ACI 2000", "Bobo-Dioulasso, Hamdallaye"
- 🌍 Zone d'intervention : Zone géographique couverte. Ex: "Région de Sikasso", "Tout le Mali", "Afrique de l'Ouest"
- 📅 Date de démarrage : La date prévue de lancement
- ⏱ Durée prévue : La durée estimée du projet (1 an, 3 ans, 5 ans...)
- 📝 Description : Ce que tu fais, comment tu le fais, pour qui. Sois précis et professionnel.
- 🎯 Objectifs : Les buts à atteindre (CA, emplois créés, part de marché, expansion géographique)`;

export async function POST(request: NextRequest) {
    try {
        const { query, sectionId, sectionTitle } = await request.json();

        if (!query || !sectionId) {
            return NextResponse.json({ error: "Query and sectionId are required" }, { status: 400 });
        }

        const userMessage = `Je remplis la section "${sectionTitle || sectionId}" de mon projet. Ma question : "${query}"`;

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
        console.error("Gemini project help error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
