import { IconBack } from './Icons.jsx'

export default function Entete({ onRetour, droite }) {
  return (
    <header className="entete">
      {onRetour ? (
        <button className="lien-retour" onClick={onRetour} aria-label="Retour">
          <IconBack width={22} height={22} />
        </button>
      ) : (
        <span />
      )}
      {droite}
    </header>
  )
}
