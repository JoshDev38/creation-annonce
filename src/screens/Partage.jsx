import Entete from '../components/Entete.jsx'
import { IconChevron, IconCopy, IconPlus, IconSave, IconShare } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { copierTexte } from '../lib/stockage.js'

async function fichiersPhotos(dataUrls) {
  return Promise.all(
    dataUrls.map(async (url, i) => {
      const blob = await (await fetch(url)).blob()
      return new File([blob], `annonce-${i + 1}.jpg`, { type: 'image/jpeg' })
    }),
  )
}

export default function Partage({ annonce, notifier, onSauvegarder, onNouvelle, onRetour }) {
  const texte = texteAnnonce(annonce)

  const copier = async () => {
    notifier((await copierTexte(texte)) ? 'Annonce copiée' : 'Copie impossible')
  }

  const partager = async () => {
    if (!navigator.share) {
      await copier()
      notifier('Partage indisponible : annonce copiée à la place')
      return
    }
    try {
      const photos = await fichiersPhotos(annonce.photos || (annonce.photo ? [annonce.photo] : []))
      const donnees = { title: annonce.titre, text: texte }
      if (photos.length && navigator.canShare?.({ files: photos })) donnees.files = photos
      await navigator.share(donnees)
    } catch (e) {
      if (e.name !== 'AbortError') notifier('Le partage a échoué')
    }
  }

  const options = [
    { Icone: IconCopy, titre: 'La copier', sous: 'Pour la publier où vous voulez', action: copier },
    { Icone: IconShare, titre: 'La partager directement', sous: 'Sur les plateformes de votre choix', action: partager },
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
