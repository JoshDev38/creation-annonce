import photoAccueil from '../assets/accueil.png'

export default function Illustration() {
  return (
    <div className="illustration">
      <img
        src={photoAccueil}
        alt="Un carton rempli d’objets à qui donner une seconde vie : ourson en peluche, livres, lampe et plaid"
      />
      <p className="etiquette-manuscrite">
        Vos objets peuvent encore
        <br />
        faire des heureux ♡
      </p>
    </div>
  )
}
