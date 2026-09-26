import photoFond from '../assets/accueil-fond.webp'
import { IconCamera, IconClock, IconDiamondSparkle, IconPeopleFilled } from '../components/Icons.jsx'

const ATOUTS = [
  { Icone: IconClock, texte: ['Gain', 'de temps'] },
  { Icone: IconDiamondSparkle, texte: ['Annonces', 'de qualité'] },
  { Icone: IconPeopleFilled, texte: ['Vendez', 'plus facilement'] },
]

export default function Accueil({ onPhoto, onGalerie }) {
  return (
    <main className="page page-accueil">
      <div className="accueil-haut">
        <h1 className="accroche">
          <span>Vous avez l’objet,</span>
          <span className="accroche-bleue">nous avons l’annonce.</span>
        </h1>
        <p className="accroche-sous">
          Prenez une photo,
          <br />
          on s’occupe du reste.
        </p>

        <ul className="atouts">
          {ATOUTS.map(({ Icone, texte }) => (
            <li key={texte[0]}>
              <span className="rond-atout">
                <Icone width={36} height={36} />
              </span>
              <span>
                {texte[0]}
                <br />
                {texte[1]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="scene">
        <img
          src={photoFond}
          alt="Un carton rempli d’objets dans un salon ensoleillé : ourson en peluche, livres, plaid, coussin et petite voiture en bois"
        />
        <p className="mot-carton" aria-hidden="true">
          <span className="trait trait-g1" />
          <span className="trait trait-g2" />
          À vendre ?
          <br />
          C’est déjà presque fait !
          <span className="trait trait-d1" />
          <span className="trait trait-d2" />
          <span className="coeur">♡</span>
        </p>
      </div>

      <div className="scene-actions">
        <button className="bouton-photo" onClick={onPhoto}>
          <IconCamera width={30} height={30} /> Prendre une photo
        </button>
        <button className="lien-galerie" onClick={onGalerie}>
          ou choisir une photo existante
        </button>
      </div>
    </main>
  )
}
