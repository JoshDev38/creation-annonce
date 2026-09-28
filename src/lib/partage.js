// Partage de l'annonce vers les applis du téléphone (Vinted, Leboncoin, WhatsApp…).
// Dans l'appli installée, on passe par le partage natif d'Android : les photos
// sont d'abord écrites dans le cache, puis envoyées avec le texte.
// Sur le site, on utilise le partage du navigateur quand il existe.
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { AppLauncher } from '@capacitor/app-launcher'
import { Media } from '@capacitor-community/media'
import { estAppliNative } from './cameraNative.js'

// Les photos sont soit des data URL (annonce toute neuve), soit des liens
// Supabase (annonce déjà sauvegardée) : on les ramène toutes en base64.
async function enBase64(photo) {
  if (photo.startsWith('data:')) return photo.split(',')[1]
  const blob = await (await fetch(photo)).blob()
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onerror = reject
    lecteur.onload = () => resolve(String(lecteur.result).split(',')[1])
    lecteur.readAsDataURL(blob)
  })
}

async function ecrirePhotos(photos) {
  const files = []
  for (const [i, photo] of photos.entries()) {
    const { uri } = await Filesystem.writeFile({
      path: `partage/annonce-${i + 1}.jpg`,
      data: await enBase64(photo),
      directory: Directory.Cache,
      recursive: true,
    })
    files.push(uri)
  }
  return files
}

async function partagerNatif(titre, texte, photos) {
  let files = []
  try {
    files = await ecrirePhotos(photos)
  } catch (e) {
    console.error('Photos non préparées pour le partage', e)
  }
  try {
    await Share.share({ title: titre, text: texte, files, dialogTitle: 'Publier sur…' })
  } catch (e) {
    if (!files.length || estAnnulation(e)) throw e
    // Certaines versions d'Android refusent photos + texte : on partage au moins le texte.
    console.error('Partage avec photos refusé', e)
    await Share.share({ title: titre, text: texte, dialogTitle: 'Publier sur…' })
  }
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

const estAnnulation = (e) => e?.name === 'AbortError' || /cancel/i.test(String(e?.message || ''))

export const partageDisponible = () => estAppliNative() || Boolean(navigator.share)

// Renvoie false si la personne a fermé la fenêtre de partage sans choisir d'appli.
export async function partagerAnnonce(titre, texte, photos) {
  try {
    if (estAppliNative()) await partagerNatif(titre, texte, photos)
    else await partagerWeb(titre, texte, photos)
    return true
  } catch (e) {
    if (estAnnulation(e)) return false
    throw e
  }
}

// ----- Vinted, Leboncoin -----
// Ces applis n'apparaissent pas dans le partage d'Android : on copie le texte,
// on range les photos dans l'album « Malow » de la galerie, puis on ouvre l'appli.
export const PLATEFORMES = {
  vinted: { nom: 'Vinted', paquet: 'fr.vinted', site: 'https://www.vinted.fr/items/new' },
  leboncoin: { nom: 'Leboncoin', paquet: 'fr.leboncoin', site: 'https://www.leboncoin.fr/deposer-une-annonce' },
}

const ALBUM = 'Malow'

async function albumMalow() {
  const { path } = await Media.getAlbumsPath()
  const identifiant = `${path}/${ALBUM}`
  const { albums } = await Media.getAlbums()
  if (!albums.some((a) => a.identifier === identifiant)) {
    await Media.createAlbum({ name: ALBUM }).catch(() => {}) // « existe déjà » : rien à faire
  }
  return identifiant
}

// Renvoie le nombre de photos ajoutées à la galerie (0 sur le site).
export async function rangerPhotosGalerie(photos, idAnnonce) {
  if (!estAppliNative() || !photos.length) return 0
  const albumIdentifier = await albumMalow()
  const prefixe = String(idAnnonce || Date.now()).slice(0, 8)
  for (const [i, photo] of photos.entries()) {
    await Media.savePhoto({
      path: `data:image/jpeg;base64,${await enBase64(photo)}`,
      albumIdentifier,
      fileName: `malow-${prefixe}-${i + 1}`,
    })
  }
  return photos.length
}

export async function ouvrirPlateforme(cle) {
  const { paquet, site } = PLATEFORMES[cle]
  if (!estAppliNative()) {
    window.open(site, '_blank', 'noopener')
    return
  }
  const { value: installee } = await AppLauncher.canOpenUrl({ url: paquet }).catch(() => ({ value: false }))
  await AppLauncher.openUrl({ url: installee ? paquet : site })
}
