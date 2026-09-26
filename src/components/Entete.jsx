import { IconBack } from './Icons.jsx'

export default function Entete({ onRetour, droite }) {
  return (
    <header className="entete">
      {onRetour ? (
        <button className="lien-retour" onClick={onRetour}>
          <IconBack width={20} height={20} /> Retour
        </button>
      ) : (
        <span />
      )}
      {droite}
    </header>
  )
}
