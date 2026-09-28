// Remet une ligne vide avant chaque intitulé de la description
// (« État : », « Taille / dimensions : », « Livraison : »…), même si le texte arrive d'un bloc.
const INTITULES = /\s*(?<![\p{L}\p{N}])(Description|État|Etat|Taille \/ dimensions|Taille|Dimensions|Livraison)\s*:\s*/gu

export function formaterDescription(texte = '') {
  return String(texte)
    .replace(INTITULES, (_, intitule, decalage) => `${decalage === 0 ? '' : '\n\n'}${intitule} : `)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function paragraphes(texte = '') {
  return formaterDescription(texte)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
