import photoBoite from '../assets/accueil-boite.jpg'
import { IconCamera, IconClock, IconDiamondSparkle, IconPeopleFilled } from '../components/Icons.jsx'

const ATOUTS = [
  { Icone: IconClock, texte: ['Gain', 'de temps'] },
  { Icone: IconDiamondSparkle, texte: ['Annonces', 'de qualité'] },
  { Icone: IconPeopleFilled, texte: ['Vendez', 'plus facilement'] },
]

export default function Accueil({ onPhoto, onGalerie }) {
  return (
    <main className="page page-accueil">
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

      <div className="scene">
        <img
          src={photoBoite}
          alt="Un carton rempli d’objets : ourson en peluche, livres, plaid et petite voiture en bois. Sur le carton : « À vendre ? C’est déjà presque fait ! »"
        />
        <div className="scene-actions">
          <button className="bouton-photo" onClick={onPhoto}>
            <IconCamera width={30} height={30} /> Prendre une photo
          </button>
          <button className="lien-galerie" onClick={onGalerie}>
            ou choisir une photo existante
          </button>
        </div>
      </div>
    </main>
  )
}
