import Entete from '../components/Entete.jsx'
import { IconChevron, IconPlus, IconSave, IconShare } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { formaterDescription } from '../lib/paragraphes.js'
import { copierTexte } from '../lib/stockage.js'
import {
  PLATEFORMES,
  ouvrirPlateforme,
  partageDisponible,
  partagerAnnonce,
  rangerPhotosGalerie,
} from '../lib/partage.js'
import { estAppliNative } from '../lib/cameraNative.js'

const Badge = ({ lettres }) => <span className="badge-plateforme">{lettres}</span>

export default function Partage({ annonce, notifier, onSauvegarder, onNouvelle, onRetour }) {
  const texte = texteAnnonce(annonce)

  // Vinted et Leboncoin ne reprennent que les photos partagées : le texte est
  // donc aussi copié, prêt à être collé dans le formulaire de l'appli choisie.
  const partager = async () => {
    const copie = await copierTexte(texte)
    if (!partageDisponible()) {
      notifier(copie ? 'Annonce copiée : collez-la sur le site de votre choix' : 'Copie impossible')
      return
    }
    try {
      const photos = annonce.photos || (annonce.photo ? [annonce.photo] : [])
      const envoyee = await partagerAnnonce(annonce.titre, texte, photos)
      if (envoyee && copie) notifier('Texte copié : collez-le dans votre annonce')
    } catch (e) {
      console.error(e)
      const detail = e?.message ? ` (${e.message})` : ''
      notifier((copie ? 'Le partage a échoué, mais l’annonce est copiée' : 'Le partage a échoué') + detail)
    }
  }

  const description = formaterDescription(annonce.description)
  const hashtags = annonce.tags.map((t) => `#${t.replace(/[\s/]+/g, '')}`).join(' ')

  const copierPartie = async (partie, message) => {
    notifier((await copierTexte(partie)) ? message : 'Copie impossible')
  }

  // Vinted et Leboncoin ont des champs séparés (titre, description, prix) :
  // on copie la description seule, le titre se copie avec son propre bouton.
  const publierSur = async (cle) => {
    const copie = await copierTexte(cle === 'vinted' ? `${description}\n\n${hashtags}` : description)
    let rangees = 0
    try {
      rangees = await rangerPhotosGalerie(annonce.photos || (annonce.photo ? [annonce.photo] : []), annonce.id)
    } catch (e) {
      console.error('Photos non enregistrées dans la galerie', e)
    }
    const etapes = [copie && 'description copiée', rangees && 'photos dans l’album « Malow »'].filter(Boolean)
    notifier(etapes.length ? `${etapes.join(', ')} : ouverture de ${PLATEFORMES[cle].nom}…` : `Ouverture de ${PLATEFORMES[cle].nom}…`)
    // Laisse le temps de lire le message avant de quitter Malow.
    setTimeout(() => {
      ouvrirPlateforme(cle).catch((e) => notifier(`Impossible d’ouvrir ${PLATEFORMES[cle].nom} (${e?.message || e})`))
    }, 1400)
  }

  const options = [
    { Icone: () => <Badge lettres="V" />, titre: 'Publier sur Vinted', sous: 'Description et photos prêtes', action: () => publierSur('vinted') },
    { Icone: () => <Badge lettres="lbc" />, titre: 'Publier sur Leboncoin', sous: 'Description et photos prêtes', action: () => publierSur('leboncoin') },
    { Icone: IconShare, titre: 'Autres applis', sous: 'Facebook, Instagram, WhatsApp…', action: partager },
    { Icone: IconSave, titre: 'La sauvegarder', sous: 'Dans votre espace', action: onSauvegarder },
  ]

  return (
    <main className="page page-partage">
      <Entete onRetour={onRetour} />

      <div className="fete" aria-hidden="true">
        <svg viewBox="0 0 90 70">
          <path d="M18 64 34 22l26 26z" fill="#A8CBE0" stroke="#6E9BB8" strokeWidth="1.5" />
          <path d="M26 44l14 14M30 34l20 20" stroke="#fff" strokeWidth="2" />
          <g stroke="#6E9BB8" strokeWidth="2" strokeLinecap="round">
            <path d="M44 16l3-10M54 22l8-6M60 32l10-1M40 10l-2-6" />
          </g>
          <g fill="#D9BFAF">
            <circle cx="66" cy="10" r="2.5" />
            <circle cx="74" cy="44" r="2" />
            <rect x="50" y="4" width="4" height="4" transform="rotate(20 52 6)" />
          </g>
          <path d="M80 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#8DB5CF" />
        </svg>
      </div>

      <h1 className="titre-l centre">Votre annonce est prête !</h1>
      <p className="texte-bleu centre">Que souhaitez-vous faire maintenant ?</p>

      <div className="liste-cartes">
        {options.map(({ Icone, titre, sous, action }) => (
          <button key={titre} className="carte-choix compacte" onClick={action}>
            <span className="carre-icone">
              <Icone width={24} height={24} />
            </span>
            <span className="carte-texte">
              <strong>{titre}</strong>
              <small>{sous}</small>
            </span>
            <IconChevron width={20} height={20} />
          </button>
        ))}
        {estAppliNative() && (
          <p className="note-publication">
            Vinted et Leboncoin ne reçoivent pas les annonces partagées : Malow copie la description et range les
            photos dans l’album « Malow » de votre galerie. Dans l’appli, choisissez ces photos et collez la
            description dans son champ. Pour le titre, revenez ici :
          </p>
        )}
        <div className="copies-rapides">
          <button className="bouton-lien" onClick={() => copierPartie(annonce.titre, 'Titre copié')}>
            Copier le titre
          </button>
          <button className="bouton-lien" onClick={() => copierPartie(description, 'Description copiée')}>
            Copier la description
          </button>
        </div>
        <button className="carte-choix compacte" onClick={onNouvelle}>
          <span className="carre-icone sans-fond">
            <IconPlus width={26} height={26} />
          </span>
          <span className="carte-texte">
            <strong>Créer une nouvelle annonce</strong>
          </span>
          <IconChevron width={20} height={20} />
        </button>
      </div>
    </main>
  )
}
