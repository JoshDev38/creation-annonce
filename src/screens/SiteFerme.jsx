import { useEffect, useState } from 'react'
import { messageErreur, supabase } from '../lib/supabase.js'

// Site malow.app fermé au public pendant la préparation du lancement : seule l'appli
// fonctionne. Le site garde deux usages liés aux e-mails de compte :
// la confirmation d'adresse et le choix d'un nouveau mot de passe.
// Lien lu avant que Supabase ne nettoie l'adresse (voir index.html).
const lienRecu = (type) => (window.__lienInitial || window.location.hash).includes(`type=${type}`)

export default function SiteFerme() {
  const [mode, setMode] = useState(lienRecu('recovery') ? 'mdp' : lienRecu('signup') ? 'confirme' : 'ferme')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [attente, setAttente] = useState(false)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evenement) => {
      if (evenement === 'PASSWORD_RECOVERY') setMode('mdp')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const changerMotDePasse = async (e) => {
    e.preventDefault()
    setErreur('')
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    setAttente(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: motDePasse })
      if (error) throw error
      await supabase.auth.signOut()
      history.replaceState(null, '', '/')
      setMode('mdp-ok')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setAttente(false)
    }
  }

  return (
    <main className="page site-ferme">
      <img className="site-ferme-logo" src="/icon-192.png" alt="Malow" />
      {mode === 'mdp' ? (
        <>
          <h1 className="titre-l centre">Nouveau mot de passe</h1>
          <form className="formulaire" onSubmit={changerMotDePasse} noValidate>
            <label>
              <span>Mot de passe (8 caractères minimum)</span>
              <input
                className="champ"
                type="password"
                autoComplete="new-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                autoFocus
              />
            </label>
            {erreur && <p className="erreur">{erreur}</p>}
            <button className="bouton bouton-principal" disabled={attente}>
              {attente ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="titre-l centre">
            {mode === 'mdp-ok' ? 'Mot de passe modifié' : mode === 'confirme' ? 'Adresse confirmée !' : 'Malow arrive bientôt'}
          </h1>
          <p className="texte-bleu centre">
            {mode === 'mdp-ok'
              ? 'Vous pouvez vous reconnecter dans l’appli Malow avec votre nouveau mot de passe.'
              : mode === 'confirme'
                ? 'Votre compte est prêt : retournez dans l’appli Malow pour vous connecter.'
                : 'Prenez une photo, Malow s’occupe de l’annonce. L’application est en préparation et sera bientôt disponible sur Google Play.'}
          </p>
          <p className="manuscrit centre">
            Une seconde vie
            <br />
            pour de belles histoires ♡
          </p>
        </>
      )}
      <footer className="site-ferme-bas">
        <a href="mailto:contact@malow.app">contact@malow.app</a>
        <a href="/confidentialite.html">Règles de confidentialité</a>
      </footer>
    </main>
  )
}
