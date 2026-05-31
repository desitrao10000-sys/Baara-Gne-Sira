import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const EXTRACTION_PROMPT = `Tu es un assistant expert en analyse de documents de projets entrepreneuriaux en Afrique. On te fournit un document (PDF, Word ou image) contenant des informations sur un projet ou plan d'affaires.

TA MISSION :
1. Lis et analyse attentivement le document
2. Extrais TOUTES les informations pertinentes pour remplir les sections d'un projet
3. Structure ta réponse en JSON STRICT

RÈGLES :
- Réponds UNIQUEMENT en JSON valide (pas de texte avant/après)
- Si une info n'est pas dans le document, mets la valeur à null
- Les montants doivent être des nombres sans espaces ni symboles
- Sois précis et exhaustif

FORMAT JSON ATTENDU :
{
  "resume": "Résumé du document en 2-3 phrases",
  "sections": {
    "nom": "Nom du projet ou null",
    "secteur": "Secteur d'activité ou null",
    "localisation": "Ville, pays ou null",
    "zone": "Zone d'intervention ou null",
    "dateDemarrage": "Date de démarrage ou null",
    "duree": "Durée du projet ou null",
    "description": "Description détaillée du projet ou null",
    "objectifs": "Objectifs du projet ou null",
    "investissementMateriel": "Montant ou null",
    "investissementImateriel": "Montant ou null",
    "fondsDeRoulement": "Montant ou null",
    "fondsPropres": "Montant ou null",
    "emprunt": "Montant ou null",
    "chargesVariables": "Pourcentage ou null",
    "chargesFixes": "Montant annuel ou null",
    "chargesFinancieres": "Montant ou null",
    "tauxIS": "Pourcentage ou null",
    "dureeAmortissement": "Nombre d'années ou null",
    "caAnnees": [montant_annee1, montant_annee2, ...] ou null,
    "responsables": ["Nom1", "Nom2"] ou null,
    "risques": "Risques identifiés ou null"
  },
  "champsManquants": ["liste des sections non trouvées dans le document"],
  "confiance": 85
}

Analyse ce document et extrais les informations :`;

export async function POST(request: NextRequest) {
    try {
        const { fileBase64, fileName, mimeType } = await request.json();

        if (!fileBase64 || !fileName) {
            return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
        }

        let data: any = null;
        let lastError = "";

        for (const model of MODELS) {
            try {
                const body: any = {
                    contents: [{
                        parts: [
                            { text: EXTRACTION_PROMPT },
                            {
                                inlineData: {
                                    mimeType: mimeType || "application/pdf",
                                    data: fileBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                        topP: 0.9,
                    }
                };

                const response = await fetch(GEMINI_URL(model), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    data = await response.json();
                    break;
                } else {
                    const errBody = await response.text();
                    lastError = errBody;
                    console.error(`Gemini ${model} error:`, errBody);
                    // Si erreur 429 (quota), on continue avec le modèle suivant
                    if (response.status === 429) continue;
                    // Si erreur 404 (modèle introuvable), on continue
                    if (response.status === 404) continue;
                }
            } catch (err) {
                console.error(`Gemini ${model} exception:`, err);
                lastError = String(err);
            }
        }

        if (!data) {
            // Détecter si c'est un problème de quota
            const isQuotaError = lastError.includes("429") || lastError.includes("quota") || lastError.includes("RESOURCE_EXHAUSTED");
            const errorMsg = isQuotaError
                ? "⚠️ Quota Gemini dépassé. Attendez quelques minutes ou créez une nouvelle clé API sur ai.google.dev"
                : "Impossible d'analyser le document. Vérifie ta connexion internet.";
            return NextResponse.json(
                { error: errorMsg, details: lastError },
                { status: 500 }
            );
        }

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract JSON from response
        let parsed: any = null;
        try {
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("JSON parse error:", e);
        }

        if (!parsed) {
            return NextResponse.json({
                error: "L'IA n'a pas pu structurer les données.",
                rawResponse
            }, { status: 422 });
        }

        return NextResponse.json({ result: parsed, rawResponse });
    } catch (error) {
        console.error("Document analysis error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}