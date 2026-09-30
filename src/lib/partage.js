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
  vinted: { nom: 'Vinted', genre: 'Mode, enfants, maison', lettres: 'V', paquet: 'fr.vinted', site: 'https://www.vinted.fr/items/new' },
  leboncoin: { nom: 'Leboncoin', genre: 'Tout, près de chez vous', lettres: 'lbc', paquet: 'fr.leboncoin', site: 'https://www.leboncoin.fr/deposer-une-annonce' },
  ebay: { nom: 'eBay', genre: 'Tout, neuf et occasion', lettres: 'eB', paquet: 'com.ebay.mobile', icone: './plateformes/ebay.svg', site: 'https://www.ebay.fr/sl/sell' },
  facebook: { nom: 'Facebook Marketplace', genre: 'Tout, près de chez vous', lettres: 'f', paquet: 'com.facebook.katana', site: 'https://www.facebook.com/marketplace/create/item' },
  rakuten: { nom: 'Rakuten', genre: 'High-tech, livres, jeux', lettres: 'R', paquet: 'com.priceminister.buyerapp', icone: './plateformes/rakuten.svg', site: 'https://fr.shopping.rakuten.com/' },
  vestiaire: { nom: 'Vestiaire Collective', genre: 'Mode de créateurs', lettres: 'VC', paquet: 'fr.vestiairecollective', site: 'https://fr.vestiairecollective.com/' },
  beebs: { nom: 'Beebs', genre: 'Bébé et enfants', lettres: 'B', paquet: 'com.beebs.mobile', site: 'https://www.beebs.app/' },
  selency: { nom: 'Selency', genre: 'Meubles et déco', lettres: 'S', paquet: 'com.selency.app', site: 'https://www.selency.fr/' },
}

// Icônes à essayer dans l'ordre : logo intégré à Malow (net), grande icône
// du site (apple-touch-icon), puis favicon via Google. Les images trop petites
// (floues) sont écartées par l'écran.
export const iconesSite = (cle) => {
  const { site, icone } = PLATEFORMES[cle]
  const { origin, hostname } = new URL(site)
  return [
    icone,
    `${origin}/apple-touch-icon.png`,
    `https://www.google.com/s2/favicons?domain=${hostname.replace(/^www\./, '')}&sz=256`,
  ].filter(Boolean)
}

// Pour chaque plateforme : true si l'appli est installée sur le téléphone.
export async function applisInstallees() {
  if (!estAppliNative()) return {}
  const entrees = await Promise.all(
    Object.entries(PLATEFORMES).map(async ([cle, { paquet }]) => {
      const { value } = await AppLauncher.canOpenUrl({ url: paquet }).catch(() => ({ value: false }))
      return [cle, value]
    }),
  )
  return Object.fromEntries(entrees)
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

// Renvoie les chemins des photos ajoutées à la galerie, dans l'ordre de l'annonce
// ([] sur le site). Enregistrées de la dernière à la première : la photo 1 est
// ainsi la plus récente, en tête de la galerie.
export async function rangerPhotosGalerie(photos, idAnnonce) {
  if (!estAppliNative() || !photos.length) return []
  const albumIdentifier = await albumMalow()
  const prefixe = String(idAnnonce || Date.now()).slice(0, 8)
  const chemins = []
  for (let i = photos.length - 1; i >= 0; i--) {
    const { filePath } = await Media.savePhoto({
      path: `data:image/jpeg;base64,${await enBase64(photos[i])}`,
      albumIdentifier,
      fileName: `malow-${prefixe}-${i + 1}`,
    })
    chemins[i] = filePath
  }
  return chemins.filter(Boolean)
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
