import { useEffect, useRef, useState } from 'react'
import { App as AppNative } from '@capacitor/app'
import TabBar from './components/TabBar.jsx'
import Accueil from './screens/Accueil.jsx'
import PrisePhotos, { MAX_PHOTOS } from './screens/PrisePhotos.jsx'
import Detail from './screens/Detail.jsx'
import Analyse from './screens/Analyse.jsx'
import Resultat from './screens/Resultat.jsx'
import Partage from './screens/Partage.jsx'
import MesAnnonces from './screens/MesAnnonces.jsx'
import Conseils from './screens/Conseils.jsx'
import MonAbonnement from './screens/MonAbonnement.jsx'
import Profil from './screens/Profil.jsx'
import Connexion from './screens/Connexion.jsx'
import Bienvenue from './screens/Bienvenue.jsx'
import Fidelite from './screens/Fidelite.jsx'
import Abonnements from './screens/Abonnements.jsx'
import { genererAnnonce } from './lib/generateur.js'
import { analyserAvecIA } from './lib/analyseIA.js'
import { estAppliNative } from './lib/cameraNative.js'
import { lireAnnonces, reduirePhoto, supprimerAnnonce } from './lib/stockage.js'
import { supabase } from './lib/supabase.js'
import { enregistrerAnnonceCloud } from './lib/annoncesCloud.js'
import { ecouterRetourGoogle } from './lib/connexionGoogle.js'

const AVEC_ONGLETS = ['accueil', 'partage', 'annonces', 'conseils', 'profil']

// Logo Malow à l'ouverture de l'appli (Android, ou site installé sur l'écran d'accueil).
const DUREE_LANCEMENT = 3000
const AVEC_LANCEMENT =
  estAppliNative() || (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches)

export default function App() {
  // « chargement » le temps de savoir si quelqu'un est connecté, puis accueil ou bienvenue.
  const [ecran, setEcran] = useState('chargement')
  const [lancement, setLancement] = useState(AVEC_LANCEMENT ? 'visible' : null)
  useEffect(() => {
    if (!AVEC_LANCEMENT) return
    const fondu = setTimeout(() => setLancement('sortie'), DUREE_LANCEMENT - 400)
    const fin = setTimeout(() => setLancement(null), DUREE_LANCEMENT)
    return () => {
      clearTimeout(fondu)
      clearTimeout(fin)
    }
  }, [])
  const [photos, setPhotos] = useState([])
  const [infos, setInfos] = useState('')
  const [annonce, setAnnonce] = useState(null)
  const [toast, setToast] = useState(null)
  const [origine, setOrigine] = useState('detail')
  const [resultat, setResultat] = useState(null)
  const analyseEnCours = useRef(0)
  const champPhoto = useRef(null)
  const champGalerie = useRef(null)

  // ----- Compte -----
  const [session, setSession] = useState(null)
  const sessionRef = useRef(null)
  const [connexion, setConnexion] = useState({ mode: 'connexion', raison: '', retour: 'accueil' })
  const apresConnexion = useRef(null)

  // Demande de se connecter, puis reprend l'action (analyse, sauvegarde…) une fois connecté.
  const exigerConnexion = (raison, action, mode = 'connexion') => {
    apresConnexion.current = action
    setConnexion({ mode, raison, retour: ecran })
    setEcran('connexion')
  }

  const notifier = (message) => {
    setToast(message)
    clearTimeout(notifier.timer)
    notifier.timer = setTimeout(() => setToast(null), 2200)
  }

  // Écran d'où l'on a lancé une nouvelle annonce (accueil, mes annonces…) : « Retour » y ramène.
  const depart = useRef('accueil')
  const allerPhotos = () => {
    if (AVEC_ONGLETS.includes(ecran)) depart.current = ecran
    setEcran('photos')
  }
  const quitterPhotos = () => setEcran(depart.current)

  const ouvrirCamera = () => allerPhotos()
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
    allerPhotos()
  }

  const lancerAnalyse = (texte) => {
    if (!sessionRef.current) {
      setInfos(texte)
      exigerConnexion('Créez un compte gratuit ou connectez-vous pour lancer l’analyse IA.', () => lancerAnalyse(texte))
      return
    }
    setInfos(texte)
    setResultat(null)
    setEcran('analyse')
    const numero = ++analyseEnCours.current
    analyserAvecIA(photos, texte)
      .then((r) => ({ ...r, source: 'ia' }))
      .catch((e) => {
        console.warn('Analyse IA indisponible :', e.message)
        return { ...genererAnnonce(texte), source: 'local' }
      })
      .then((r) => {
        if (numero === analyseEnCours.current) setResultat(r)
      })
  }

  const analyseTerminee = () => {
    if (!resultat) return
    const { source } = resultat
    if (source === 'local') notifier('Analyse IA indisponible : annonce créée à partir de vos informations')
    setOrigine('detail')
    setAnnonce({
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      photo: photos[0] || null,
      photos,
      infos,
      ...resultat,
    })
    setEcran('resultat')
  }

  const sauvegarder = async (a = annonce) => {
    const s = sessionRef.current
    if (!s) {
      exigerConnexion('Connectez-vous pour sauvegarder vos annonces dans votre compte.', () => {
        setEcran('partage')
        sauvegarder(a)
      })
      return
    }
    notifier('Sauvegarde en cours…')
    try {
      const enregistree = await enregistrerAnnonceCloud(a, s.user.id)
      setAnnonce((actuelle) => (actuelle?.id === a.id ? { ...actuelle, ...enregistree } : actuelle))
      notifier('Annonce sauvegardée dans votre compte')
    } catch (e) {
      console.error(e)
      notifier('La sauvegarde a échoué. Vérifiez votre connexion.')
    }
  }

  // Annonces enregistrées sur le téléphone avant la création du compte : on les envoie dans le compte.
  const importerAnnoncesLocales = async (s) => {
    const locales = lireAnnonces()
    if (!locales.length) return
    let importees = 0
    for (const a of locales) {
      try {
        await enregistrerAnnonceCloud(a, s.user.id)
        supprimerAnnonce(a.id)
        importees++
      } catch (e) {
        console.error('Import impossible', e)
      }
    }
    if (importees) notifier(`${importees} annonce${importees > 1 ? 's' : ''} du téléphone ajoutée${importees > 1 ? 's' : ''} à votre compte`)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      sessionRef.current = data.session
      setSession(data.session)
      setEcran((e) => (e === 'chargement' ? (data.session ? 'accueil' : 'bienvenue') : e))
    })
    const { data } = supabase.auth.onAuthStateChange((evenement, s) => {
      sessionRef.current = s
      setSession(s)
      if (evenement === 'PASSWORD_RECOVERY') {
        setConnexion({ mode: 'nouveau', raison: '', retour: 'profil' })
        setEcran('connexion')
      }
      if (evenement === 'SIGNED_IN' && s) {
        setTimeout(() => importerAnnoncesLocales(s), 0)
        // Connexion (Google ou e-mail) : on reprend l'action en attente ou on quitte l'écran de connexion.
        setTimeout(() => finConnexion.current(), 0)
      }
    })
    const arreterGoogle = ecouterRetourGoogle((message) => notifier(message))
    return () => {
      data.subscription.unsubscribe()
      arreterGoogle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connecte = () => {
    const action = apresConnexion.current
    apresConnexion.current = null
    if (!action && !['bienvenue', 'connexion', 'chargement'].includes(ecran)) return // déjà traité
    notifier('Vous êtes connecté')
    if (action) setTimeout(action, 0)
    else if (connexion.retour === 'bienvenue') setEcran('accueil')
    else setEcran(connexion.retour === 'connexion' ? 'profil' : connexion.retour || 'profil')
  }

  const nouvelleAnnonce = () => {
    setPhotos([])
    setInfos('')
    setAnnonce(null)
    allerPhotos()
  }

  const ouvrirAnnonce = (a) => {
    setAnnonce(a)
    setPhotos(a.photos || (a.photo ? [a.photo] : []))
    setInfos(a.infos || '')
    setOrigine('annonces')
    setEcran('resultat')
  }

  const finConnexion = useRef(null)
  finConnexion.current = connecte

  // Bouton retour d'Android (appli installée) : écran précédent, ou fermeture sur l'accueil.
  const retour = useRef(null)
  // Un écran peut gérer lui-même le retour (ex. rubrique de l'aide → menu de l'aide) : il renvoie true.
  const retourInterne = useRef(null)
  // Les abonnements s'ouvrent depuis le profil ou depuis l'aide : le retour y ramène.
  const [abosDepuis, setAbosDepuis] = useState('profil')
  const [rubriqueAide, setRubriqueAide] = useState(null)
  const ouvrirAbonnements = (depuis) => {
    setAbosDepuis(depuis)
    setEcran('abonnements')
  }
  const quitterAbonnements = () => {
    if (abosDepuis === 'conseils') setRubriqueAide('abonnements')
    setEcran(abosDepuis)
  }
  retour.current = () => {
    if (retourInterne.current?.()) return
    const precedent = {
      photos: depart.current,
      detail: 'photos',
      resultat: origine,
      partage: 'resultat',
      annonces: 'accueil',
      conseils: 'accueil',
      profil: 'accueil',
      fidelite: 'profil',
      abonnements: abosDepuis,
      'mon-abonnement': 'profil',
      connexion: connexion.retour,
    }
    if (ecran === 'accueil' || ecran === 'bienvenue') AppNative.exitApp()
    else if (ecran === 'analyse') return // on laisse l'analyse se terminer
    else if (ecran === 'abonnements') quitterAbonnements()
    else setEcran(precedent[ecran] || 'accueil')
  }

  useEffect(() => {
    if (!estAppliNative()) return
    const ecoute = AppNative.addListener('backButton', () => retour.current())
    return () => {
      ecoute.then((h) => h.remove())
    }
  }, [])

  let contenu
  switch (ecran) {
    case 'photos':
      contenu = (
        <PrisePhotos
          photos={photos}
          onChange={setPhotos}
          onRetour={quitterPhotos}
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
      contenu = <Analyse pret={Boolean(resultat)} onFini={analyseTerminee} />
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
      contenu = (
        <MesAnnonces
          session={session}
          onOuvrir={ouvrirAnnonce}
          onNouvelle={nouvelleAnnonce}
          onConnexion={() => exigerConnexion('Retrouvez vos annonces sur tous vos appareils.', null)}
          notifier={notifier}
        />
      )
      break
    case 'conseils':
      contenu = (
        <Conseils
          retourInterne={retourInterne}
          rubriqueInitiale={rubriqueAide}
          onRubriqueLue={() => setRubriqueAide(null)}
          onAbonnements={() => ouvrirAbonnements('conseils')}
        />
      )
      break
    case 'profil':
      contenu = (
        <Profil
          session={session}
          onConnexion={(mode) => exigerConnexion('', null, mode)}
          onVoirAnnonces={() => setEcran('annonces')}
          onFidelite={() => setEcran('fidelite')}
          onAbonnements={() => ouvrirAbonnements('profil')}
          onMonAbonnement={() => setEcran('mon-abonnement')}
          notifier={notifier}
        />
      )
      break
    case 'connexion':
      contenu = (
        <Connexion
          modeInitial={connexion.mode}
          raison={connexion.raison}
          onRetour={() => {
            apresConnexion.current = null
            setEcran(connexion.retour === 'connexion' ? 'accueil' : connexion.retour)
          }}
          onConnecte={connecte}
          notifier={notifier}
        />
      )
      break
    case 'abonnements':
      contenu = <Abonnements session={session} onRetour={quitterAbonnements} notifier={notifier} />
      break
    case 'mon-abonnement':
      contenu = (
        <MonAbonnement session={session} onRetour={() => setEcran('profil')} onOffres={() => ouvrirAbonnements('mon-abonnement')} />
      )
      break
    case 'fidelite':
      contenu = <Fidelite onRetour={() => setEcran('profil')} />
      break
    case 'chargement':
      contenu = <main className="page" />
      break
    case 'bienvenue':
      contenu = (
        <Bienvenue
          onInscription={() => exigerConnexion('', null, 'inscription')}
          onConnexion={() => exigerConnexion('', null, 'connexion')}
          onDecouvrir={() => setEcran('accueil')}
          notifier={notifier}
        />
      )
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
      {lancement && (
        <div
          className={`lancement ${lancement === 'sortie' ? 'sortie' : ''}`}
          style={{ backgroundImage: 'url(./lancement.webp), linear-gradient(#9bd7fe, #6eace0)' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
