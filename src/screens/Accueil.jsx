import Illustration from '../components/Illustration.jsx'
import { IconCamera, IconClock, IconDiamond, IconPeople } from '../components/Icons.jsx'

const ATOUTS = [
  { Icone: IconClock, texte: ['Gain', 'de temps'] },
  { Icone: IconDiamond, texte: ['Annonces', 'de qualité'] },
  { Icone: IconPeople, texte: ['Vendez', 'plus facilement'] },
]

export default function Accueil({ onPhoto, onGalerie }) {
  return (
    <main className="page page-accueil">
      <h1 className="titre-xl">
        Vous avez l’objet,
        <br />
        nous avons l’annonce.
      </h1>
      <p className="sous-titre brun">
        Prenez une photo,
        <br />
        on s’occupe du reste.
      </p>

      <ul className="atouts">
        {ATOUTS.map(({ Icone, texte }) => (
          <li key={texte[0]}>
            <span className="rond-icone">
              <Icone width={30} height={30} />
            </span>
            <span>
              {texte[0]}
              <br />
              {texte[1]}
            </span>
          </li>
        ))}
      </ul>

      <Illustration />

      <div className="actions">
        <button className="bouton bouton-principal bouton-grand" onClick={onPhoto}>
          <IconCamera width={28} height={28} /> Prendre une photo
        </button>
        <button className="bouton-lien" onClick={onGalerie}>
          ou choisir une photo existante
        </button>
      </div>
    </main>
  )
}
