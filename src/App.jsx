import { useRef, useState } from 'react'
import TabBar from './components/TabBar.jsx'
import Accueil from './screens/Accueil.jsx'
import PrisePhotos, { MAX_PHOTOS } from './screens/PrisePhotos.jsx'
import Detail from './screens/Detail.jsx'
import Analyse from './screens/Analyse.jsx'
import Resultat from './screens/Resultat.jsx'
import Partage from './screens/Partage.jsx'
import MesAnnonces from './screens/MesAnnonces.jsx'
import Conseils from './screens/Conseils.jsx'
import Profil from './screens/Profil.jsx'
import { genererAnnonce } from './lib/generateur.js'
import { allegerPhoto, enregistrerAnnonce, reduirePhoto } from './lib/stockage.js'

const AVEC_ONGLETS = ['accueil', 'partage', 'annonces', 'conseils', 'profil']

export default function App() {
  const [ecran, setEcran] = useState('accueil')
  const [photos, setPhotos] = useState([])
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

  const ouvrirCamera = () => setEcran('photos')
  const cameraNative = () => champPhoto.current?.click()
  const choisirGalerie = () => champGalerie.current?.click()

  const photosChoisies = async (e) => {
    const fichiers = Array.from(e.target.files || [])
    e.target.value = ''
    if (!fichiers.length) return
    const place = MAX_PHOTOS - photos.length
    if (place <= 0) {
      notifier(`${MAX_PHOTOS} photos maximum`)
      return
    }
    if (fichiers.length > place) notifier(`${MAX_PHOTOS} photos maximum : seules ${place} ont été ajoutées`)
    const lues = await Promise.all(fichiers.slice(0, place).map((f) => reduirePhoto(f).catch(() => null)))
    const valides = lues.filter(Boolean)
    if (valides.length < lues.length) notifier('Certaines photos n’ont pas pu être lues')
    setPhotos((actuelles) => [...actuelles, ...valides].slice(0, MAX_PHOTOS))
    setEcran('photos')
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
      photo: photos[0] || null,
      photos,
      infos,
      ...genererAnnonce(infos),
    })
    setEcran('resultat')
  }

  const sauvegarder = async (a = annonce) => {
    let legeres = []
    try {
      legeres = await Promise.all((a.photos || []).map((p) => allegerPhoto(p)))
    } catch {
      legeres = a.photos || []
    }
    const ok = enregistrerAnnonce({ ...a, photo: legeres[0] || null, photos: legeres })
    notifier(ok ? 'Annonce sauvegardée' : 'Stockage plein : supprimez une annonce')
  }

  const nouvelleAnnonce = () => {
    setPhotos([])
    setInfos('')
    setAnnonce(null)
    setEcran('photos')
  }

  const ouvrirAnnonce = (a) => {
    setAnnonce(a)
    setPhotos(a.photos || (a.photo ? [a.photo] : []))
    setInfos(a.infos || '')
    setOrigine('annonces')
    setEcran('resultat')
  }

  let contenu
  switch (ecran) {
    case 'photos':
      contenu = (
        <PrisePhotos
          photos={photos}
          onChange={setPhotos}
          onRetour={() => setEcran('accueil')}
          onContinuer={() => setEcran('detail')}
          onGalerie={choisirGalerie}
          onCameraNative={cameraNative}
          notifier={notifier}
        />
      )
      break
    case 'detail':
      contenu = (
        <Detail
          valeurInitiale={infos}
          onRetour={() => setEcran('photos')}
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
      contenu = <Accueil onPhoto={ouvrirCamera} onGalerie={choisirGalerie} />
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
        onChange={photosChoisies}
      />
      <input ref={champGalerie} type="file" accept="image/*" multiple hidden onChange={photosChoisies} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
