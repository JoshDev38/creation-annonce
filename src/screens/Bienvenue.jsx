import BoutonGoogle from '../components/BoutonGoogle.jsx'

// Écran affiché au lancement quand personne n'est connecté.
export default function Bienvenue({ onInscription, onConnexion, onDecouvrir, notifier }) {
  return (
    <main className="page page-bienvenue">
      <div className="bienvenue-haut">
        <img className="logo-bienvenue" src="./icon-512.png" alt="Malow" />
        <h1 className="titre-xl">Bienvenue sur Malow</h1>
        <p className="accroche-sous">
          Prenez une photo,
          <br />
          on s’occupe de l’annonce.
        </p>
      </div>
      <div className="actions">
        <BoutonGoogle notifier={notifier} />
        <div className="separateur">ou avec votre e-mail</div>
        <button className="bouton bouton-principal" onClick={onInscription}>
          Créer un compte
        </button>
        <button className="bouton bouton-doux" onClick={onConnexion}>
          J’ai déjà un compte
        </button>
        <button className="bouton-lien" onClick={onDecouvrir}>
          Découvrir sans compte
        </button>
      </div>
    </main>
  )
}
