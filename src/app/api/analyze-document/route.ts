import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const EXTRACTION_PROMPT = `Tu es un analyste financier SENIOR et expert en business plan. Tu reçois un document (PDF, Word ou image) contenant un projet ou plan d'affaires.

⚡ MISSION CRITIQUE ⚡
Tu dois extraire ABSOLUMENT TOUTE les informations du document, y compris les plus petits détails. Prends tout le temps nécessaire.

MÉTHODE DE TRAVAIL OBLIGATOIRE :
1. LIS le document EN ENTIER d'abord sans rien extraire
2. RELIS une 2ème fois en cherchant chaque champ un par un
3. RELIS une 3ème fois pour les montants, chiffres, pourcentages
4. RELIS une 4ème fois pour les noms, contacts, adresses, téléphones, emails
5. RELIS une 5ème fois pour les dates, délais, échéances
6. EXTRAIS tout dans le format JSON

📋 LISTE EXHAUSTIVE DES CHAMPS À CHERCHER :

--- INFORMATIONS GÉNÉRALES DU PROJET ---
- "nom" : Nom/titre du projet. Cherche en page de garde, en-tête, haut du document
- "secteur" : Secteur d'activité exact. Cherche "secteur", "domaine", "activité"
- "localisation" : Ville, commune, quartier, rue, pays. CHERCHE TOUTE adresse mentionnée
- "zone" : Zone géographique couverte
- "dateDemarrage" : Date de début/lancement
- "duree" : Durée du projet
- "description" : Description COMPLÈTE du projet (pas de résumé court, mets TOUT)
- "objectifs" : TOUS les objectifs listés dans le document

--- CONTACTS ET COORDONNÉES ---
- "contacts" : CHERCHE ACTIVEMENT tous les contacts dans le document :
  * Téléphones (fixe, mobile, whatsapp)
  * Adresses email
  * Adresses physiques (quartier, rue, ville)
  * Sites web, réseaux sociaux
  * Cherche dans : en-têtes, pieds de page, signatures, coordonnées, "contact", "tél", "tel", "email", "@", "www", "+223", "+226", etc.

--- DÉTAILS MATÉRIELS (INVESTISSEMENT) ---
- "detailsMateriel" : LISTE DÉTAILLÉE de CHAQUE équipement/matériel avec :
  * "designation" : Nom de l'équipement
  * "quantite" : Quantité
  * "prixUnitaire" : Prix unitaire
  * "montant" : Total
  Cherche : "matériel", "équipement", "machine", "véhicule", "mobilier", "outil", "table", "chaise", "ordinateur", "réfrigérateur", "four", "tracteur", "moto", "camion", etc.
- "investissementMateriel" : TOTAL de l'investissement matériel (somme des détails)

- "detailsImateriel" : LISTE DÉTAILLÉE de chaque dépense immatérielle avec :
  * "designation" : Nom de la dépense
  * "montant" : Coût
  Cherche : "formation", "étude", "licence", "frais", "honoraires", "site web", "marketing", "publicité", "registre", "juridique"
- "investissementImateriel" : TOTAL

- "detailsFondsRoulement" : LISTE DÉTAILLÉE des besoins en fonds de roulement avec :
  * "designation" : Nature du besoin
  * "montant" : Montant
  Cherche : "stock", "trésorerie", "caisse", "fonds de roulement", "BFR", "approvisionnement"
- "fondsDeRoulement" : TOTAL

--- FINANCEMENT ---
- "detailsFinancement" : LISTE DÉTAILLÉE des sources de financement :
  * "source" : Nom de la source (fonds propres, banque, partenaire, etc.)
  * "montant" : Montant
  Cherche : "financement", "apport", "emprunt", "crédit", "subvention", "don", "prêt"
- "fondsPropres" : TOTAL des fonds propres
- "emprunt" : TOTAL des emprunts

--- EXPLOITATION ---
- "chargesVariables" : Pourcentage des charges variables (nombre uniquement)
- "detailsChargesVariables" : LISTE des charges variables avec désignation et montant/%
- "chargesFixes" : Montant annuel des charges fixes
- "detailsChargesFixes" : LISTE des charges fixes avec désignation et montant
- "chargesFinancieres" : Montant des charges financières
- "tauxIS" : Taux d'impôt sur les sociétés
- "dureeAmortissement" : Durée d'amortissement en années
- "caAnnees" : Tableau des CA prévisionnels par année [annee1, annee2, ...]
- "detailsCA" : Détails du CA si disponible (par produit/service, par mois, etc.)

--- ÉQUIPE ---
- "responsables" : Noms COMPLETS de TOUS les responsables/fondateurs
- "detailsEquipe" : LISTE DÉTAILLÉE de chaque membre avec :
  * "nom" : Nom complet
  * "poste" : Fonction/Poste
  * "contact" : Téléphone/email si disponible
  * "role" : Rôle dans le projet
  Cherche : "promoteur", "fondateur", "gérant", "directeur", "responsable", "manager", "chef", "employé", "salarié", "personnel"

--- RISQUES ---
- "risques" : Texte détaillé des risques identifiés
- "detailsRisques" : LISTE des risques avec :
  * "risque" : Description du risque
  * "niveau" : Évaluation (faible, moyen, élevé)
  * "mitigation" : Solution proposée si mentionnée

--- AUTRES INFORMATIONS ---
- "autresInformations" : TOUTE autre information pertinente trouvée dans le document qui ne rentre pas dans les catégories ci-dessus (partenariats, certifications, agréments, références, historique, etc.)
- "concurrents" : Informations sur la concurrence si mentionnée
- "clientsCibles" : Description des clients cibles
- "fournisseurs" : Informations sur les fournisseurs
- "partenaires" : Partenaires mentionnés

📋 PROPOSITION DE TÂCHES :
En fonction de ta compréhension du document et du plan d'affaires, propose des tâches concrètes pour réaliser le projet. Base-toi sur les activités, les phases, les étapes mentionnées dans le document.

Pour chaque tâche, fournis :
- "designation" : Titre court et clair de la tâche
- "description" : Description détaillée de ce qu'il faut faire
- "objectifs" : Objectif spécifique de cette tâche
- "responsable" : Personne responsable (si mentionnée, sinon "À assigner")
- "dateDebut" : Date de début estimée (si mentionnée, sinon "")
- "dateFin" : Date de fin estimée (si mentionnée, sinon "")
- "budgetPrev" : Budget prévisionnel estimé pour cette tâche (nombre ou 0)
- "risques" : Risques éventuels liés à cette tâche
- "statut" : "todo" (toujours "todo" pour les nouvelles tâches)

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en JSON valide (rien d'autre, pas de markdown, pas de backticks)
- Si un champ n'est VRAIMENT nulle part après 5 lectures, mets null
- Les montants en NOMBRES uniquement : 5000000 pas "5 000 000 FCFA"
- Les pourcentages en NOMBRES : 25 pas "25%"
- CALCULE les totaux si les montants sont détaillés
- CHERCHE les informations IMPLICITES (ex: "5 tables à 50 000F" = investissement matériel 250000)
- NE SOIS JAMAIS PARESSEUX : extrais TOUT, même les infos en bas de page, en notes de bas de page, en annexes
- Pour les tableaux, extrais CHAQUE ligne individuellement

FORMAT JSON STRICT :
{
  "resume": "Résumé détaillé du document en 4-5 phrases",
  "sections": {
    "nom": "string ou null",
    "secteur": "string ou null",
    "localisation": "string ou null",
    "zone": "string ou null",
    "dateDemarrage": "string ou null",
    "duree": "string ou null",
    "description": "string détaillé ou null",
    "objectifs": "string détaillé ou null",
    "contacts": [{"type": "telephone|email|adresse|web", "valeur": "string", "qui": "à qui ça appartient"}] ou null,
    "detailsMateriel": [{"designation": "string", "quantite": nombre, "prixUnitaire": nombre, "montant": nombre}] ou null,
    "investissementMateriel": nombre ou null,
    "detailsImateriel": [{"designation": "string", "montant": nombre}] ou null,
    "investissementImateriel": nombre ou null,
    "detailsFondsRoulement": [{"designation": "string", "montant": nombre}] ou null,
    "fondsDeRoulement": nombre ou null,
    "detailsFinancement": [{"source": "string", "montant": nombre}] ou null,
    "fondsPropres": nombre ou null,
    "emprunt": nombre ou null,
    "chargesVariables": nombre ou null,
    "detailsChargesVariables": [{"designation": "string", "montant": nombre}] ou null,
    "chargesFixes": nombre ou null,
    "detailsChargesFixes": [{"designation": "string", "montant": nombre}] ou null,
    "chargesFinancieres": nombre ou null,
    "tauxIS": nombre ou null,
    "dureeAmortissement": nombre ou null,
    "caAnnees": [nombre] ou null,
    "detailsCA": [{"designation": "string", "montant": nombre}] ou null,
    "responsables": ["string"] ou null,
    "detailsEquipe": [{"nom": "string", "poste": "string", "contact": "string", "role": "string"}] ou null,
    "risques": "string ou null",
    "detailsRisques": [{"risque": "string", "niveau": "string", "mitigation": "string"}] ou null,
    "autresInformations": "string ou null",
    "concurrents": "string ou null",
    "clientsCibles": "string ou null",
    "fournisseurs": "string ou null",
    "partenaires": "string ou null"
  },
  "tachesProposees": [
    {
      "designation": "string",
      "description": "string",
      "objectifs": "string",
      "responsable": "string",
      "dateDebut": "string",
      "dateFin": "string",
      "budgetPrev": nombre,
      "risques": "string",
      "statut": "todo"
    }
  ],
  "champsManquants": ["liste des champs non trouvés"],
  "confiance": 85
}

Prends tout le temps nécessaire. Analyse ce document de façon ULTRA-EXHAUSTIVE. Relis-le autant de fois que nécessaire :`;

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
                    if (response.status === 429) continue;
                    if (response.status === 404) continue;
                }
            } catch (err) {
                console.error(`Gemini ${model} exception:`, err);
                lastError = String(err);
            }
        }

        if (!data) {
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