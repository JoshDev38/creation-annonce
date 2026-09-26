import { useEffect, useRef, useState } from 'react'
import { IconBack, IconCamera, IconChevron, IconFlash, IconGallery, IconPlus } from '../components/Icons.jsx'
import { reduireCanvas } from '../lib/stockage.js'

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
        setFlashDispo(Boolean(caps.torch))
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

  const basculerFlash = async () => {
    if (!flashDispo) {
      notifier('Flash non disponible sur cet appareil')
      return
    }
    try {
      await piste.current.applyConstraints({ advanced: [{ torch: !flash }] })
      setFlash(!flash)
    } catch {
      notifier('Impossible d’allumer le flash')
    }
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

  const declencher = () => {
    if (plein) {
      notifier(`${MAX_PHOTOS} photos maximum`)
      return
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

        {etat !== 'erreur' && (
          <>
            <div className="grille" aria-hidden="true" />
            <span className="coin coin-hg" />
            <span className="coin coin-hd" />
            <span className="coin coin-bg" />
            <span className="coin coin-bd" />
          </>
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
        <div className="vignettes-legende">
          <span>
            {photos.length}/{MAX_PHOTOS}
          </span>
          <span>{MAX_PHOTOS} photos max</span>
        </div>

        <div className="commandes">
          <button className="bouton-galerie" onClick={onGalerie} disabled={plein}>
            <IconGallery width={40} height={40} />
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
