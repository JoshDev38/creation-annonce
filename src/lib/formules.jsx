// Les formules d'abonnement (plaquette « Abonnements »). « gratuit » par défaut.
// Le paiement (Google Play Billing) n'est pas encore branché.
import oursGratuit from '../assets/abonnements/abo-gratuit.png'
import oursMensuel from '../assets/abonnements/abo-mensuel.png'
import oursAnnuel from '../assets/abonnements/abo-annuel.png'

export const FORMULES = [
  {
    id: 'gratuit',
    nom: 'Malow Gratuit',
    court: 'Gratuit',
    prix: '0 €',
    ours: oursGratuit,
    cadeau: '2 annonces Premium offertes à l’inscription !',
    avantages: [
      [true, <>Jusqu’à <strong>5 annonces</strong> par mois</>],
      [true, 'Création titre + description'],
      [true, 'Analyse des photos (standard)'],
      [false, 'Estimation du prix de vente'],
      [false, 'Recherche des prix du marché'],
      [true, 'Une publicité est affichée (1 publicité par annonce)'],
    ],
  },
  {
    id: 'mensuel',
    nom: 'Malow+ Mensuel',
    court: 'Malow+ Mensuel',
    prix: '5,99 €/mois',
    ours: oursMensuel,
    accroche: 'Vendez plus, plus vite avec toutes les fonctionnalités.',
    bouton: 'Choisir Mensuel',
    avantages: [
      [true, <>Jusqu’à <strong>15 annonces</strong> par mois</>],
      [true, 'Création titre + description'],
      [true, 'Analyse des photos (avancée)'],
      [true, 'Estimation du prix de vente'],
      [true, 'Recherche des prix du marché (approfondie)'],
      [false, 'Aucune publicité'],
    ],
  },
  {
    id: 'annuel',
    nom: 'Malow+ Annuel',
    court: 'Malow+ Annuel',
    prix: '54,99 €/an',
    soit: 'Soit 4,59 €/mois',
    economie: '-23 %',
    ours: oursAnnuel,
    accroche: 'Les mêmes fonctionnalités que Malow+ Mensuel, à un prix encore plus doux !',
    bouton: 'Choisir Annuel',
    avantages: [
      [true, <>Jusqu’à <strong>15 annonces</strong> par mois</>],
      [true, 'Création titre + description'],
      [true, 'Analyse des photos (avancée)'],
      [true, 'Estimation du prix de vente'],
      [true, 'Recherche des prix du marché (approfondie)'],
      [false, 'Aucune publicité'],
    ],
  },
]

export const formule = (id) => FORMULES.find((f) => f.id === id) || FORMULES[0]
