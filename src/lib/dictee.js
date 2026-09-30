// Dictée vocale.
// - Appli Android : reconnaissance native (plugin Dictee, DicteePlugin.java),
//   car la WebView n'a pas de reconnaissance vocale.
// - Site : reconnaissance du navigateur, phrase par phrase avec reprise
//   automatique (le mode « continu » de Chrome Android répète des mots).
// onTexte(finaux, partiel) reçoit le texte validé et la phrase en cours.
import { registerPlugin } from '@capacitor/core'
import { estAppliNative } from './cameraNative.js'

const Dictee = registerPlugin('Dictee')
const Reconnaissance =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export const dicteeDisponible = () => estAppliNative() || Boolean(Reconnaissance)

const joindre = (a, b) => (a && b ? `${a} ${b}` : a || b)

async function dicteeNative({ onTexte, onFin, onErreur }) {
  let finaux = ''
  const ecoutes = await Promise.all([
    Dictee.addListener('partiel', ({ texte }) => onTexte(finaux, texte)),
    Dictee.addListener('final', ({ texte }) => {
      finaux = joindre(finaux, texte)
      onTexte(finaux, '')
    }),
    Dictee.addListener('erreur', ({ message }) => onErreur(message)),
    Dictee.addListener('fin', () => {
      nettoyer()
      onFin()
    }),
  ])
  const nettoyer = () => ecoutes.forEach((e) => e.remove())
  try {
    await Dictee.demarrer({ langue: 'fr-FR' })
  } catch (e) {
    nettoyer()
    throw e
  }
  return {
    arreter: () => Dictee.arreter().catch(() => {}),
    annuler: () => {
      nettoyer()
      Dictee.arreter().catch(() => {})
    },
  }
}

function dicteeWeb({ onTexte, onFin, onErreur }) {
  let finaux = ''
  let actif = true
  let r = null

  const ecouter = () => {
    r = new Reconnaissance()
    r.lang = 'fr-FR'
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let partiel = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.trim()
        if (e.results[i].isFinal) {
          finaux = joindre(finaux, t)
        } else partiel = joindre(partiel, t)
      }
      onTexte(finaux, partiel)
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech') return // silence : on continue d'écouter
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        actif = false
        onErreur('Autorisez l’accès au micro pour dicter.')
      } else if (e.error === 'network') {
        actif = false
        onErreur('La dictée a besoin d’internet. Vérifiez votre connexion.')
      } else if (e.error !== 'aborted') {
        actif = false
        onErreur('La dictée s’est interrompue. Réessayez.')
      }
    }
    r.onend = () => {
      onTexte(finaux, '')
      if (actif) {
        try {
          ecouter()
          return
        } catch {
          /* on s'arrête */
        }
      }
      actif = false
      document.removeEventListener('visibilitychange', cache)
      onFin()
    }
    r.start()
  }

  // Onglet caché ou écran éteint : on arrête d'écouter.
  const cache = () => {
    if (document.hidden && actif) {
      actif = false
      r?.stop()
    }
  }
  document.addEventListener('visibilitychange', cache)

  ecouter()
  return {
    arreter: () => {
      actif = false
      r?.stop()
    },
    annuler: () => {
      actif = false
      document.removeEventListener('visibilitychange', cache)
      r.onend = null
      r?.abort()
    },
  }
}

// Renvoie { arreter, annuler } ; lève une erreur si la dictée ne peut pas démarrer.
export async function demarrerDictee(rappels) {
  if (estAppliNative()) return dicteeNative(rappels)
  if (!Reconnaissance) throw new Error('La dictée vocale n’est pas disponible sur ce navigateur. Essayez Chrome ou Safari, ou écrivez vos informations.')
  return dicteeWeb(rappels)
}
