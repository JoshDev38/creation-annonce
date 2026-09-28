// Bulle flottante Malow (appli Android) : elle reste par-dessus Vinted ou
// Leboncoin et permet de copier le titre, la description ou le prix.
// Code natif : android/app/src/main/java/app/malow/BullePlugin.java
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

export const afficherBulle = ({ titre, description, prix }) =>
  Bulle.afficher({ titre, description, prix: prix == null ? '' : String(prix) })
