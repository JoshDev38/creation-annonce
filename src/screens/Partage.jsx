import { useEffect, useState } from 'react'
import Entete from '../components/Entete.jsx'
import { IconChevron, IconPlus, IconSave, IconSend, IconShare } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { formaterDescription } from '../lib/paragraphes.js'
import { copierTexte } from '../lib/stockage.js'
import {
  PLATEFORMES,
  applisInstallees,
  iconeSite,
  ouvrirPlateforme,
  partageDisponible,
  partagerAnnonce,
  rangerPhotosGalerie,
} from '../lib/partage.js'
import { estAppliNative } from '../lib/cameraNative.js'
import { afficherBulle, autoriserBulle, bulleAutorisee, iconesApplis } from '../lib/bulle.js'
import { gagnerPoints } from '../lib/fidelite.js'

const Badge = ({ lettres }) => <span className="badge-plateforme">{lettres}</span>

// Icône réelle : celle de l'appli installée, sinon celle du site, sinon les initiales.
function IconePlateforme({ cle, icone }) {
  const [echec, setEchec] = useState(false)
  if (echec) return <Badge lettres={PLATEFORMES[cle].lettres} />
  return <img className="icone-plateforme" src={icone || iconeSite(cle)} alt="" onError={() => setEchec(true)} />
}

export default function Partage({ annonce, notifier, onSauvegarder, onNouvelle, onRetour }) {
  const texte = texteAnnonce(annonce)
  const [choixOuvert, setChoixOuvert] = useState(false)
  const [installees, setInstallees] = useState({})
  const [icones, setIcones] = useState({})

  useEffect(() => {
    applisInstallees().then(setInstallees).catch(() => {})
    iconesApplis(Object.values(PLATEFORMES).map((p) => p.paquet)).then(setIcones)
  }, [])

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
    let rangees = []
    try {
      rangees = await rangerPhotosGalerie(photosAnnonce(), annonce.id)
    } catch (e) {
      console.error('Photos non enregistrées dans la galerie', e)
    }
    const photosPretes = rangees.length ? 'photos dans l’album « Malow »' : ''

    let bulle = false
    if (avecBulle) {
      try {
        await afficherBulle({
          titre: annonce.titre,
          description: descriptionPlateforme,
          prix: annonce.prix?.conseille,
          photos: rangees,
        })
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
    // Fidélité : points de publication (seulement pour une annonce sauvegardée dans le compte).
    gagnerPoints('annonce_publiee', annonce.id).catch(() => {})
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
    { Icone: IconSend, titre: 'Publier', sous: 'Vinted, Leboncoin, eBay et d’autres', action: () => setChoixOuvert(true) },
    { Icone: IconSave, titre: 'La sauvegarder', sous: 'Dans votre espace', action: onSauvegarder },
  ]

  const choisir = (action) => {
    setChoixOuvert(false)
    action()
  }

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

      {choixOuvert && (
        <div className="fond-modale" role="dialog" aria-modal="true" aria-labelledby="titre-choix" onClick={() => setChoixOuvert(false)}>
          <div className="modale feuille-plateformes" onClick={(e) => e.stopPropagation()}>
            <h2 id="titre-choix" className="titre-m">Où publier ?</h2>
            <div className="grille-plateformes">
              {Object.entries(PLATEFORMES).map(([cle, p]) => (
                <button key={cle} className="tuile-plateforme" onClick={() => choisir(() => choisirPlateforme(cle))}>
                  <span className="carre-icone icone-appli">
                    <IconePlateforme key={icones[p.paquet] ? 'appli' : 'site'} cle={cle} icone={icones[p.paquet]} />
                  </span>
                  <strong>{p.nom}</strong>
                  <small>{p.genre}</small>
                  {estAppliNative() && <em>{installees[cle] ? 'Appli installée' : 'Site web'}</em>}
                </button>
              ))}
            </div>
            <button className="carte-choix compacte" onClick={() => choisir(partager)}>
              <span className="carre-icone">
                <IconShare width={22} height={22} />
              </span>
              <span className="carte-texte">
                <strong>Autre appli</strong>
                <small>WhatsApp, Instagram, e-mail…</small>
              </span>
              <IconChevron width={20} height={20} />
            </button>
            <p className="note-publication">
              {estAppliNative()
                ? 'Les photos vont dans l’album « Malow » de votre galerie, et la bulle Malow garde le titre, la description et le prix à portée de main.'
                : 'La description est copiée : collez-la dans le formulaire du site.'}
            </p>
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
          </div>
        </div>
      )}

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
