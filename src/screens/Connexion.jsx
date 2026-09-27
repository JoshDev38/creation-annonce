import { useState } from 'react'
import Entete from '../components/Entete.jsx'
import { URL_SITE } from '../lib/configSupabase.js'
import { messageErreur, supabase } from '../lib/supabase.js'
import { PSEUDO_VALIDE, pseudoDisponible } from '../lib/profil.js'

const TITRES = {
  connexion: 'Se connecter',
  inscription: 'Créer un compte',
  oubli: 'Mot de passe oublié',
  nouveau: 'Nouveau mot de passe',
}

// mode : connexion | inscription | oubli | nouveau (après le lien « mot de passe oublié »)
export default function Connexion({ modeInitial = 'connexion', raison, onRetour, onConnecte, notifier }) {
  const [mode, setMode] = useState(modeInitial)
  const [email, setEmail] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voir, setVoir] = useState(false)
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')

  const changerMode = (m) => {
    setMode(m)
    setErreur('')
    setInfo('')
  }

  const valider = async (e) => {
    e.preventDefault()
    setErreur('')
    setInfo('')
    if (mode !== 'nouveau' && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur('Adresse e-mail invalide.')
      return
    }
    if (mode === 'inscription' && !PSEUDO_VALIDE.test(pseudo.trim())) {
      setErreur('Pseudo : 2 à 30 caractères (lettres, chiffres, espace, point, tiret).')
      return
    }
    if ((mode === 'inscription' || mode === 'nouveau') && motDePasse.length < 8) {
      setErreur('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    setAttente(true)
    try {
      if (mode === 'connexion') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
        if (error) throw error
        onConnecte()
      } else if (mode === 'inscription') {
        if (!(await pseudoDisponible(pseudo.trim()))) {
          setErreur('Ce pseudo est déjà pris, choisissez-en un autre.')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: motDePasse,
          options: { emailRedirectTo: URL_SITE, data: { pseudo: pseudo.trim() } },
        })
        if (error) throw error
        if (data.session) onConnecte()
        else {
          setInfo(
            `Compte créé ! Nous avons envoyé un lien de confirmation à ${email.trim()}. ` +
              'Cliquez dessus, puis revenez vous connecter.',
          )
          setMode('connexion')
          setMotDePasse('')
        }
      } else if (mode === 'oubli') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: URL_SITE })
        if (error) throw error
        setInfo('Si un compte existe avec cet e-mail, vous allez recevoir un lien pour choisir un nouveau mot de passe.')
      } else {
        const { error } = await supabase.auth.updateUser({ password: motDePasse })
        if (error) throw error
        notifier('Mot de passe modifié')
        onConnecte()
      }
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setAttente(false)
    }
  }

  return (
    <main className="page page-connexion">
      <Entete onRetour={onRetour} />
      <img className="logo-connexion" src="./icon-192.png" alt="Malow" />
      <h1 className="titre-l centre">{TITRES[mode]}</h1>
      {raison && mode !== 'nouveau' && <p className="texte-bleu centre">{raison}</p>}

      <form className="formulaire" onSubmit={valider} noValidate>
        {mode === 'inscription' && (
          <label>
            <span>Pseudo</span>
            <input
              className="champ"
              autoComplete="nickname"
              maxLength={30}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Le nom affiché sur votre profil"
              required
            />
          </label>
        )}
        {mode !== 'nouveau' && (
          <label>
            <span>E-mail</span>
            <input
              className="champ"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              required
            />
          </label>
        )}
        {mode !== 'oubli' && (
          <label>
            <span>{mode === 'nouveau' ? 'Nouveau mot de passe' : 'Mot de passe'}</span>
            <div className="champ-mdp">
              <input
                className="champ"
                type={voir ? 'text' : 'password'}
                autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder={mode === 'connexion' ? '' : '8 caractères minimum'}
                required
              />
              <button type="button" className="bouton-lien" onClick={() => setVoir(!voir)}>
                {voir ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </label>
        )}

        {erreur && <p className="erreur">{erreur}</p>}
        {info && <p className="info">{info}</p>}

        <button className="bouton bouton-principal" type="submit" disabled={attente}>
          {attente
            ? 'Un instant…'
            : { connexion: 'Se connecter', inscription: 'Créer mon compte', oubli: 'Recevoir le lien', nouveau: 'Enregistrer' }[mode]}
        </button>
      </form>

      <div className="liens-connexion">
        {mode === 'connexion' && (
          <>
            <button className="bouton-lien" onClick={() => changerMode('oubli')}>
              Mot de passe oublié ?
            </button>
            <p>
              Pas encore de compte ?{' '}
              <button className="bouton-lien" onClick={() => changerMode('inscription')}>
                Créer un compte
              </button>
            </p>
          </>
        )}
        {(mode === 'inscription' || mode === 'oubli') && (
          <p>
            Déjà un compte ?{' '}
            <button className="bouton-lien" onClick={() => changerMode('connexion')}>
              Se connecter
            </button>
          </p>
        )}
      </div>
    </main>
  )
}
