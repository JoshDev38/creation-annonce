// Partage de l'annonce vers les applis du téléphone (Vinted, Leboncoin, WhatsApp…).
// Dans l'appli installée, on passe par le partage natif d'Android : les photos
// sont d'abord écrites dans le cache, puis envoyées avec le texte.
// Sur le site, on utilise le partage du navigateur quand il existe.
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { estAppliNative } from './cameraNative.js'

async function partagerNatif(titre, texte, photos) {
  const files = []
  for (const [i, photo] of photos.entries()) {
    const { uri } = await Filesystem.writeFile({
      path: `partage/annonce-${i + 1}.jpg`,
      data: photo.split(',')[1],
      directory: Directory.Cache,
      recursive: true,
    })
    files.push(uri)
  }
  await Share.share({ title: titre, text: texte, files, dialogTitle: 'Publier sur…' })
}

async function partagerWeb(titre, texte, photos) {
  const fichiers = await Promise.all(
    photos.map(async (url, i) => {
      const blob = await (await fetch(url)).blob()
      return new File([blob], `annonce-${i + 1}.jpg`, { type: 'image/jpeg' })
    }),
  )
  const donnees = { title: titre, text: texte }
  if (fichiers.length && navigator.canShare?.({ files: fichiers })) donnees.files = fichiers
  await navigator.share(donnees)
}

export const partageDisponible = () => estAppliNative() || Boolean(navigator.share)

// Renvoie false si la personne a fermé la fenêtre de partage sans choisir d'appli.
export async function partagerAnnonce(titre, texte, photos) {
  try {
    if (estAppliNative()) await partagerNatif(titre, texte, photos)
    else await partagerWeb(titre, texte, photos)
    return true
  } catch (e) {
    const message = String(e?.message || '')
    if (e?.name === 'AbortError' || /cancel/i.test(message)) return false
    throw e
  }
}
