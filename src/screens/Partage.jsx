import { useState } from 'react'
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
import { afficherBulle, autoriserBulle, bulleAutorisee } from '../lib/bulle.js'

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

  const [demandeBulle, setDemandeBulle] = useState(null) // plateforme en attente d'autorisation

  const photosAnnonce = () => annonce.photos || (annonce.photo ? [annonce.photo] : [])

  // Vinted et Leboncoin ont des champs séparés (titre, description, prix) et ne
  // se laissent pas remplir par une autre appli. Dans l'appli Android, une bulle
  // Malow reste par-dessus pour copier chaque champ. Sinon (site, ou bulle
  // refusée), on copie la description.
  const publierSur = async (cle, avecBulle) => {
    const nom = PLATEFORMES[cle].nom
    const descriptionPlateforme = cle === 'vinted' ? `${description}\n\n${hashtags}` : description
    let rangees = 0
    try {
      rangees = await rangerPhotosGalerie(photosAnnonce(), annonce.id)
    } catch (e) {
      console.error('Photos non enregistrées dans la galerie', e)
    }
    const photosPretes = rangees ? 'photos dans l’album « Malow »' : ''

    let bulle = false
    if (avecBulle) {
      try {
        await afficherBulle({ titre: annonce.titre, description: descriptionPlateforme, prix: annonce.prix?.conseille })
        bulle = true
      } catch (e) {
        console.error('Bulle impossible', e)
      }
    }
    // Le titre est le premier champ demandé : on le copie d'avance.
    const copie = await copierTexte(bulle ? annonce.titre : descriptionPlateforme)
    const etapes = [
      bulle ? 'titre copié, la bulle Malow a le reste' : copie && 'description copiée',
      photosPretes,
    ].filter(Boolean)
    notifier(etapes.length ? `${etapes.join(' · ')} : ouverture de ${nom}…` : `Ouverture de ${nom}…`)
    // Laisse le temps de lire le message avant de quitter Malow.
    setTimeout(() => {
      ouvrirPlateforme(cle).catch((e) => notifier(`Impossible d’ouvrir ${nom} (${e?.message || e})`))
    }, 1400)
  }

  const choisirPlateforme = async (cle) => {
    if (!estAppliNative()) return publierSur(cle, false)
    if (await bulleAutorisee()) return publierSur(cle, true)
    setDemandeBulle(cle)
  }

  const reponseBulle = async (accepte) => {
    const cle = demandeBulle
    setDemandeBulle(null)
    const ok = accepte && (await autoriserBulle())
    if (accepte && !ok) notifier('Bulle non autorisée : la description sera copiée à la place')
    publierSur(cle, ok)
  }

  const options = [
    { Icone: () => <Badge lettres="V" />, titre: 'Publier sur Vinted', sous: 'Photos et texte prêts à coller', action: () => choisirPlateforme('vinted') },
    { Icone: () => <Badge lettres="lbc" />, titre: 'Publier sur Leboncoin', sous: 'Photos et texte prêts à coller', action: () => choisirPlateforme('leboncoin') },
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
            Vinted et Leboncoin ne se laissent pas remplir par une autre appli : les photos vont dans l’album
            « Malow » de votre galerie, et une bulle Malow reste par-dessus l’appli pour copier le titre, la
            description et le prix, un par un.
          </p>
        )}
        {!estAppliNative() && (
        <div className="copies-rapides">
          <button className="bouton-lien" onClick={() => copierPartie(annonce.titre, 'Titre copié')}>
            Copier le titre
          </button>
          <button className="bouton-lien" onClick={() => copierPartie(description, 'Description copiée')}>
            Copier la description
          </button>
        </div>
        )}
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

      {demandeBulle && (
        <div className="fond-modale" role="dialog" aria-modal="true" aria-labelledby="titre-bulle">
          <div className="modale">
            <div className="bulle-demo" aria-hidden="true">
              <img src="./icon-192.png" alt="" />
            </div>
            <h2 id="titre-bulle" className="titre-m">Une bulle pour copier-coller</h2>
            <p>
              Pendant que vous remplissez votre annonce sur {PLATEFORMES[demandeBulle].nom}, une petite bulle Malow reste
              au bord de l’écran. Touchez-la : titre, description et prix sont là, un appui pour copier, un appui long
              dans {PLATEFORMES[demandeBulle].nom} pour coller.
            </p>
            <p className="petit">
              Android va vous demander d’autoriser Malow à « s’afficher par-dessus les autres applis ». Activez
              l’interrupteur, puis revenez avec la flèche retour.
            </p>
            <button className="bouton bouton-principal" onClick={() => reponseBulle(true)}>
              Autoriser la bulle
            </button>
            <button className="bouton-lien" onClick={() => reponseBulle(false)}>
              Non merci, juste copier la description
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
