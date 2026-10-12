// Préférences de vente du vendeur (profils.preferences), communes à l'appli et au
// serveur d'analyse : livraison, foyer, phrase de fin et plateformes favorites.
// Le serveur les ajoute à chaque annonce générée (rubrique Livraison, mentions, phrase de fin).
import { paragraphes } from './paragraphes.js'

export const LIVRAISONS = [
  { cle: 'relais', libelle: 'Point relais', envoi: 'en point relais' },
  { cle: 'main', libelle: 'Remise en main propre' },
  { cle: 'colissimo', libelle: 'Colissimo', envoi: 'en Colissimo' },
  { cle: 'lettre', libelle: 'Lettre suivie', envoi: 'en lettre suivie' },
]

export const MAX_PHRASE_FIN = 200

// Remet les préférences au bon format (valeurs inconnues ignorées).
export function normaliserPreferences(p = {}) {
  const cles = LIVRAISONS.map((l) => l.cle)
  return {
    livraison: Array.isArray(p.livraison) ? p.livraison.filter((c) => cles.includes(c)) : [],
    ville: String(p.ville || '').trim().slice(0, 60),
    non_fumeur: p.non_fumeur === true,
    sans_animaux: p.sans_animaux === true,
    phrase_fin: String(p.phrase_fin || '').trim().slice(0, MAX_PHRASE_FIN),
    plateformes: Array.isArray(p.plateformes) ? p.plateformes.filter((c) => typeof c === 'string').slice(0, 10) : [],
  }
}

const enListe = (mots) => (mots.length < 2 ? mots.join('') : `${mots.slice(0, -1).join(', ')} ou ${mots.at(-1)}`)

// « Envoi soigné en point relais ou en Colissimo, ou remise en main propre possible sur Grenoble. »
export function phraseLivraison(p) {
  const envois = LIVRAISONS.filter((l) => l.envoi && p.livraison.includes(l.cle)).map((l) => l.envoi)
  const main = p.livraison.includes('main') ? `remise en main propre possible${p.ville ? ` sur ${p.ville}` : ''}` : ''
  if (!envois.length && !main) return ''
  const envoi = envois.length ? `envoi soigné ${enListe(envois)}` : ''
  const phrase = [envoi, main].filter(Boolean).join(', ou ')
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`
}

// « Maison non-fumeur et sans animaux. »
export function phraseFoyer(p) {
  if (p.non_fumeur && p.sans_animaux) return 'Maison non-fumeur et sans animaux.'
  if (p.non_fumeur) return 'Maison non-fumeur.'
  if (p.sans_animaux) return 'Maison sans animaux.'
  return ''
}

// Ajoute les préférences à la description générée par l'IA.
export function appliquerPreferences(description, preferences) {
  const p = normaliserPreferences(preferences)
  const blocs = paragraphes(description)
  const livraison = phraseLivraison(p)
  if (livraison) {
    const i = blocs.findIndex((b) => /^Livraison\s*:/i.test(b))
    if (i >= 0) blocs[i] = `Livraison : ${livraison}`
    else blocs.push(`Livraison : ${livraison}`)
  }
  const foyer = phraseFoyer(p)
  if (foyer) blocs.push(foyer)
  if (p.phrase_fin) blocs.push(p.phrase_fin)
  return blocs.join('\n\n')
}
