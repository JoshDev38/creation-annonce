// Envoie les photos et les infos à /api/analyser (fonction Vercel qui interroge Claude).
// En cas d'échec, l'appelant revient au générateur local.
import { estAppliNative } from './cameraNative.js'
import { allegerPhoto } from './stockage.js'
import { supabase } from './supabase.js'

// Dans l'appli installée, la page est servie en local : on vise le site en ligne.
const BASE = import.meta.env.VITE_API_URL ?? (estAppliNative() ? 'https://nalow.app' : '')

export async function analyserAvecIA(photos, infos, neuf = false) {
  // Photos réduites : suffisant pour l'IA, et léger à envoyer.
  const legeres = await Promise.all(photos.map((p) => allegerPhoto(p, 1024, 0.8)))
  // L'analyse est réservée aux utilisateurs connectés : on joint le jeton de session.
  const { data } = await supabase.auth.getSession()
  const jeton = data.session?.access_token
  if (!jeton) throw new Error('Non connecté')
  const controle = new AbortController()
  const minuteur = setTimeout(() => controle.abort(), 115000) // recherche web des prix : jusqu'à ~1 min 30
  try {
    const rep = await fetch(`${BASE}/api/analyser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ photos: legeres, infos, neuf }),
      signal: controle.signal,
    })
    const donnees = await rep.json().catch(() => ({}))
    if (!rep.ok) {
      const err = new Error(donnees.erreur || `Erreur ${rep.status}`)
      // Quota d'annonces épuisé : l'appli propose les abonnements au lieu de l'annonce sans IA.
      if (donnees.code === 'quota') Object.assign(err, { code: 'quota', quota: donnees.quota })
      throw err
    }
    const { titre, description, prix = null, tags, marqueProbable = '', autresMarques = [], modeleProbable = '', autresModeles = [], explicationPrix = '', modele = '', typeAnalyse = '' } = donnees
    // Analyse standard (formule gratuite) : pas d'estimation de prix.
    if (!titre || !description || !Array.isArray(tags) || (typeAnalyse !== 'standard' && !prix?.conseille)) {
      throw new Error('Réponse incomplète')
    }
    return { titre, description, prix, tags, marqueProbable, autresMarques, modeleProbable, autresModeles, explicationPrix, modele, typeAnalyse }
  } finally {
    clearTimeout(minuteur)
  }
}
