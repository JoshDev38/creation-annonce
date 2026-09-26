import { useRef, useState } from 'react'
import TabBar from './components/TabBar.jsx'
import Accueil from './screens/Accueil.jsx'
import PhotoPrise from './screens/PhotoPrise.jsx'
import Detail from './screens/Detail.jsx'
import Analyse from './screens/Analyse.jsx'
import Resultat from './screens/Resultat.jsx'
import Partage from './screens/Partage.jsx'
import MesAnnonces from './screens/MesAnnonces.jsx'
import Conseils from './screens/Conseils.jsx'
import Profil from './screens/Profil.jsx'
import { genererAnnonce } from './lib/generateur.js'
import { enregistrerAnnonce, reduirePhoto } from './lib/stockage.js'

const AVEC_ONGLETS = ['accueil', 'partage', 'annonces', 'conseils', 'profil']

export default function App() {
  const [ecran, setEcran] = useState('accueil')
  const [photo, setPhoto] = useState(null)
  const [infos, setInfos] = useState('')
  const [annonce, setAnnonce] = useState(null)
  const [toast, setToast] = useState(null)
  const [origine, setOrigine] = useState('detail')
  const champPhoto = useRef(null)
  const champGalerie = useRef(null)

  const notifier = (message) => {
    setToast(message)
    clearTimeout(notifier.timer)
    notifier.timer = setTimeout(() => setToast(null), 2200)
  }

  const prendrePhoto = () => champPhoto.current?.click()
  const choisirGalerie = () => champGalerie.current?.click()

  const photoChoisie = async (e) => {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    try {
      setPhoto(await reduirePhoto(fichier))
      setEcran('photo')
    } catch {
      notifier('Impossible de lire cette photo')
    }
  }

  const lancerAnalyse = (texte) => {
    setInfos(texte)
    setEcran('analyse')
  }

  const analyseTerminee = () => {
    setOrigine('detail')
    setAnnonce({
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      photo,
      infos,
      ...genererAnnonce(infos),
    })
    setEcran('resultat')
  }

  const sauvegarder = (a = annonce) => {
    const ok = enregistrerAnnonce(a)
    notifier(ok ? 'Annonce sauvegardée' : 'Stockage plein : supprimez une annonce')
  }

  const nouvelleAnnonce = () => {
    setPhoto(null)
    setInfos('')
    setAnnonce(null)
    setEcran('accueil')
    prendrePhoto()
  }

  const ouvrirAnnonce = (a) => {
    setAnnonce(a)
    setPhoto(a.photo)
    setInfos(a.infos || '')
    setOrigine('annonces')
    setEcran('resultat')
  }

  let contenu
  switch (ecran) {
    case 'photo':
      contenu = (
        <PhotoPrise
          photo={photo}
          onRetour={() => setEcran('accueil')}
          onContinuer={() => setEcran('detail')}
          onReprendre={prendrePhoto}
        />
      )
      break
    case 'detail':
      contenu = (
        <Detail
          valeurInitiale={infos}
          onRetour={() => setEcran('photo')}
          onValider={lancerAnalyse}
        />
      )
      break
    case 'analyse':
      contenu = <Analyse onFini={analyseTerminee} />
      break
    case 'resultat':
      contenu = (
        <Resultat
          annonce={annonce}
          onChange={setAnnonce}
          onCopie={() => notifier('Annonce copiée')}
          onSuivant={() => setEcran('partage')}
          onRetour={() => setEcran(origine)}
        />
      )
      break
    case 'partage':
      contenu = (
        <Partage
          annonce={annonce}
          notifier={notifier}
          onSauvegarder={() => sauvegarder()}
          onNouvelle={nouvelleAnnonce}
          onRetour={() => setEcran('resultat')}
        />
      )
      break
    case 'annonces':
      contenu = <MesAnnonces onOuvrir={ouvrirAnnonce} onNouvelle={nouvelleAnnonce} />
      break
    case 'conseils':
      contenu = <Conseils />
      break
    case 'profil':
      contenu = <Profil />
      break
    default:
      contenu = <Accueil onPhoto={prendrePhoto} onGalerie={choisirGalerie} />
  }

  return (
    <div className="app">
      <div className="ecran" key={ecran}>
        {contenu}
      </div>
      {AVEC_ONGLETS.includes(ecran) && (
        <TabBar
          actif={ecran}
          onChange={(cible) => (cible === 'nouveau' ? nouvelleAnnonce() : setEcran(cible))}
        />
      )}
      <input
        ref={champPhoto}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={photoChoisie}
      />
      <input ref={champGalerie} type="file" accept="image/*" hidden onChange={photoChoisie} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
