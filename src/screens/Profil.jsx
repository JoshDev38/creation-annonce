import { useEffect, useState } from 'react'
import { listerAnnoncesCloud, supprimerCompte } from '../lib/annoncesCloud.js'
import { supabase } from '../lib/supabase.js'

export default function Profil({ session, onConnexion, notifier }) {
  const [annonces, setAnnonces] = useState(null)
  const [attente, setAttente] = useState(false)

  useEffect(() => {
    if (!session) return
    listerAnnoncesCloud()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
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

  const total = (annonces || []).reduce((s, a) => s + (a.prix?.conseille || 0), 0)

  const deconnecter = async () => {
    await supabase.auth.signOut()
    notifier('Vous êtes déconnecté')
  }

  const supprimer = async () => {
    if (!confirm('Supprimer définitivement votre compte, vos annonces et vos photos ?')) return
    setAttente(true)
    try {
      await supprimerCompte(session.user.id)
      notifier('Votre compte a été supprimé')
    } catch (e) {
      console.error(e)
      notifier('La suppression a échoué. Réessayez.')
    } finally {
      setAttente(false)
    }
  }

  return (
    <main className="page">
      <h1 className="titre-l">Mon espace</h1>
      <p className="petit">Connecté avec {session.user.email}</p>
      <div className="stats">
        <div>
          <strong>{annonces ? annonces.length : '…'}</strong>
          <span>annonce{annonces?.length > 1 ? 's' : ''} sauvegardée{annonces?.length > 1 ? 's' : ''}</span>
        </div>
        <div>
          <strong>{annonces ? `${total} €` : '…'}</strong>
          <span>de valeur estimée</span>
        </div>
      </div>
      <p className="manuscrit centre">
        Une seconde vie
        <br />
        pour de belles histoires ♡
      </p>
      <div className="actions">
        <button className="bouton bouton-doux" onClick={deconnecter}>
          Se déconnecter
        </button>
        <button className="bouton-lien danger" onClick={supprimer} disabled={attente}>
          {attente ? 'Suppression…' : 'Supprimer mon compte'}
        </button>
      </div>
    </main>
  )
}
