import { useEffect, useRef, useState } from 'react'
import { IconBack, IconCamera, IconChevron, IconFlash, IconGallery, IconPlus } from '../components/Icons.jsx'
import { allegerPhoto, reduireCanvas, reduirePhoto } from '../lib/stockage.js'
import {
  arreterCameraNative,
  capturerNatif,
  demarrerCameraNative,
  estAppliNative,
  reglerFlashNatif,
} from '../lib/cameraNative.js'

export const MAX_PHOTOS = 8

// Écran « appareil photo » : aperçu en direct, jusqu'à 8 photos, flash et zoom
// quand le téléphone le permet. Sans accès à la caméra (refus, ordinateur sans
// webcam…), on se rabat sur l'appareil photo natif du téléphone.
const NATIF = estAppliNative()
const CLE_CAMERA = 'seconde-vie:camera'
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const ARRIERE = /back|rear|arri|environment|environnement/i

function cameraMemorisee() {
  try {
    return localStorage.getItem(CLE_CAMERA)
  } catch {
    return null
  }
}

function memoriserCamera(id) {
  try {
    localStorage.setItem(CLE_CAMERA, id)
  } catch {
    /* rien */
  }
}

// La lampe (torch) est parfois annoncée un instant après l'ouverture.
async function aUneLampe(p, attentes = [0, 300, 800]) {
  for (const t of attentes) {
    if (t) await pause(t)
    if (p.readyState !== 'live') return false
    if (p.getCapabilities?.().torch) return true
  }
  return false
}

export default function PrisePhotos({ photos, onChange, onRetour, onContinuer, onGalerie, onCameraNative, notifier }) {
  const video = useRef(null)
  const flux = useRef(null)
  const piste = useRef(null)
  const actif = useRef(true)
  const modeFlash = useRef(null) // 'torch' | 'capture' | null
  const capture = useRef(null)
  const [etat, setEtat] = useState('demarrage') // demarrage | pret | erreur
  const [flash, setFlash] = useState(false)
  const [flashDispo, setFlashDispo] = useState(false)
  const [rechercheFlash, setRechercheFlash] = useState(false)
  const [info, setInfo] = useState(false)
  const [zooms, setZooms] = useState([])
  const [zoom, setZoom] = useState(1)
  const [zoomMateriel, setZoomMateriel] = useState(false)
  const [eclair, setEclair] = useState(false)

  const plein = photos.length >= MAX_PHOTOS

  const arreter = () => {
    flux.current?.getTracks().forEach((t) => t.stop())
    flux.current = null
    piste.current = null
  }

  // Ouvre une caméra et l'affiche dans l'aperçu.
  const brancher = async (deviceId) => {
    const video_ = deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1440 } }
      : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }
    const f = await navigator.mediaDevices.getUserMedia({ audio: false, video: video_ })
    if (!actif.current) {
      f.getTracks().forEach((t) => t.stop())
      throw new Error('écran fermé')
    }
    arreter()
    flux.current = f
    const p = f.getVideoTracks()[0]
    piste.current = p
    video.current.srcObject = f
    await video.current.play().catch(() => {})

    const caps = p.getCapabilities?.() || {}
    setZoom(1)
    if (caps.zoom && caps.zoom.min <= 0.5) {
      setZooms([0.5, 1])
      setZoomMateriel(true)
    } else if (caps.zoom && caps.zoom.max >= 2) {
      setZooms([1, 2])
      setZoomMateriel(true)
    } else {
      setZooms([1, 2]) // zoom numérique
      setZoomMateriel(false)
    }
    return p
  }

  // Lampe sur la caméra ouverte, sinon flash au moment de la photo (Chrome Android).
  const detecterFlash = async (p) => {
    modeFlash.current = null
    capture.current = null
    if (await aUneLampe(p, [0, 300, 800, 1500])) {
      if (piste.current === p) {
        modeFlash.current = 'torch'
        setFlashDispo(true)
      }
      return
    }
    if (piste.current !== p || !('ImageCapture' in window)) return
    try {
      const ic = new window.ImageCapture(p)
      const pc = await ic.getPhotoCapabilities()
      if (piste.current === p && pc.fillLightMode?.includes('flash')) {
        capture.current = ic
        modeFlash.current = 'capture'
        setFlashDispo(true)
      }
    } catch {
      /* pas de flash */
    }
  }

  useEffect(() => {
    actif.current = true
    if (NATIF) {
      // Appli installée : caméra native, avec accès au flash.
      ;(async () => {
        try {
          const mode = await demarrerCameraNative()
          if (!actif.current) return
          modeFlash.current = mode
          setFlashDispo(Boolean(mode))
          setZooms([]) // zoom en pinçant l'écran
          setEtat('pret')
        } catch {
          if (actif.current) setEtat('erreur')
        }
      })()
      return () => {
        actif.current = false
        arreterCameraNative()
      }
    }
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEtat('erreur')
        return
      }
      try {
        let p
        const memo = cameraMemorisee()
        if (memo) p = await brancher(memo).catch(() => null)
        if (!p) p = await brancher()
        setEtat('pret')
        detecterFlash(p)
      } catch {
        if (actif.current) setEtat('erreur')
      }
    })()
    return () => {
      actif.current = false
      arreter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sur beaucoup d'Android (Samsung…), la caméra arrière ouverte par défaut
  // n'a pas accès à la lampe : on essaie les autres caméras arrière.
  const chercherCameraAvecLampe = async () => {
    const actuelle = piste.current?.getSettings?.().deviceId
    const appareils = (await navigator.mediaDevices.enumerateDevices()).filter(
      (d) => d.kind === 'videoinput' && d.deviceId && d.deviceId !== actuelle,
    )
    const arriere = appareils.filter((d) => ARRIERE.test(d.label))
    const candidats = arriere.length ? arriere : appareils.filter((d) => !/front|avant|user/i.test(d.label))
    for (const d of candidats) {
      try {
        const p = await brancher(d.deviceId)
        if (await aUneLampe(p)) {
          memoriserCamera(d.deviceId)
          modeFlash.current = 'torch'
          return p
        }
      } catch {
        if (!actif.current) return null
      }
    }
    // Rien trouvé : on revient à la caméra de départ.
    try {
      const p = await brancher(actuelle)
      detecterFlash(p)
    } catch {
      await brancher().catch(() => setEtat('erreur'))
    }
    return null
  }

  const allumerLampe = async (p, allume) => {
    try {
      await p.applyConstraints({ advanced: [{ torch: allume }] })
    } catch {
      await p.applyConstraints({ torch: allume })
    }
  }

  const basculerFlash = async () => {
    if (rechercheFlash) return
    const allume = !flash
    if (NATIF) {
      if (!modeFlash.current) {
        notifier('Ce téléphone n’a pas de flash')
        return
      }
      try {
        await reglerFlashNatif(modeFlash.current, allume)
        setFlash(allume)
        if (modeFlash.current === 'capture' && allume) notifier('Le flash se déclenchera à la prise de la photo')
      } catch {
        notifier('Impossible d’allumer le flash')
      }
      return
    }
    let p = piste.current
    if (!p) return

    if (!modeFlash.current && p.getCapabilities?.().torch) modeFlash.current = 'torch'
    if (allume && modeFlash.current !== 'torch' && navigator.mediaDevices?.enumerateDevices) {
      setRechercheFlash(true)
      notifier('Recherche du flash…')
      const trouvee = await chercherCameraAvecLampe()
      setRechercheFlash(false)
      if (!actif.current) return
      if (trouvee) p = trouvee
    }

    if (!modeFlash.current) {
      notifier('Flash indisponible sur ce téléphone depuis le navigateur')
      return
    }
    if (modeFlash.current === 'torch') {
      try {
        await allumerLampe(p, allume)
      } catch {
        notifier('Impossible d’allumer le flash')
        return
      }
    }
    setFlashDispo(true)
    setFlash(allume)
    if (modeFlash.current === 'capture' && allume) notifier('Le flash se déclenchera à la prise de la photo')
  }

  useEffect(() => {
    if (!info) return
    const t = setTimeout(() => setInfo(false), 5000)
    return () => clearTimeout(t)
  }, [info])

  const choisirZoom = async (z) => {
    setZoom(z)
    if (zoomMateriel) {
      try {
        await piste.current.applyConstraints({ advanced: [{ zoom: z }] })
      } catch {
        /* le téléphone refuse : on garde l'aperçu tel quel */
      }
    }
  }

  const declencher = async () => {
    if (plein) {
      notifier(`${MAX_PHOTOS} photos maximum`)
      return
    }
    if (NATIF) {
      try {
        const photo = await allegerPhoto(await capturerNatif(), 1200, 0.85)
        onChange([...photos, photo])
        setEclair(true)
        setTimeout(() => setEclair(false), 180)
        navigator.vibrate?.(30)
      } catch {
        notifier('La photo n’a pas pu être prise')
      }
      return
    }
    if (flash && modeFlash.current === 'capture' && capture.current) {
      try {
        const blob = await capture.current.takePhoto({ fillLightMode: 'flash' })
        onChange([...photos, await reduirePhoto(blob)])
        navigator.vibrate?.(30)
        return
      } catch {
        /* on retombe sur la capture de l'aperçu */
      }
    }
    const v = video.current
    if (!v?.videoWidth) return
    // Zoom numérique : on garde le centre de l'image.
    const facteur = zoomMateriel ? 1 : zoom
    const sw = v.videoWidth / facteur
    const sh = v.videoHeight / facteur
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    canvas
      .getContext('2d')
      .drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, sw, sh)
    onChange([...photos, reduireCanvas(canvas)])
    setEclair(true)
    setTimeout(() => setEclair(false), 180)
    navigator.vibrate?.(30)
  }

  const retirer = (i) => onChange(photos.filter((_, j) => j !== i))

  const echelleApercu = !zoomMateriel && zoom > 1 ? zoom : 1

  return (
    <main className="camera">
      <div className="viseur">
        {NATIF && etat !== 'erreur' ? null : etat !== 'erreur' ? (
          <video
            ref={video}
            playsInline
            muted
            autoPlay
            style={{ transform: `scale(${echelleApercu})` }}
          />
        ) : (
          <div className="camera-indispo">
            <IconCamera width={40} height={40} />
            <p>
              L’appareil photo n’est pas accessible ici.
              <br />
              Autorisez la caméra, ou utilisez celle de votre téléphone.
            </p>
            <button className="bouton bouton-principal" onClick={onCameraNative} disabled={plein}>
              Ouvrir l’appareil photo
            </button>
          </div>
        )}

        {eclair && <div className="eclair" aria-hidden="true" />}

        <header className="camera-haut">
          <button className="camera-retour" onClick={onRetour}>
            <IconBack width={24} height={24} /> Retour
          </button>
          <div className="compteur-groupe">
            <span className="compteur-photos">
              {photos.length}/{MAX_PHOTOS} photos
            </span>
            <button
              className={`bouton-info ${info ? 'ouvert' : ''}`}
              onClick={() => setInfo(!info)}
              aria-label="Informations"
              aria-expanded={info}
            >
              i
            </button>
          </div>
          <button
            className={`camera-flash ${flash ? 'allume' : ''} ${flashDispo ? '' : 'indispo'} ${rechercheFlash ? 'recherche' : ''}`}
            onClick={basculerFlash}
            aria-label={flash ? 'Éteindre le flash' : 'Allumer le flash'}
            aria-pressed={flash}
          >
            <IconFlash width={24} height={24} />
          </button>
        </header>
        {info && (
          <p className="bulle-conseil" role="status" onClick={() => setInfo(false)}>
            Ajoutez plusieurs photos pour une annonce plus précise !
          </p>
        )}

        {etat === 'pret' && zooms.length > 1 && (
          <div className="zooms" role="group" aria-label="Zoom">
            {[...zooms].reverse().map((z) => (
              <button
                key={z}
                className={zoom === z ? 'actif' : ''}
                onClick={() => choisirZoom(z)}
                aria-pressed={zoom === z}
              >
                {z === 1 ? '1x' : String(z).replace('.', ',') + (z > 1 ? 'x' : '')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="camera-bas">
        <ul className="vignettes">
          {Array.from({ length: MAX_PHOTOS }, (_, i) =>
            photos[i] ? (
              <li key={i} className={`vignette-photo ${i === 0 ? 'principale' : ''}`}>
                <img src={photos[i]} alt={`Photo ${i + 1}`} />
                <button className="retirer" onClick={() => retirer(i)} aria-label={`Retirer la photo ${i + 1}`}>
                  ×
                </button>
              </li>
            ) : (
              <li key={i}>
                <button className="case-vide" onClick={onGalerie} aria-label="Ajouter une photo depuis la galerie">
                  <IconPlus width={20} height={20} />
                </button>
              </li>
            ),
          )}
        </ul>

        <div className="commandes">
          <button className="bouton-galerie" onClick={onGalerie} disabled={plein}>
            <IconGallery width={30} height={30} />
            Galerie
          </button>
          <button
            className="declencheur"
            onClick={etat === 'erreur' ? onCameraNative : declencher}
            disabled={plein || etat === 'demarrage'}
            aria-label="Prendre la photo"
          >
            <span />
          </button>
          <button className="bouton-continuer" onClick={onContinuer} disabled={photos.length === 0}>
            Continuer <IconChevron width={22} height={22} />
          </button>
        </div>
      </div>
    </main>
  )
}
