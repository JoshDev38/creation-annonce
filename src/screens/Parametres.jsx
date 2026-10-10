import { useEffect, useState } from 'react'
import { IconBack, IconChatDots, IconChevron, IconDoc } from '../components/Icons.jsx'
import { supprimerCompte } from '../lib/annoncesCloud.js'
import { lireProfil } from '../lib/profil.js'
import { supabase } from '../lib/supabase.js'

// « Paramètres » : liens utiles, déconnexion et suppression du compte.
export default function Parametres({ session, onRetour, onQuitte, notifier }) {
  const [formule, setFormule] = useState('gratuit')
  const [attente, setAttente] = useState(false)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)

  useEffect(() => {
    if (!session) return
    lireProfil(session.user.id)
      .then((p) => setFormule(p.formule))
      .catch(() => {})
  }, [session])

  const deconnecter = async () => {
    await supabase.auth.signOut()
    notifier('Vous êtes déconnecté')
    onQuitte()
  }

  const supprimer = async () => {
    setConfirmerSuppression(false)
    setAttente(true)
    try {
      await supprimerCompte(session.user.id)
      notifier('Votre compte a été supprimé')
      onQuitte()
    } catch (e) {
      console.error(e)
      notifier('La suppression a échoué. Réessayez.')
    } finally {
      setAttente(false)
    }
  }

  return (
    <main className="page page-sous-compte">
      <header className="sous-compte-haut">
        <button className="abos-retour" onClick={onRetour} aria-label="Retour">
          <IconBack width={24} height={24} />
        </button>
        <h1>Paramètres</h1>
      </header>

      <div className="liste-compte">
        <a href="https://nalow.app/confidentialite.html" target="_blank" rel="noreferrer">
          <span className="icone-compte">
            <IconDoc width={22} height={22} />
          </span>
          <span>
            <strong>Règles de confidentialité</strong>
            <small>Comment Nalow protège vos données</small>
          </span>
          <IconChevron width={18} height={18} />
        </a>
        <a href="mailto:contact@nalow.app">
          <span className="icone-compte">
            <IconChatDots width={22} height={22} />
          </span>
          <span>
            <strong>Nous contacter</strong>
            <small>contact@nalow.app</small>
          </span>
          <IconChevron width={18} height={18} />
        </a>
      </div>

      <div className="actions">
        <button className="bouton bouton-doux" onClick={deconnecter}>
          Se déconnecter
        </button>
        <button
          className="bouton-lien danger supprimer-compte"
          onClick={() => setConfirmerSuppression(true)}
          disabled={attente}
        >
          {attente ? 'Suppression…' : 'Supprimer mon compte Nalow'}
        </button>
      </div>

      {confirmerSuppression && (
        <div
          className="fond-modale"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-suppression"
          onClick={() => setConfirmerSuppression(false)}
        >
          <div className="modale" onClick={(e) => e.stopPropagation()}>
            <h2 id="titre-suppression" className="titre-m">
              Supprimer mon compte ?
            </h2>
            <p>Votre compte, vos annonces, vos photos et vos points de fidélité seront définitivement effacés.</p>
            {formule !== 'gratuit' && (
              <p className="petit">
                La suppression ne résilie pas votre abonnement Google Play : pensez à vous désabonner d’abord depuis
                «&nbsp;Mon abonnement&nbsp;».
              </p>
            )}
            <button className="bouton bouton-danger" onClick={supprimer}>
              Supprimer définitivement
            </button>
            <button className="bouton bouton-doux" onClick={() => setConfirmerSuppression(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
