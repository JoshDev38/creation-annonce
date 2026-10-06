import { useEffect, useRef, useState } from 'react'
import { IconBack, IconCamera, IconEdit } from '../components/Icons.jsx'
import { listerAnnoncesCloud } from '../lib/annoncesCloud.js'
import { changerAvatar, changerPseudo, lireProfil, PSEUDO_VALIDE } from '../lib/profil.js'
import { photoCarree } from '../lib/stockage.js'
import { chargerFidelite } from '../lib/fidelite.js'

// « Mon profil » : photo, pseudo, adresse e-mail et chiffres clés.
export default function MonProfil({ session, onRetour, onVoirAnnonces, onFidelite, notifier }) {
  const [annonces, setAnnonces] = useState(null)
  const [fidelite, setFidelite] = useState(null)
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
    chargerFidelite()
      .then(setFidelite)
      .catch(() => setFidelite(null))
    lireProfil(session.user.id)
      .then(setProfil)
      .catch(() => setProfil({ pseudo: '', avatar: null, avatarUrl: null }))
  }, [session])

  if (!session) return <main className="page" />

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

  return (
    <main className="page page-sous-compte">
      <header className="sous-compte-haut">
        <button className="abos-retour" onClick={onRetour} aria-label="Retour">
          <IconBack width={24} height={24} />
        </button>
        <h1>Mon profil</h1>
      </header>

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
        <button onClick={onVoirAnnonces}>
          <strong>{annonces ? annonces.length : '…'}</strong>
          <span>annonce{annonces?.length > 1 ? 's' : ''} sauvegardée{annonces?.length > 1 ? 's' : ''}</span>
          <em>Voir ›</em>
        </button>
        <button onClick={onFidelite}>
          <strong>{fidelite ? `${fidelite.total}` : '…'}</strong>
          <span>points de fidélité</span>
          <em>Fidélité ›</em>
        </button>
      </div>
      <p className="petit centre">Touchez la photo ou le pseudo pour les modifier.</p>
    </main>
  )
}
