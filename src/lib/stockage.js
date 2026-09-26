const CLE = 'seconde-vie:annonces'

export function lireAnnonces() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || []
  } catch {
    return []
  }
}

export function enregistrerAnnonce(annonce) {
  const liste = lireAnnonces().filter((a) => a.id !== annonce.id)
  liste.unshift(annonce)
  try {
    localStorage.setItem(CLE, JSON.stringify(liste))
    return true
  } catch {
    // Quota dépassé : on ne garde que la première photo des annonces plus anciennes.
    try {
      const allegee = liste.map((a, i) => (i > 0 ? { ...a, photos: a.photo ? [a.photo] : [] } : a))
      localStorage.setItem(CLE, JSON.stringify(allegee))
      return true
    } catch {
      return false
    }
  }
}

export function supprimerAnnonce(id) {
  const liste = lireAnnonces().filter((a) => a.id !== id)
  try {
    localStorage.setItem(CLE, JSON.stringify(liste))
  } catch {
    /* rien */
  }
  return liste
}

// Redimensionne une image (ou une vidéo, un canvas) et la renvoie en JPEG.
function redimensionner(source, largeur, hauteur, tailleMax, qualite) {
  const echelle = Math.min(1, tailleMax / Math.max(largeur, hauteur))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largeur * echelle)
  canvas.height = Math.round(hauteur * echelle)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', qualite)
}

export function reduireCanvas(canvas, tailleMax = 1200) {
  return redimensionner(canvas, canvas.width, canvas.height, tailleMax, 0.85)
}

function chargerImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => resolve(img)
    img.src = src
  })
}

// Réduit une photo choisie dans la galerie.
export async function reduirePhoto(fichier, tailleMax = 1200) {
  const url = URL.createObjectURL(fichier)
  try {
    const img = await chargerImage(url)
    return redimensionner(img, img.naturalWidth, img.naturalHeight, tailleMax, 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Version plus légère pour la sauvegarde sur l'appareil (le stockage est limité).
export async function allegerPhoto(dataUrl, tailleMax = 640, qualite = 0.72) {
  const img = await chargerImage(dataUrl)
  return redimensionner(img, img.naturalWidth, img.naturalHeight, tailleMax, qualite)
}

export async function copierTexte(texte) {
  try {
    await navigator.clipboard.writeText(texte)
    return true
  } catch {
    const zone = document.createElement('textarea')
    zone.value = texte
    zone.style.position = 'fixed'
    zone.style.opacity = '0'
    document.body.appendChild(zone)
    zone.select()
    const ok = document.execCommand('copy')
    zone.remove()
    return ok
  }
}
