import { formaterDescription } from './paragraphes.js'

// Génère une annonce à partir des informations données par l'utilisateur.
// Tout se fait en local, dans le navigateur : pas de serveur ni de clé d'API.
// Pour brancher une vraie IA de vision plus tard, il suffit de remplacer
// `genererAnnonce` par un appel réseau qui renvoie le même format d'objet.

const CATEGORIES = [
  { mots: ['manteau', 'doudoune', 'parka'], nom: 'Manteau', intro: 'Joli manteau', famille: 'vetement', prix: 22, saison: 'Automne / Hiver' },
  { mots: ['veste', 'blouson', 'gilet'], nom: 'Veste', intro: 'Jolie veste', famille: 'vetement', prix: 16, saison: 'Mi-saison' },
  { mots: ['pull', 'sweat', 'cardigan'], nom: 'Pull', intro: 'Joli pull', famille: 'vetement', prix: 10, saison: 'Automne / Hiver' },
  { mots: ['robe'], nom: 'Robe', intro: 'Jolie robe', famille: 'vetement', prix: 12 },
  { mots: ['jean', 'pantalon', 'jogging', 'legging'], nom: 'Pantalon', intro: 'Joli pantalon', famille: 'vetement', prix: 9 },
  { mots: ['t-shirt', 'tee-shirt', 'tshirt', 'chemise', 'blouse', 'haut'], nom: 'Haut', intro: 'Joli haut', famille: 'vetement', prix: 6, saison: 'Printemps / Été' },
  { mots: ['short', 'jupe'], nom: 'Jupe / short', intro: 'Jolie pièce', famille: 'vetement', prix: 7, saison: 'Printemps / Été' },
  { mots: ['pyjama', 'body', 'grenouillère'], nom: 'Pyjama', intro: 'Joli pyjama', famille: 'vetement', prix: 6 },
  { mots: ['chaussure', 'basket', 'botte', 'sandale', 'bottine'], nom: 'Chaussures', intro: 'Jolies chaussures', famille: 'vetement', prix: 14 },
  { mots: ['sac', 'cartable', 'sacoche'], nom: 'Sac', intro: 'Joli sac', famille: 'accessoire', prix: 12 },
  { mots: ['peluche', 'doudou', 'nounours', 'ours'], nom: 'Peluche', intro: 'Adorable peluche', famille: 'jouet', prix: 8 },
  { mots: ['jouet', 'jeu', 'lego', 'playmobil', 'puzzle', 'poupée'], nom: 'Jouet', intro: 'Joli jouet', famille: 'jouet', prix: 12 },
  { mots: ['livre', 'roman', 'bd', 'bande dessinée', 'manga'], nom: 'Livre', intro: 'Livre', famille: 'livre', prix: 5 },
  { mots: ['poussette', 'siège auto', 'cosy', 'porte-bébé'], nom: 'Équipement bébé', intro: 'Équipement de puériculture', famille: 'puericulture', prix: 60 },
  { mots: ['vélo', 'trottinette', 'draisienne', 'rollers'], nom: 'Vélo / trottinette', intro: 'Vélo / trottinette', famille: 'sport', prix: 40 },
  { mots: ['lampe', 'luminaire', 'applique'], nom: 'Lampe', intro: 'Jolie lampe', famille: 'maison', prix: 15 },
  { mots: ['vase', 'cadre', 'miroir', 'déco', 'décoration', 'coussin'], nom: 'Objet déco', intro: 'Joli objet de décoration', famille: 'maison', prix: 10 },
  { mots: ['chaise', 'table', 'meuble', 'étagère', 'commode', 'bureau'], nom: 'Meuble', intro: 'Joli meuble', famille: 'maison', prix: 45 },
  { mots: ['téléphone', 'smartphone', 'tablette', 'console', 'casque', 'enceinte'], nom: 'Appareil électronique', intro: 'Appareil', famille: 'high-tech', prix: 60 },
]

const ETATS = [
  { mots: ['neuf avec étiquette', 'jamais porté', 'jamais servi', 'avec étiquette'], nom: 'Neuf avec étiquette', coef: 1.6 },
  { mots: ['comme neuf', 'comme neuve', 'neuf', 'neuve', 'impeccable', 'parfait état'], nom: 'Comme neuf', coef: 1.3 },
  { mots: ['très bon état', 'tres bon etat', 'peu porté', 'peu servi', 'tbe'], nom: 'Très bon état', coef: 1 },
  { mots: ['bon état', 'bon etat'], nom: 'Bon état', coef: 0.8 },
  { mots: ['usé', 'usure', 'abîmé', 'tâche', 'tache', 'trou', 'défaut', 'état correct', 'satisfaisant'], nom: 'État correct', coef: 0.55 },
]

const COULEURS = [
  'beige', 'blanc', 'noir', 'gris', 'bleu', 'marine', 'rouge', 'rose', 'vert', 'jaune',
  'orange', 'violet', 'marron', 'camel', 'crème', 'écru', 'doré', 'argenté', 'kaki', 'bordeaux',
]

const MATIERES = ['coton', 'laine', 'lin', 'cuir', 'jean', 'velours', 'polaire', 'bois', 'métal', 'verre', 'céramique', 'plastique']

const DETAILS = [
  { mots: ['capuche'], texte: 'capuche' },
  { mots: ['fourrure', 'moumoute'], texte: 'fourrure' },
  { mots: ['bouton'], texte: 'boutons' },
  { mots: ['zip', 'fermeture éclair'], texte: 'fermeture éclair' },
  { mots: ['poche'], texte: 'poches' },
  { mots: ['doublé', 'doublure'], texte: 'doublure' },
  { mots: ['imperméable', 'déperlant'], texte: 'tissu imperméable' },
  { mots: ['piles', 'batterie'], texte: 'fonctionne sur piles / batterie' },
  { mots: ['notice', 'boîte', 'boite', 'emballage'], texte: 'livré avec sa boîte' },
]

const MARQUES_CONNUES = [
  'zara', 'h&m', 'kiabi', 'jacadi', 'petit bateau', 'cyrillus', 'okaïdi', 'okaidi', 'vertbaudet', 'catimini',
  'du pareil au même', 'dpam', 'tape à l\'oeil', 'tao', 'bonpoint', 'nike', 'adidas', 'decathlon', 'ikea',
  'lego', 'playmobil', 'vtech', 'fisher-price', 'sergent major', 'monoprix', 'uniqlo', 'levi\'s', 'apple', 'samsung',
]

const minuscule = (s) => s.toLowerCase().normalize('NFC')
const capitaliser = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Mot entier (pluriel en -s / -x accepté) : « ours » ne doit pas trouver « cours ».
const contient = (texte, mots) =>
  mots.some((m) => new RegExp(`(^|[^a-zà-ÿ])${echapper(m)}(s|x)?(?![a-zà-ÿ])`).test(texte))

function trouverTaille(texte) {
  let m = texte.match(/(\d{1,2})\s*(ans|an)\b/)
  if (m) return { libelle: `${m[1]} ans`, enfant: true }
  m = texte.match(/(\d{1,2})\s*mois\b/)
  if (m) return { libelle: `${m[1]} mois`, enfant: true }
  m = texte.match(/\b(?:taille|t)\s*(xxs|xs|s|m|l|xl|xxl|\d{2})\b/)
  if (m) return { libelle: `Taille ${m[1].toUpperCase()}`, enfant: false }
  m = texte.match(/\bpointure\s*(\d{2})\b/)
  if (m) return { libelle: `Pointure ${m[1]}`, enfant: false }
  return null
}

function trouverMarque(texte) {
  const m = texte.match(/marque\s*:?\s*([a-zà-ÿ0-9&' -]{2,25}?)(?=[,.;!\n]|$| et | en | taille| état)/)
  if (m) return capitaliser(m[1].trim())
  const connue = MARQUES_CONNUES.find((mq) => texte.includes(mq))
  return connue ? connue.split(' ').map(capitaliser).join(' ') : null
}

function public_(texte, taille) {
  if (contient(texte, ['bébé', 'bebe', 'naissance'])) return 'bébé'
  if (contient(texte, ['fille'])) return 'fille'
  if (contient(texte, ['garçon', 'garcon'])) return 'garçon'
  if (contient(texte, ['enfant', 'kid']) || taille?.enfant) return 'enfant'
  if (contient(texte, ['femme'])) return 'femme'
  if (contient(texte, ['homme'])) return 'homme'
  return null
}

const arrondir = (n) => Math.max(1, Math.round(n))

export function genererAnnonce(infos = '') {
  const texte = minuscule(infos)

  const categorie =
    CATEGORIES.find((c) => contient(texte, c.mots)) ||
    { nom: 'Objet', intro: 'Joli objet', famille: 'divers', prix: 10 }
  const etat = ETATS.find((e) => contient(texte, e.mots)) || { nom: 'Très bon état', coef: 1 }
  const taille = trouverTaille(texte)
  const marque = trouverMarque(texte)
  const pour = public_(texte, taille)
  const couleurs = COULEURS.filter((c) => contient(texte, [c]))
  const matieres = MATIERES.filter((m) => contient(texte, [m]))
  const details = DETAILS.filter((d) => contient(texte, d.mots)).map((d) => d.texte)

  // Prix : base de la catégorie × état, un peu plus pour une marque connue.
  const bonusMarque = marque ? 1.25 : 1
  const conseille = arrondir(categorie.prix * etat.coef * bonusMarque)
  const prix = {
    conseille,
    rapide: arrondir(conseille * 0.75),
    haut: arrondir(conseille * 1.25),
  }

  // Titre
  const morceauxTitre = [categorie.nom]
  if (pour) morceauxTitre.push(pour)
  if (marque) morceauxTitre.push(marque)
  if (taille) morceauxTitre.push(taille.libelle)
  const titre = `${morceauxTitre.join(' ')} – ${etat.nom}`

  // Description
  const phrases = []
  let intro = categorie.intro
  if (pour) intro += pour === 'enfant' ? ' enfant' : ` pour ${pour}`
  if (marque) intro += ` de la marque ${marque}`
  if (taille) intro += `, ${taille.enfant ? `taille ${taille.libelle}` : minuscule(taille.libelle)}`
  if (couleurs.length) intro += `, de couleur ${couleurs.join(' et ')}`
  phrases.push(`${intro}.`)
  const caracteristiques = [...matieres.map((m) => `en ${m}`), ...details]
  if (caracteristiques.length) phrases.push(`${capitaliser(caracteristiques.join(', '))}.`)
  if (categorie.saison) phrases.push(`Idéal pour la saison ${minuscule(categorie.saison)}.`)

  // Paragraphes par thème, séparés par une ligne vide (comme l'annonce rédigée par l'IA).
  const paragraphes = [
    `Description : ${phrases.join(' ')}`,
    `État : ${etat.nom} général${etat.coef >= 1 ? ', a très peu servi' : ''}.`,
    taille && `Taille / dimensions : ${taille.libelle}.`,
    'Livraison : envoi soigné, remise en main propre possible.',
  ].filter(Boolean)

  // Mots-clés
  const tags = [
    categorie.nom,
    pour && capitaliser(pour),
    marque,
    taille?.libelle,
    ...couleurs.map(capitaliser),
    categorie.saison,
    etat.nom,
  ].filter(Boolean)

  return {
    titre,
    description: paragraphes.join('\n\n'),
    prix,
    tags: [...new Set(tags)],
  }
}

export function texteAnnonce(annonce) {
  return [
    annonce.titre,
    '',
    formaterDescription(annonce.description),
    '',
    `Prix : ${annonce.prix.conseille} €`,
    '',
    annonce.tags.map((t) => `#${t.replace(/[\s/]+/g, '')}`).join(' '),
  ].join('\n')
}
