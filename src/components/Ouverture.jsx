import { useEffect, useState } from 'react'

const DUREE = 3000 // logo affiché 3 secondes
const FONDU = 400

// Logo Malow plein écran à l'ouverture de l'appli, puis fondu vers l'écran suivant.
export default function Ouverture() {
  const [etat, setEtat] = useState('visible')

  useEffect(() => {
    const fondu = setTimeout(() => setEtat('fondu'), DUREE)
    const fin = setTimeout(() => setEtat('fini'), DUREE + FONDU)
    return () => {
      clearTimeout(fondu)
      clearTimeout(fin)
    }
  }, [])

  if (etat === 'fini') return null
  return (
    <div className={`ouverture${etat === 'fondu' ? ' ouverture-fondu' : ''}`} aria-hidden="true">
      <img className="ouverture-logo" src="/icon-512.png" alt="" />
    </div>
  )
}
