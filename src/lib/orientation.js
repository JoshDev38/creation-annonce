// Orientation réelle du téléphone dans l'appli Android (verrouillée en portrait) :
// 0, 90, 180 ou 270 degrés dans le sens des aiguilles d'une montre.
// Plugin natif : android/app/src/main/java/app/nalow/OrientationPlugin.java
import { registerPlugin } from '@capacitor/core'
import { estAppliNative } from './cameraNative.js'

const Orientation = registerPlugin('Orientation')

export async function lireOrientation() {
  if (!estAppliNative()) return 0
  try {
    return (await Orientation.lire()).degres || 0
  } catch {
    return 0 // ancienne version de l'appli
  }
}

// Appelle rappel(degres) à chaque changement ; renvoie la fonction pour arrêter.
export function ecouterOrientation(rappel) {
  if (!estAppliNative()) return () => {}
  const ecoute = Orientation.addListener('changement', ({ degres }) => rappel(degres))
  lireOrientation().then(rappel)
  return () => ecoute.then((e) => e.remove()).catch(() => {})
}

// Angle CSS pour qu'une icône reste droite quand le téléphone est tourné.
export const angleIcone = (degres) => (degres === 270 ? 90 : -degres)

// Redresse une photo prise téléphone tourné (rotation dans le sens horaire).
export async function redresserPhoto(dataUrl, degres) {
  if (!degres) return dataUrl
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const couche = degres === 90 || degres === 270
  const canvas = document.createElement('canvas')
  canvas.width = couche ? img.naturalHeight : img.naturalWidth
  canvas.height = couche ? img.naturalWidth : img.naturalHeight
  const g = canvas.getContext('2d')
  g.translate(canvas.width / 2, canvas.height / 2)
  g.rotate((degres * Math.PI) / 180)
  g.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  return canvas.toDataURL('image/jpeg', 0.9)
}
