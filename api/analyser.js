// Fonction serveur Vercel : POST /api/analyser
// Reçoit les photos (JPEG en base64) et les infos dictées/écrites,
// demande l'annonce à Claude et la renvoie au format attendu par l'appli.
// La clé ANTHROPIC_API_KEY reste côté serveur (variable d'environnement Vercel).
//
// Claude Opus 5.5 regarde les photos, cherche sur le web le prix d'articles
// similaires d'occasion (3 recherches au plus), puis rédige l'annonce en
// appelant l'outil « rediger_annonce » (arguments au format strict).
import Anthropic from '@anthropic-ai/sdk'

export const config = { maxDuration: 120 }

const MODELE = 'claude-opus-5-5'
const MAX_PHOTOS = 8
const MAX_RECHERCHES = 3
const MAX_REPRISES = 3 // relances après une pause du serveur (pause_turn)
const ORIGINES = [
  'https://malow.app',
  'https://www.malow.app',
  'https://creation-annonce.vercel.app',
  'https://localhost', // appli Android (Capacitor)
  'capacitor://localhost', // appli iOS (Capacitor)
  'http://localhost:5173',
  'http://localhost:4173',
]

const OUTIL_ANNONCE = {
  name: 'rediger_annonce',
  description: "Enregistre l'annonce finale. À appeler une seule fois, quand l'annonce est prête.",
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Titre court et vendeur, 70 caractères maximum' },
      description: { type: 'string', description: 'Description de 3 à 6 phrases' },
      prix_conseille: { type: 'integer', description: 'Prix conseillé en euros' },
      prix_rapide: { type: 'integer', description: 'Prix pour vendre en quelques jours' },
      prix_haut: { type: 'integer', description: 'Prix haut, pour un acheteur patient' },
      explication_prix: {
        type: 'string',
        description:
          "Une phrase pour le vendeur expliquant d'où vient le prix (ex. « Des articles similaires se vendent entre 12 et 20 € sur Vinted. »)",
      },
      tags: { type: 'array', items: { type: 'string' }, description: '5 à 8 mots-clés' },
      marque_probable: {
        type: 'string',
        description: 'Marque reconnue au style mais non confirmée (ni logo lisible, ni info du vendeur), sinon chaîne vide',
      },
    },
    required: [
      'titre',
      'description',
      'prix_conseille',
      'prix_rapide',
      'prix_haut',
      'explication_prix',
      'tags',
      'marque_probable',
    ],
    additionalProperties: false,
  },
}

const RECHERCHE_WEB = { type: 'web_search_20260209', name: 'web_search', max_uses: MAX_RECHERCHES }

const SYSTEME = `Tu rédiges des annonces de vente d'objets d'occasion pour des particuliers en France \
(Vinted, Leboncoin, Facebook Marketplace).

À partir des photos et des informations du vendeur :
- Identifie l'objet : type, public (enfant, femme, homme…), marque, taille, couleur, matière, détails utiles.
- Marque : cherche-la sur les photos (logo, étiquette, languette, semelle, motif caractéristique). \
Si elle est lisible ou donnée par le vendeur, mets-la dans le titre et la description. \
Si tu la reconnais seulement au style, sans certitude, ne l'écris pas dans l'annonce : \
indique-la dans marque_probable pour que le vendeur la confirme. Sinon, laisse marque_probable vide.
- N'invente rien d'autre : une taille n'apparaît que si elle est visible ou donnée par le vendeur.
- Évalue l'état d'après les photos et les infos, et mentionne honnêtement les défauts visibles ou signalés.
- Les informations du vendeur priment sur ce que tu crois voir.

Prix : c'est essentiel pour le vendeur. Quand l'outil web_search est disponible, fais 1 à ${MAX_RECHERCHES} \
recherches ciblées (type d'objet, marque, modèle, taille, « occasion », sites français comme Vinted ou Leboncoin) \
pour voir à quel prix se vendent des articles similaires d'occasion en ce moment. \
Tiens compte de l'état, de la marque et de la demande. En euros entiers, prix_rapide < prix_conseille < prix_haut. \
Résume en une phrase dans explication_prix ce qui justifie le prix (fourchette observée, ou estimation si tu n'as rien trouvé).

Rédaction, en français :
- Titre : court, avec les mots que les acheteurs tapent (type d'objet, marque, taille, état).
- Description : 3 à 6 phrases simples et chaleureuses, sans emoji ni majuscules inutiles. \
Termine par une phrase sur l'envoi ou la remise en main propre.
- Mots-clés : 5 à 8, courts, sans « # ».

Termine toujours en appelant l'outil rediger_annonce avec l'annonce finale.`

function autoriserOrigine(req, res) {
  const origine = req.headers.origin
  if (origine && ORIGINES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  return !origine || ORIGINES.includes(origine)
}

// Un échange complet avec Claude. Renvoie l'annonce (arguments de rediger_annonce)
// ou null si Claude n'a pas appelé l'outil.
async function demanderAnnonce(client, contenuUtilisateur, avecRecherche) {
  const messages = [{ role: 'user', content: contenuUtilisateur }]
  const tools = avecRecherche ? [RECHERCHE_WEB, OUTIL_ANNONCE] : [OUTIL_ANNONCE]
  const debut = Date.now()
  let reponse

  for (let reprise = 0; reprise <= MAX_REPRISES; reprise++) {
    reponse = await client.beta.messages.create({
      model: MODELE,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high' },
      system: SYSTEME,
      tools,
      messages,
    })
    // La recherche web tourne côté serveur ; si elle a besoin de plus de temps,
    // on renvoie la réponse telle quelle pour qu'elle reprenne là où elle en était.
    if (reponse.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: reponse.content })
  }

  // Journal : modèle qui a réellement répondu (un repli peut changer de modèle).
  console.log(
    JSON.stringify({
      analyse: 'terminee',
      modele_demande: MODELE,
      modele_utilise: reponse.model,
      repli: reponse.model !== MODELE,
      recherche_web: avecRecherche,
      recherches_effectuees: reponse.usage?.server_tool_use?.web_search_requests ?? 0,
      jetons_entree: reponse.usage?.input_tokens,
      jetons_sortie: reponse.usage?.output_tokens,
      arret: reponse.stop_reason,
      duree_ms: Date.now() - debut,
    }),
  )

  if (reponse.stop_reason === 'refusal') {
    const err = new Error('refus')
    err.refus = true
    throw err
  }
  const appel = reponse.content.find((b) => b.type === 'tool_use' && b.name === OUTIL_ANNONCE.name)
  return appel ? { annonce: appel.input, modele: reponse.model } : null
}

export default async function handler(req, res) {
  const origineOk = autoriserOrigine(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' })
  if (!origineOk) return res.status(403).json({ erreur: 'Origine non autorisée' })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ erreur: 'Analyse IA non configurée' })
  }

  const { photos = [], infos = '' } = req.body || {}
  if (!Array.isArray(photos) || photos.length === 0 || photos.length > MAX_PHOTOS) {
    return res.status(400).json({ erreur: `Envoyez entre 1 et ${MAX_PHOTOS} photos` })
  }
  const images = []
  for (const photo of photos) {
    const m = typeof photo === 'string' && photo.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
    if (!m) return res.status(400).json({ erreur: 'Format de photo invalide' })
    images.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } })
  }
  const contenu = [
    ...images,
    {
      type: 'text',
      text: String(infos).trim()
        ? `Informations du vendeur : ${String(infos).slice(0, 2000)}`
        : "Le vendeur n'a pas donné d'informations : appuie-toi sur les photos.",
    },
  ]

  const client = new Anthropic()
  try {
    let resultat = null
    try {
      resultat = await demanderAnnonce(client, contenu, true)
    } catch (e) {
      // Si la requête avec recherche web est rejetée, on retente sans recherche.
      if (!(e instanceof Anthropic.BadRequestError)) throw e
      console.error('Recherche web refusée, nouvel essai sans recherche :', e.message)
    }
    // Claude n'a pas appelé l'outil (ou la recherche a échoué) : un essai sans recherche.
    if (!resultat) resultat = await demanderAnnonce(client, contenu, false)
    if (!resultat) return res.status(502).json({ erreur: 'L’IA n’a pas rédigé l’annonce' })

    const a = resultat.annonce
    return res.status(200).json({
      titre: a.titre,
      description: a.description,
      prix: { conseille: a.prix_conseille, rapide: a.prix_rapide, haut: a.prix_haut },
      explicationPrix: a.explication_prix || '',
      tags: a.tags,
      marqueProbable: a.marque_probable || '',
      modele: resultat.modele,
    })
  } catch (e) {
    if (e.refus) return res.status(422).json({ erreur: 'L’IA n’a pas pu analyser ces photos' })
    if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ erreur: 'Trop de demandes, réessayez dans un instant' })
    }
    if (e instanceof Anthropic.APIError) {
      console.error('Erreur API Claude', e.status, e.message)
      return res.status(502).json({ erreur: 'Service d’analyse indisponible' })
    }
    console.error('Erreur analyse', e)
    return res.status(500).json({ erreur: 'Erreur pendant l’analyse' })
  }
}
