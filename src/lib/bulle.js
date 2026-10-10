// Bulle flottante Nalow (appli Android) : elle reste par-dessus Vinted ou
// Leboncoin et permet de copier le titre, la description ou le prix.
// Code natif : android/app/src/main/java/app/nalow/BullePlugin.java
import { registerPlugin } from '@capacitor/core'
import { estAppliNative } from './cameraNative.js'

const Bulle = registerPlugin('Bulle')

export async function bulleAutorisee() {
  if (!estAppliNative()) return false
  try {
    return (await Bulle.autorisee()).value
  } catch {
    return false // ancienne version de l'appli, sans la bulle
  }
}

// Ouvre le réglage Android ; renvoie true si la personne a autorisé la bulle.
export async function autoriserBulle() {
  try {
    return (await Bulle.demanderAutorisation()).value
  } catch {
    return false
  }
}

// photos : chemins des photos déjà enregistrées dans la galerie (album « Nalow »).
export const afficherBulle = ({ titre, description, prix, photos = [] }) =>
  Bulle.afficher({ titre, description, prix: prix == null ? '' : String(prix), photos })

// Icônes réelles des applis installées, par nom de paquet ({} sur le site ou en cas d'échec).
export async function iconesApplis(paquets) {
  if (!estAppliNative()) return {}
  try {
    return (await Bulle.iconesApplis({ paquets })).icones || {}
  } catch {
    return {}
  }
}
