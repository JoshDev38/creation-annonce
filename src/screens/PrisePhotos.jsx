import { useEffect, useRef, useState } from 'react'
import { IconBack, IconCamera, IconChevron, IconFlash, IconGallery, IconPlus } from '../components/Icons.jsx'
import { reduireCanvas, reduirePhoto } from '../lib/stockage.js'

export const MAX_PHOTOS = 8

// Écran « appareil photo » : aperçu en direct, jusqu'à 8 photos, flash et zoom
// quand le téléphone le permet. Sans accès à la caméra (refus, ordinateur sans
// webcam…), on se rabat sur l'appareil photo natif du téléphone.
export default function PrisePhotos({ photos, onChange, onRetour, onContinuer, onGalerie, onCameraNative, notifier }) {
  const video = useRef(null)
  const piste = useRef(null)
  const [etat, setEtat] = useState('demarrage') // demarrage | pret | erreur
  const [flash, setFlash] = useState(false)
  const [flashDispo, setFlashDispo] = useState(false)
  const [zooms, setZooms] = useState([])
  const [zoom, setZoom] = useState(1)
  const [zoomMateriel, setZoomMateriel] = useState(false)
  const [eclair, setEclair] = useState(false)

  const plein = photos.length >= MAX_PHOTOS

  useEffect(() => {
    let flux
    let annule = false

    async function demarrer() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEtat('erreur')
        return
      }
      try {
        flux = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
        })
        if (annule) {
          flux.getTracks().forEach((t) => t.stop())
          return
        }
        const p = flux.getVideoTracks()[0]
        piste.current = p
        video.current.srcObject = flux
        await video.current.play().catch(() => {})

        const caps = p.getCapabilities?.() || {}
        detecterFlash(p)
        if (caps.zoom && caps.zoom.min <= 0.5) {
          setZooms([0.5, 1])
          setZoomMateriel(true)
        } else if (caps.zoom && caps.zoom.max >= 2) {
          setZooms([1, 2])
          setZoomMateriel(true)
        } else {
          setZooms([1, 2]) // zoom numérique
        }
        setEtat('pret')
      } catch {
        if (!annule) setEtat('erreur')
      }
    }

    demarrer()
    return () => {
      annule = true
      flux?.getTracks().forEach((t) => t.stop())
      piste.current = null
    }
  }, [])

  // Beaucoup d'Android n'annoncent la lampe (torch) qu'un instant après
  // l'ouverture de la caméra : on revérifie plusieurs fois.
  const modeFlash = useRef(null) // 'torch' | 'capture' | null
  const capture = useRef(null)

  async function detecterFlash(p) {
    for (const attente of [0, 300, 800, 1500]) {
      if (attente) await new Promise((r) => setTimeout(r, attente))
      if (piste.current !== p) return
      if (p.getCapabilities?.().torch) {
        modeFlash.current = 'torch'
        setFlashDispo(true)
        return
      }
    }
    // Sinon : vrai flash au moment de la photo (Chrome Android).
    if ('ImageCapture' in window) {
      try {
        const ic = new window.ImageCapture(p)
        const pc = await ic.getPhotoCapabilities()
        if (pc.fillLightMode?.includes('flash')) {
          capture.current = ic
          modeFlash.current = 'capture'
          setFlashDispo(true)
        }
      } catch {
        /* pas de flash */
      }
    }
  }

  const basculerFlash = async () => {
    const p = piste.current
    const allume = !flash
    // Dernière chance si la détection n'a encore rien trouvé.
    if (!modeFlash.current && p?.getCapabilities?.().torch) modeFlash.current = 'torch'
    if (!modeFlash.current) {
      notifier('Flash indisponible sur ce téléphone depuis le navigateur')
      return
    }
    if (modeFlash.current === 'torch') {
      try {
        await p.applyConstraints({ advanced: [{ torch: allume }] })
      } catch {
        try {
          await p.applyConstraints({ torch: allume })
        } catch {
          notifier('Impossible d’allumer le flash')
          return
        }
      }
    }
    setFlashDispo(true)
    setFlash(allume)
    if (modeFlash.current === 'capture' && allume) notifier('Le flash se déclenchera à la prise de la photo')
  }

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
        {etat !== 'erreur' ? (
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
          <span className="compteur-photos">
            {photos.length}/{MAX_PHOTOS} photos
          </span>
          <button
            className={`camera-flash ${flash ? 'allume' : ''} ${flashDispo ? '' : 'indispo'}`}
            onClick={basculerFlash}
            aria-label={flash ? 'Éteindre le flash' : 'Allumer le flash'}
            aria-pressed={flash}
          >
            <IconFlash width={24} height={24} />
          </button>
        </header>
        <p className="bulle-conseil">Ajoutez plusieurs photos pour une annonce plus précise !</p>

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
