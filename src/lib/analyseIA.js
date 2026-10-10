// Envoie les photos et les infos à /api/analyser (fonction Vercel qui interroge Claude).
// En cas d'échec, l'appelant revient au générateur local.
import { estAppliNative } from './cameraNative.js'
import { allegerPhoto } from './stockage.js'
import { supabase } from './supabase.js'

// Dans l'appli installée, la page est servie en local : on vise le site en ligne.
const BASE = import.meta.env.VITE_API_URL ?? (estAppliNative() ? 'https://nalow.app' : '')

export async function analyserAvecIA(photos, infos) {
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
      body: JSON.stringify({ photos: legeres, infos }),
      signal: controle.signal,
    })
    const donnees = await rep.json().catch(() => ({}))
    if (!rep.ok) throw new Error(donnees.erreur || `Erreur ${rep.status}`)
    const { titre, description, prix, tags, marqueProbable = '', autresMarques = [], modeleProbable = '', autresModeles = [], explicationPrix = '', modele = '' } = donnees
    if (!titre || !description || !prix?.conseille || !Array.isArray(tags)) {
      throw new Error('Réponse incomplète')
    }
    return { titre, description, prix, tags, marqueProbable, autresMarques, modeleProbable, autresModeles, explicationPrix, modele }
  } finally {
    clearTimeout(minuteur)
  }
}
