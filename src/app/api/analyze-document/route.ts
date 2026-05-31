import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const EXTRACTION_PROMPT = `Tu es un analyste financier et expert en business plan TRÈS rigoureux. Tu reçois un document (PDF, Word ou image) contenant un projet ou plan d'affaires.

⚡ MISSION CRITIQUE ⚡
Tu dois extraire ABSOLUMENT TOUTE les informations du document. Prends ton temps, lis le document ENTIER mot par mot, ligne par ligne, page par page.

MÉTHODE DE TRAVAIL :
1. LIS le document EN ENTIER d'abord sans rien extraire
2. RELIS une 2ème fois en cherchant chaque champ un par un
3. RELIS une 3ème fois pour vérifier les montants et chiffres
4. EXTRAIS les informations dans le format JSON

CHAMPS À CHERCHER ET OÙ LES TROUVER :

📊 SECTION INFORMATIONS PROJET :
- "nom" : Le nom/titre du projet. Cherche en haut du document, page de garde, en-têtes
- "secteur" : Le secteur d'activité (commerce, agriculture, service, industrie, élevage, artisanat, transport, technologie, santé, éducation, restauration, bâtiment)
- "localisation" : Ville, commune, quartier, pays. Cherche les adresses
- "zone" : Zone géographique couverte (région, pays, zone)
- "dateDemarrage" : Date de début/lancement du projet
- "duree" : Durée du projet (en mois ou années)
- "description" : Résumé détaillé de l'activité. Cherche "présentation", "description", "résumé du projet"
- "objectifs" : Buts et objectifs. Cherche "objectifs", "but", "finalité", "vision"

💰 SECTION INVESTISSEMENT :
- "investissementMateriel" : Équipements, machines, véhicules, mobilier, outils. Cherche "investissement", "équipement", "matériel", "immobilisation", "actif"
- "investissementImateriel" : Formation, études, frais juridiques, licences, R&D. Cherche "immatériel", "frais", "étude", "formation"
- "fondsDeRoulement" : Trésorerie de départ, stock initial. Cherche "fonds de roulement", "BFR", "trésorerie", "stock", "besoin en fonds"

💵 SECTION FINANCEMENT :
- "fondsPropres" : Apport personnel de l'entrepreneur. Cherche "apport", "fonds propres", "capital personnel", "épargne"
- "emprunt" : Montant du prêt bancaire. Cherche "emprunt", "crédit", "prêt", "financement bancaire"

📈 SECTION EXPLOITATION :
- "chargesVariables" : Pourcentage des charges variables. Cherche "charges variables", "CV", "matières premières", "coût variable"
- "chargesFixes" : Montant annuel des charges fixes. Cherche "charges fixes", "CF", "loyer", "salaires fixes"
- "chargesFinancieres" : Intérêts d'emprunt. Cherche "charges financières", "intérêts", "annuités"
- "tauxIS" : Taux d'impôt. Cherche "IS", "impôt", "taxe", "30%", "25%"
- "dureeAmortissement" : Durée en années. Cherche "amortissement", "durée de vie"
- "caAnnees" : Chiffre d'affaires par année. Cherche "CA", "chiffre d'affaires", "recettes", "ventes prévues"

👥 SECTION ÉQUIPE :
- "responsables" : Noms des dirigeants, fondateurs, gérants. Cherche "promoteur", "fondateur", "gérant", "directeur", "responsable", "chef d'entreprise", "entrepreneur"
- "risques" : Risques identifiés. Cherche "risque", "menace", "difficulté"

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en JSON valide (rien d'autre, pas de markdown)
- Si un champ n'est vraiment nulle part, mets null
- Les montants en NOMBRES uniquement (pas d'espaces ni symboles) : 5000000 pas "5 000 000 FCFA"
- Les pourcentages en NOMBRES : 25 pas "25%"
- Pour "caAnnees", mets un tableau : [1500000, 2000000, 2500000]
- CONFANCE : évalue honnêtement le % d'infos trouvées (0-100)
- NE LAISSE AUCUN CHAMP À null SI L'INFO EST DANS LE DOCUMENT
- Cherche les informations IMPLICITES aussi (ex: si "5 tables à 50 000F" = investissement matériel 250000)
- CALCULE les totaux si les montants sont détaillés ligne par ligne

FORMAT JSON STRICT :
{
  "resume": "Résumé du document en 3-4 phrases détaillées",
  "sections": {
    "nom": "string ou null",
    "secteur": "string ou null",
    "localisation": "string ou null",
    "zone": "string ou null",
    "dateDemarrage": "string ou null",
    "duree": "string ou null",
    "description": "string ou null",
    "objectifs": "string ou null",
    "investissementMateriel": nombre ou null,
    "investissementImateriel": nombre ou null,
    "fondsDeRoulement": nombre ou null,
    "fondsPropres": nombre ou null,
    "emprunt": nombre ou null,
    "chargesVariables": nombre ou null,
    "chargesFixes": nombre ou null,
    "chargesFinancieres": nombre ou null,
    "tauxIS": nombre ou null,
    "dureeAmortissement": nombre ou null,
    "caAnnees": [nombre] ou null,
    "responsables": ["string"] ou null,
    "risques": "string ou null"
  },
  "champsManquants": ["liste des champs non trouvés"],
  "confiance": 85
}

Prends tout le temps nécessaire. Analyse ce document de façon EXHAUSTIVE :`;

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
                        temperature: 0.1,
                        maxOutputTokens: 65536,
                        topP: 0.95,
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