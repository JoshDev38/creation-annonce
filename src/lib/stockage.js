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
    // Quota dépassé : on retente sans la photo la plus ancienne.
    try {
      const allegee = liste.map((a, i) => (i > 5 ? { ...a, photo: null } : a))
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

// Réduit la photo pour qu'elle tienne dans le stockage du navigateur.
export function reduirePhoto(fichier, tailleMax = 900) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onerror = reject
    lecteur.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const echelle = Math.min(1, tailleMax / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * echelle)
        canvas.height = Math.round(img.height * echelle)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = lecteur.result
    }
    lecteur.readAsDataURL(fichier)
  })
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
