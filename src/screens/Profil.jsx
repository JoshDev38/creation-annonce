import { useEffect, useState } from 'react'
import {
  IconChevron,
  IconCrownFilled,
  IconGearFilled,
  IconPawFilled,
  IconUserFilled,
} from '../components/Icons.jsx'
import { chargerFidelite } from '../lib/fidelite.js'
import oursCompte from '../assets/compte/ours-compte.png'

// Onglet « Profil » : le menu « Mon compte ».
export default function Profil({ session, onConnexion, onMonProfil, onFidelite, onMonAbonnement, onParametres }) {
  const [fidelite, setFidelite] = useState(null)

  useEffect(() => {
    if (!session) return
    chargerFidelite()
      .then(setFidelite)
      .catch(() => setFidelite(null))
  }, [session])

  if (!session) {
    return (
      <main className="page">
        <h1 className="titre-l">Mon espace</h1>
        <img className="logo-connexion" src="./icon-192.png" alt="" />
        <p className="texte-bleu centre">
          Créez un compte gratuit pour lancer l’analyse IA de vos photos et retrouver vos annonces sur tous vos
          appareils.
        </p>
        <div className="actions">
          <button className="bouton bouton-principal" onClick={() => onConnexion('inscription')}>
            Créer un compte
          </button>
          <button className="bouton bouton-doux" onClick={() => onConnexion('connexion')}>
            J’ai déjà un compte
          </button>
        </div>
      </main>
    )
  }

  const reste = fidelite?.suivant ? fidelite.suivant.points_min - fidelite.total : 0

  return (
    <main className="page page-compte">
      <header className="compte-haut">
        <div>
          <h1>
            Mon
            <br />
            <span>compte</span>
          </h1>
          <p>Tout en un seul endroit pour gérer votre utilisation de Nalow.</p>
        </div>
        <img src={oursCompte} alt="" aria-hidden="true" />
      </header>

      <nav className="menu-compte">
        <button onClick={onMonProfil}>
          <span className="pastille-compte">
            <IconUserFilled width={30} height={30} />
          </span>
          <span className="texte-compte">
            <strong>Mon profil</strong>
            <small>Voir et modifier mes informations</small>
          </span>
          <IconChevron width={22} height={22} />
        </button>

        <button className="bleu niveau-compte" onClick={onFidelite}>
          <span className="pastille-compte">
            <IconPawFilled width={32} height={32} />
          </span>
          <span className="texte-compte">
            <strong>Mon niveau</strong>
            <em>{fidelite?.actuel?.nom || '…'}</em>
            {fidelite && (
              <>
                <span className="jauge-compte">
                  <span className="jauge">
                    <span style={{ width: `${Math.round(fidelite.progression * 100)}%` }} />
                  </span>
                  <b>
                    {fidelite.total}
                    {fidelite.suivant ? ` / ${fidelite.suivant.points_min}` : ''} pts
                  </b>
                </span>
                <small>
                  {fidelite.suivant
                    ? `Plus que ${reste} point${reste > 1 ? 's' : ''} pour atteindre le niveau suivant !`
                    : 'Vous avez atteint le plus haut niveau, bravo !'}
                </small>
              </>
            )}
          </span>
          <IconChevron width={22} height={22} />
        </button>

        <button onClick={onMonAbonnement}>
          <span className="pastille-compte">
            <IconCrownFilled width={30} height={30} />
          </span>
          <span className="texte-compte">
            <strong>Mon abonnement</strong>
            <small>Voir mon offre et gérer mes options</small>
          </span>
          <IconChevron width={22} height={22} />
        </button>

        <button onClick={onParametres}>
          <span className="pastille-compte">
            <IconGearFilled width={30} height={30} />
          </span>
          <span className="texte-compte">
            <strong>Paramètres</strong>
            <small>Préférences de l’application</small>
          </span>
          <IconChevron width={22} height={22} />
        </button>
      </nav>
    </main>
  )
}
