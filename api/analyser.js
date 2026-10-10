// Fonction serveur Vercel : POST /api/analyser
// Reçoit les photos (JPEG en base64) et les infos dictées/écrites,
// demande l'annonce à Claude et la renvoie au format attendu par l'appli.
// La clé ANTHROPIC_API_KEY reste côté serveur (variable d'environnement Vercel).
//
// Deux niveaux d'analyse, selon la formule et le quota de l'utilisateur (base Supabase) :
// - Premium (Nalow+ et les 2 annonces « découverte ») : Claude Opus 5.5 regarde les photos,
//   cherche sur le web le prix d'articles similaires d'occasion (2 recherches au plus)
//   et estime le prix ;
// - Standard (formule gratuite) : Claude Sonnet 5.5 rédige l'annonce, sans recherche
//   ni estimation de prix.
// L'annonce est rendue par l'outil « rediger_annonce » (arguments au format strict).
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from '../src/lib/configSupabase.js'
import { formaterDescription } from '../src/lib/paragraphes.js'

export const config = { maxDuration: 120 }

const MODELE_PREMIUM = 'claude-opus-5-5'
const MODELE_STANDARD = 'claude-sonnet-5-5'
const MAX_PHOTOS = 8
const MAX_RECHERCHES = 2
const MAX_REPRISES = 3 // relances après une pause du serveur (pause_turn)
// L'analyse IA est réservée à l'appli : le site nalow.app ne peut pas l'appeler.
const ORIGINES = [
  'https://localhost', // appli Android (Capacitor)
  'capacitor://localhost', // appli iOS (Capacitor)
]

const OUTIL_ANNONCE = {
  name: 'rediger_annonce',
  description: "Enregistre l'annonce finale. À appeler une seule fois, quand l'annonce est prête.",
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Titre court et vendeur, 70 caractères maximum' },
      description: {
        type: 'string',
        description: 'Description en paragraphes par thème (Description, État, Taille / dimensions, Livraison), séparés par une ligne vide',
      },
      prix_neuf: {
        type: 'integer',
        description: "Prix neuf actuel en euros dans une boutique en ligne (même modèle, ou le plus proche) ; 0 si introuvable",
      },
      source_prix_neuf: { type: 'string', description: 'Boutique où ce prix neuf a été relevé (ex. « Darty ») ; vide si prix_neuf vaut 0' },
      etat: {
        type: 'string',
        enum: ['neuf', 'tres_bon', 'bon', 'correct'],
        description: "État d'après les photos et le vendeur : neuf (jamais utilisé), très bon, bon, ou correct (usure ou défauts visibles)",
      },
      prix_conseille: { type: 'integer', description: 'Prix conseillé en euros, utilisé seulement si prix_neuf vaut 0' },
      prix_rapide: { type: 'integer', description: 'Prix pour vendre en quelques jours (si prix_neuf vaut 0)' },
      prix_haut: { type: 'integer', description: 'Prix haut, pour un acheteur patient (si prix_neuf vaut 0)' },
      explication_prix: {
        type: 'string',
        description: "Une phrase pour le vendeur expliquant l'estimation, utilisée seulement si prix_neuf vaut 0",
      },
      tags: { type: 'array', items: { type: 'string' }, description: '5 à 8 mots-clés' },
      marque_probable: {
        type: 'string',
        description:
          'Marque seule (sans le modèle) la plus probable mais non confirmée (ni logo lisible, ni info du vendeur), ex. « HP » ; chaîne vide si la marque est certaine ou inconnue',
      },
      autres_marques: {
        type: 'array',
        items: { type: 'string' },
        description:
          '2 à 5 autres marques plausibles, du plus au moins probable (ex. « Dell », « Lenovo ») ; liste vide si marque_probable est vide',
      },
      modele_probable: {
        type: 'string',
        description:
          'Modèle seul (sans la marque) le plus probable mais non confirmé, ex. « EliteBook 840 G9 » ; chaîne vide si le modèle est certain, inconnu ou sans objet',
      },
      autres_modeles: {
        type: 'array',
        items: { type: 'string' },
        description:
          '2 à 5 autres modèles plausibles de la même marque, du plus au moins probable (ex. « EliteBook 840 G10 », « EliteBook 850 G9 ») ; liste vide si modele_probable est vide',
      },
    },
    required: [
      'titre',
      'description',
      'prix_neuf',
      'source_prix_neuf',
      'etat',
      'prix_conseille',
      'prix_rapide',
      'prix_haut',
      'explication_prix',
      'tags',
      'marque_probable',
      'autres_marques',
      'modele_probable',
      'autres_modeles',
    ],
    additionalProperties: false,
  },
}

// Version standard (gratuite) : mêmes champs, sans le prix.
const CHAMPS_PRIX = ['prix_neuf', 'source_prix_neuf', 'etat', 'prix_conseille', 'prix_rapide', 'prix_haut', 'explication_prix']
const OUTIL_ANNONCE_SIMPLE = {
  ...OUTIL_ANNONCE,
  input_schema: {
    ...OUTIL_ANNONCE.input_schema,
    properties: Object.fromEntries(
      Object.entries(OUTIL_ANNONCE.input_schema.properties).filter(([cle]) => !CHAMPS_PRIX.includes(cle)),
    ),
    required: OUTIL_ANNONCE.input_schema.required.filter((cle) => !CHAMPS_PRIX.includes(cle)),
  },
}

// Recherche web classique : les résultats arrivent tels quels à l'IA. Mesuré le 10 octobre 2026,
// la version avec filtrage dynamique (web_search_20260209) n'était pas moins chère, était 2 fois
// plus lente et son étape de filtrage échouait souvent.
const RECHERCHE_WEB = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: MAX_RECHERCHES,
  user_location: { type: 'approximate', country: 'FR', timezone: 'Europe/Paris' },
}

const consignes = (PRIX) => `Tu rédiges des annonces de vente d'objets d'occasion pour des particuliers en France \
(Vinted, Leboncoin, Facebook Marketplace).

À partir des photos et des informations du vendeur :
- Identifie l'objet : type, public (enfant, femme, homme…), marque, taille, couleur, matière, détails utiles.
- Marque : cherche-la sur les photos (logo, étiquette, languette, semelle, motif caractéristique). \
Si elle est lisible ou donnée par le vendeur, mets-la dans le titre et la description. \
Si tu la reconnais seulement au style, sans certitude, ne l'écris pas dans l'annonce : \
indique-la dans marque_probable pour que le vendeur la confirme, et mets dans autres_marques les autres \
marques possibles, pour qu'il puisse choisir s'il répond non. Sinon, laisse les deux vides.
- Modèle : même principe, séparément de la marque. S'il est certain (inscription lisible, info du vendeur), \
mets-le dans l'annonce. S'il est seulement probable, ne l'écris pas : indique-le dans modele_probable (sans \
la marque) et les autres modèles possibles de la même marque dans autres_modeles.
- Ce que tu trouves par une recherche web reste probable, pas certain : sans logo ni inscription lisible sur les \
photos et sans information du vendeur, n'écris pas la marque ni le modèle dans le titre, la description ou les \
mots-clés. Mets-les dans marque_probable / modele_probable (et les alternatives dans autres_marques / autres_modeles) : \
le vendeur les confirmera. La recherche sert à proposer les bons choix et à estimer le prix. \
C'est vrai en particulier pour une référence précise (ex. « OW611810 ») : ne l'écris que si elle est lisible sur une \
étiquette ou donnée par le vendeur. Les caractéristiques décrites (nombre de programmes, dimensions…) viennent des \
photos et du vendeur : en cas de différence avec la recherche, ce qui est visible l'emporte.
- N'invente rien d'autre : une taille n'apparaît que si elle est visible ou donnée par le vendeur.
- Évalue l'état d'après les photos et les infos, et mentionne honnêtement les défauts visibles ou signalés.
- Les informations du vendeur priment sur ce que tu crois voir.

${PRIX}Rédaction, en français :
- Titre : court, avec les mots que les acheteurs tapent (type d'objet, marque, taille, état).
- Description : des paragraphes courts par thème, chacun commençant par son intitulé suivi de « : », \
séparés par une ligne vide, dans cet ordre :
  Description : l'objet, ce qui le rend intéressant, ses détails (1 à 3 phrases chaleureuses).
  État : l'état réel, avec les défauts visibles ou signalés (1 à 2 phrases).
  Taille / dimensions : seulement si la taille, la pointure ou les dimensions sont connues.
  Livraison : envoi soigné, remise en main propre possible (1 phrase).
  Pas d'emoji, pas de majuscules inutiles, pas de listes à puces.
- Mots-clés : 5 à 8, courts, sans « # ».

Termine toujours en appelant l'outil rediger_annonce avec l'annonce finale.`

const SYSTEME_PREMIUM = consignes(`Recherches web : quand l'outil web_search est disponible, fais 1 ou 2 recherches courtes (${MAX_RECHERCHES} au plus) :
  - Si la marque et le modèle ou la référence sont lisibles sur les photos ou donnés par le vendeur : \
une seule recherche, celle du prix neuf (ex. « Moulinex Bread of the World prix »).
  - Sinon, d'abord une recherche d'identification (marque et inscriptions visibles : nom de gamme, nombre de \
programmes, puissance, référence…) pour trouver les modèles possibles, puis la recherche du prix neuf du modèle \
le plus probable. Sers-toi de l'identification pour marque_probable, modele_probable, autres_marques et \
autres_modeles : ne propose que des modèles réels qui correspondent à ce qui est visible.

Prix : relève dans prix_neuf le prix actuel de l'objet neuf dans une boutique en ligne française (site de la marque, \
Amazon, Fnac, Darty, Decathlon…), et la boutique dans source_prix_neuf. S'il n'est plus vendu, prends le prix neuf \
du modèle équivalent le plus proche. Indique l'état dans etat (« neuf » seulement si le vendeur dit que l'objet est \
neuf). Le prix de vente sera calculé à partir de ces deux informations. Si tu ne trouves vraiment aucun prix neuf, \
mets prix_neuf à 0 et estime toi-même prix_conseille, prix_rapide, prix_haut (euros entiers, \
prix_rapide < prix_conseille < prix_haut) avec une phrase dans explication_prix.
Va droit au but : pas de recherche supplémentaire, rédige l'annonce dès que tu as ces informations.

`)
const SYSTEME_STANDARD = consignes('')

// Prix conseillé = prix neuf en boutique × pourcentage selon l'état (vente rapide / prix haut autour).
// À ajuster ici selon les retours des vendeurs.
const DECOTE = {
  neuf: { libelle: 'neuf, jamais utilisé', conseille: 0.7, rapide: 0.6, haut: 0.8 },
  tres_bon: { libelle: "en très bon état d'occasion", conseille: 0.5, rapide: 0.4, haut: 0.6 },
  bon: { libelle: "en bon état d'occasion", conseille: 0.4, rapide: 0.3, haut: 0.5 },
  correct: { libelle: "d'occasion avec des traces d'usure", conseille: 0.25, rapide: 0.2, haut: 0.35 },
}

function prixDepuisNeuf(prixNeuf, etat, source) {
  const d = DECOTE[etat] || DECOTE.bon
  const arrondi = (taux) => Math.max(1, Math.round(prixNeuf * taux))
  const pourcent = Math.round(d.conseille * 100)
  return {
    prix: { conseille: arrondi(d.conseille), rapide: arrondi(d.rapide), haut: arrondi(d.haut) },
    explication: `Prix neuf constaté : environ ${prixNeuf} €${source ? ` (${source})` : ''}. Pour un objet ${d.libelle}, on conseille ${pourcent} % de ce prix.`,
  }
}

// Réglages de chaque niveau d'analyse.
const NIVEAUX = {
  premium: { modele: MODELE_PREMIUM, systeme: SYSTEME_PREMIUM, outil: OUTIL_ANNONCE, recherche: true, effort: 'medium' },
  standard: { modele: MODELE_STANDARD, systeme: SYSTEME_STANDARD, outil: OUTIL_ANNONCE_SIMPLE, recherche: false, effort: 'medium' },
}

// Tarifs Anthropic en dollars par million de jetons (cache : écriture 5 min = 1,25 × l'entrée,
// lecture = 0,1 × l'entrée) et par recherche web (10 $ les 1 000). Un repli de sécurité peut
// faire répondre un autre modèle : on applique alors son tarif.
const TARIFS = {
  'claude-opus-5-5': { entree: 4, sortie: 20 },
  'claude-opus-5': { entree: 5, sortie: 25 },
  'claude-opus-4-8': { entree: 5, sortie: 25 },
  'claude-sonnet-5-5': { entree: 2, sortie: 10 },
}
const PRIX_RECHERCHE = 0.01

function nouveauCompteur(modele) {
  return { appels: 0, entree: 0, sortie: 0, cacheLecture: 0, cacheEcriture: 0, recherches: 0, cout: 0, modele }
}

// Ajoute la consommation d'une réponse de l'API au compteur de l'analyse.
function compter(compteur, reponse) {
  const u = reponse.usage || {}
  const t = TARIFS[reponse.model] || TARIFS[compteur.modele] || TARIFS[MODELE_PREMIUM]
  const entree = u.input_tokens || 0
  const sortie = u.output_tokens || 0
  const lecture = u.cache_read_input_tokens || 0
  const ecriture = u.cache_creation_input_tokens || 0
  const recherches = u.server_tool_use?.web_search_requests || 0
  compteur.appels++
  compteur.entree += entree
  compteur.sortie += sortie
  compteur.cacheLecture += lecture
  compteur.cacheEcriture += ecriture
  compteur.recherches += recherches
  compteur.modele = reponse.model || compteur.modele
  compteur.cout +=
    (entree * t.entree + sortie * t.sortie + lecture * t.entree * 0.1 + ecriture * t.entree * 1.25) / 1e6 +
    recherches * PRIX_RECHERCHE
}

function autoriserOrigine(req, res) {
  const origine = req.headers.origin
  if (origine && ORIGINES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return Boolean(origine) && ORIGINES.includes(origine)
}

// Un échange complet avec Claude. Renvoie l'annonce (arguments de rediger_annonce)
// ou null si Claude n'a pas appelé l'outil.
async function demanderAnnonce(client, contenuUtilisateur, niveau, avecRecherche, utilisateur, compteur) {
  const messages = [{ role: 'user', content: contenuUtilisateur }]
  const tools = avecRecherche ? [RECHERCHE_WEB, niveau.outil] : [niveau.outil]
  const debut = Date.now()
  let reponse

  for (let reprise = 0; reprise <= MAX_REPRISES; reprise++) {
    reponse = await client.beta.messages.create({
      model: niveau.modele,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: niveau.effort },
      system: niveau.systeme,
      tools,
      messages,
    })
    compter(compteur, reponse)
    // La recherche web tourne côté serveur ; si elle a besoin de plus de temps,
    // on renvoie la réponse telle quelle pour qu'elle reprenne là où elle en était.
    if (reponse.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: reponse.content })
  }

  // Journal des recherches web et du filtrage (exécution de code) : nombre de résultats ou code
  // d'erreur (les erreurs des outils serveur ne lèvent pas d'exception).
  const resultatsRecherche = reponse.content
    .filter((b) => b.type.endsWith('_tool_result'))
    .map((b) => ({
      type: b.type,
      resultats: Array.isArray(b.content) ? b.content.length : undefined,
      erreur: Array.isArray(b.content)
        ? undefined
        : b.content?.error_code || (b.content?.return_code ? `code ${b.content.return_code}` : undefined),
    }))
  if (resultatsRecherche.length) console.log(JSON.stringify({ analyse: 'recherche', utilisateur, resultatsRecherche }))

  // Journal : modèle qui a réellement répondu (un repli peut changer de modèle).
  console.log(
    JSON.stringify({
      analyse: 'terminee',
      utilisateur,
      modele_demande: niveau.modele,
      modele_utilise: reponse.model,
      repli: reponse.model !== niveau.modele,
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
  const appel = reponse.content.find((b) => b.type === 'tool_use' && b.name === niveau.outil.name)
  return appel ? { annonce: appel.input, modele: reponse.model } : null
}

export default async function handler(req, res) {
  const origineOk = autoriserOrigine(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'Méthode non autorisée' })
  if (!origineOk) return res.status(403).json({ erreur: 'L’analyse IA est disponible uniquement dans l’appli Nalow' })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ erreur: 'Analyse IA non configurée' })
  }

  // Réservé aux utilisateurs connectés : on vérifie le jeton de session auprès de Supabase.
  const jeton = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!jeton) return res.status(401).json({ erreur: 'Connectez-vous pour lancer l’analyse' })
  const { data: auth, error: errAuth } = await createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    auth: { persistSession: false },
  }).auth.getUser(jeton)
  if (errAuth || !auth?.user) return res.status(401).json({ erreur: 'Session expirée, reconnectez-vous' })
  const utilisateur = auth.user.id

  const { photos = [], infos = '', neuf = false } = req.body || {}
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
    {
      type: 'text',
      text: neuf === true
        ? 'Le vendeur a coché « objet neuf » : il est neuf, jamais utilisé.'
        : "Le vendeur n'a pas coché « objet neuf » : c'est un objet d'occasion.",
    },
  ]

  // Client Supabase agissant au nom de l'utilisateur (quota, coûts).
  const base = createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jeton}` } },
  })

  // Quota : réserve une analyse (découverte, premium ou standard) avant d'appeler l'IA.
  const { data: reservation, error: errQuota } = await base.rpc('reserver_analyse')
  if (errQuota) {
    console.error('Quota indisponible :', errQuota.message)
    return res.status(503).json({ erreur: 'Service momentanément indisponible, réessayez' })
  }
  if (!reservation?.ok) {
    return res.status(402).json({ erreur: 'Quota d’annonces atteint', code: 'quota', quota: reservation?.quota })
  }
  const typeAnalyse = reservation.type // 'decouverte' | 'premium' | 'standard'
  const niveau = typeAnalyse === 'standard' ? NIVEAUX.standard : NIVEAUX.premium
  const annuler = () =>
    base.rpc('annuler_analyse', { p_id: reservation.id }).then(
      ({ error }) => error && console.error('Annulation impossible :', error.message),
    )

  const client = new Anthropic()
  const compteur = nouveauCompteur(niveau.modele)
  const debut = Date.now()
  // Enregistre le coût réel de l'analyse (table couts_analyses), sans bloquer la réponse en cas d'échec.
  const noterCout = async (reussie) => {
    if (!compteur.appels) return
    console.log(JSON.stringify({ analyse: 'cout', utilisateur, cout_usd: +compteur.cout.toFixed(5), ...compteur }))
    try {
      const { error } = await base
        .from('couts_analyses')
        .insert({
          user_id: utilisateur,
          modele: compteur.modele,
          photos: images.length,
          recherches: compteur.recherches,
          jetons_entree: compteur.entree,
          jetons_sortie: compteur.sortie,
          jetons_cache_lecture: compteur.cacheLecture,
          jetons_cache_ecriture: compteur.cacheEcriture,
          appels: compteur.appels,
          duree_ms: Date.now() - debut,
          cout_usd: +compteur.cout.toFixed(5),
          reussie,
        })
      if (error) console.error('Coût non enregistré :', error.message)
    } catch (e) {
      console.error('Coût non enregistré :', e.message)
    }
  }
  try {
    let resultat = null
    try {
      resultat = await demanderAnnonce(client, contenu, niveau, niveau.recherche, utilisateur, compteur)
    } catch (e) {
      // Si la requête avec recherche web est rejetée, on retente sans recherche.
      if (!(e instanceof Anthropic.BadRequestError)) throw e
      console.error('Recherche web refusée, nouvel essai sans recherche :', e.message)
    }
    // Claude n'a pas appelé l'outil (ou la recherche a échoué) : un essai sans recherche.
    if (!resultat) resultat = await demanderAnnonce(client, contenu, niveau, false, utilisateur, compteur)
    await noterCout(Boolean(resultat))
    if (!resultat) {
      await annuler()
      return res.status(502).json({ erreur: 'L’IA n’a pas rédigé l’annonce' })
    }
    // L'analyse est décomptée seulement maintenant qu'elle a réussi.
    const { data: validee } = await base.rpc('valider_analyse', { p_id: reservation.id })
    if (!validee) return res.status(409).json({ erreur: 'Analyse annulée, réessayez' })

    const a = resultat.annonce
    // Prix : prix neuf × pourcentage selon l'état (case « neuf » du vendeur, sinon état estimé, jamais « neuf »).
    let prix = null
    let explicationPrix = ''
    if (niveau.outil === OUTIL_ANNONCE) {
      const etat = neuf === true ? 'neuf' : a.etat === 'neuf' ? 'tres_bon' : a.etat
      if (a.prix_neuf > 0) {
        ;({ prix, explication: explicationPrix } = prixDepuisNeuf(a.prix_neuf, etat, a.source_prix_neuf))
      } else {
        prix = { conseille: a.prix_conseille, rapide: a.prix_rapide, haut: a.prix_haut }
        explicationPrix = a.explication_prix || ''
      }
    }
    return res.status(200).json({
      titre: a.titre,
      description: formaterDescription(a.description),
      prix,
      explicationPrix,
      tags: a.tags,
      marqueProbable: a.marque_probable || '',
      autresMarques: a.marque_probable ? (a.autres_marques || []).filter((m) => m && m !== a.marque_probable).slice(0, 5) : [],
      modeleProbable: a.modele_probable || '',
      autresModeles: a.modele_probable ? (a.autres_modeles || []).filter((m) => m && m !== a.modele_probable).slice(0, 5) : [],
      modele: resultat.modele,
      typeAnalyse,
    })
  } catch (e) {
    await noterCout(false)
    await annuler()
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
