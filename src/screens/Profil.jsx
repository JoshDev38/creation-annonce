import { useEffect, useRef, useState } from 'react'
import { IconCamera, IconEdit } from '../components/Icons.jsx'
import { listerAnnoncesCloud, supprimerCompte } from '../lib/annoncesCloud.js'
import { changerAvatar, changerPseudo, lireProfil, PSEUDO_VALIDE } from '../lib/profil.js'
import { photoCarree } from '../lib/stockage.js'
import { supabase } from '../lib/supabase.js'

export default function Profil({ session, onConnexion, notifier }) {
  const [annonces, setAnnonces] = useState(null)
  const [attente, setAttente] = useState(false)
  const [profil, setProfil] = useState(null)
  const [editionPseudo, setEditionPseudo] = useState(false)
  const [pseudo, setPseudo] = useState('')
  const [envoiPhoto, setEnvoiPhoto] = useState(false)
  const champPhoto = useRef(null)

  useEffect(() => {
    if (!session) return
    listerAnnoncesCloud()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
    lireProfil(session.user.id)
      .then(setProfil)
      .catch(() => setProfil({ pseudo: '', avatar: null, avatarUrl: null }))
  }, [session])

  const enregistrerPseudo = async () => {
    const p = pseudo.trim()
    if (!PSEUDO_VALIDE.test(p)) {
      notifier('Pseudo : 2 à 30 caractères (lettres, chiffres, espace, point, tiret)')
      return
    }
    try {
      await changerPseudo(session.user.id, p)
      setProfil((x) => ({ ...x, pseudo: p }))
      setEditionPseudo(false)
      notifier('Pseudo enregistré')
    } catch (e) {
      notifier(e.message === 'Ce pseudo est déjà pris.' ? e.message : 'Enregistrement impossible')
    }
  }

  const photoChoisie = async (e) => {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    setEnvoiPhoto(true)
    try {
      const image = await photoCarree(fichier)
      const chemin = await changerAvatar(session.user.id, image, profil?.avatar)
      setProfil((x) => ({ ...x, avatar: chemin, avatarUrl: image }))
      notifier('Photo de profil mise à jour')
    } catch (err) {
      console.error(err)
      notifier('Impossible d’envoyer la photo')
    } finally {
      setEnvoiPhoto(false)
    }
  }

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
      <div className="carte-profil">
        <button
          className="avatar"
          onClick={() => champPhoto.current?.click()}
          aria-label="Changer la photo de profil"
          disabled={envoiPhoto}
        >
          {profil?.avatarUrl || session.user.user_metadata?.avatar_url ? (
            <img src={profil?.avatarUrl || session.user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="initiale">{(profil?.pseudo || session.user.email || '?').charAt(0).toUpperCase()}</span>
          )}
          <span className="avatar-camera">{envoiPhoto ? '…' : <IconCamera width={16} height={16} />}</span>
        </button>
        <input ref={champPhoto} type="file" accept="image/*" hidden onChange={photoChoisie} />

        {editionPseudo ? (
          <div className="edition-pseudo">
            <input
              className="champ"
              value={pseudo}
              maxLength={30}
              autoFocus
              onChange={(e) => setPseudo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enregistrerPseudo()}
            />
            <button className="bouton-petit" onClick={enregistrerPseudo}>
              OK
            </button>
          </div>
        ) : (
          <button
            className="nom-profil"
            onClick={() => {
              setPseudo(profil?.pseudo || '')
              setEditionPseudo(true)
            }}
          >
            <span>{profil ? profil.pseudo || 'Choisir un pseudo' : '…'}</span>
            <IconEdit width={16} height={16} />
          </button>
        )}
        <p className="petit">{session.user.email}</p>
      </div>
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
        <a className="lien-discret" href="https://malow.app/confidentialite.html" target="_blank" rel="noreferrer">
          Règles de confidentialité
        </a>
      </div>
    </main>
  )
}
