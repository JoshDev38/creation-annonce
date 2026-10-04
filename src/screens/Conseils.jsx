import { useEffect, useState } from 'react'
import oursPhoto from '../assets/aide/ours-photo.png'
import oursTelephone from '../assets/aide/ours-telephone.png'
import fonctionne1 from '../assets/aide/fonctionne-1.png'
import fonctionne2 from '../assets/aide/fonctionne-2.png'
import fonctionne3 from '../assets/aide/fonctionne-3.png'
import fonctionne4 from '../assets/aide/fonctionne-4.png'
import fonctionne5 from '../assets/aide/fonctionne-5.png'
import mascotte from '../assets/mascotte.png'
import {
  IconChatDots,
  IconChevron,
  IconClipboard,
  IconDrap,
  IconHeart,
  IconMessage,
  IconSearch,
  IconSun,
  IconTag,
  IconUser,
} from '../components/Icons.jsx'

// Chaque rubrique a sa page et son ourson (« ours ») ; la page Aide liste les rubriques.
// Pour ajouter de l'aide : une entrée dans une rubrique, ou une nouvelle rubrique.
// Les rubriques sans ourson dédié affichent la mascotte en attendant le leur.
const THEMES = [
  {
    id: 'annonces',
    titre: 'Réussir mes annonces',
    resume: 'Photos, prix, mots-clés : nos conseils pour vendre vite',
    ours: oursPhoto,
    items: [
      {
        Icone: IconSun,
        titre: 'Soignez la lumière',
        texte:
          'Photographiez près d’une fenêtre, en journée et sans flash. La lumière naturelle révèle mieux les couleurs et les détails.',
      },
      {
        Icone: IconDrap,
        titre: 'Choisissez un fond simple',
        texte: 'Un mur uni, un drap clair ou un sol dégagé : votre objet reste au centre de l’attention.',
      },
      {
        Icone: IconSearch,
        titre: 'Montrez les détails',
        texte:
          'Photographiez l’étiquette, la marque, la matière et les détails importants. S’il y a une tache, une rayure ou un petit défaut, montrez-le aussi : la transparence rassure l’acheteur et évite les mauvaises surprises.',
      },
      {
        Icone: IconTag,
        titre: 'Choisissez le bon prix',
        texte:
          'Un prix juste augmente vos chances de vendre rapidement. Malow vous aide à trouver une estimation adaptée à votre objet.',
      },
      {
        Icone: IconMessage,
        titre: 'Misez sur les bons mots-clés',
        texte:
          'Marque, taille, couleur, matière, modèle… Malow les intègre pour rendre votre annonce plus facile à trouver.',
      },
      {
        Icone: IconChatDots,
        titre: 'Répondez rapidement',
        texte:
          'Une réponse rapide peut faire la différence. Pensez à activer les notifications de vos plateformes de vente.',
      },
      {
        Icone: IconClipboard,
        titre: 'Pensez comme un acheteur',
        texte:
          'Avant de publier, relisez votre annonce et demandez-vous si elle répond aux questions que vous vous poseriez avant d’acheter : photos claires ? informations complètes ? prix cohérent ?',
      },
    ],
  },
  {
    id: 'fonctionnement',
    titre: 'Comment fonctionne Malow ?',
    resume: 'Les 5 étapes pour créer votre annonce',
    ours: oursTelephone,
    items: [
      {
        image: fonctionne1,
        titre: 'Ajoutez vos photos',
        texte: 'Prenez ou importez jusqu’à 8 photos de l’objet que vous souhaitez vendre.',
      },
      {
        image: fonctionne2,
        titre: 'Donnez quelques informations',
        texte:
          'À l’écrit ou à l’oral, indiquez simplement ce que vous savez sur votre objet : marque, taille, état, matière…',
      },
      {
        image: fonctionne3,
        titre: 'Malow s’occupe du reste',
        texte:
          'Malow analyse vos photos et vos informations pour créer votre annonce et estimer un prix adapté.',
      },
      {
        image: fonctionne4,
        titre: 'Vérifiez et ajustez',
        texte: 'Relisez le résultat et, si besoin, modifiez ce que vous souhaitez : titre, description, prix…',
      },
      {
        image: fonctionne5,
        titre: 'Votre annonce est prête !',
        texte:
          'Copiez votre annonce et publiez-la sur la plateforme de vente de votre choix (Vinted, Leboncoin, Facebook Marketplace…).',
      },
    ],
  },
  {
    id: 'compte',
    titre: 'Mon compte',
    resume: 'Fidélité, profil et contact',
    ours: null,
    items: [
      {
        Icone: IconHeart,
        titre: 'La fidélité',
        texte:
          'Chaque annonce sauvegardée ou publiée vous fait gagner des points. Montez de palier pour débloquer des récompenses : tout est dans Profil › Fidélité.',
      },
      {
        Icone: IconUser,
        titre: 'Mon profil',
        texte:
          'Dans Profil, touchez votre photo pour la changer et le crayon pour modifier votre pseudo. Vous pouvez aussi vous déconnecter ou supprimer votre compte et toutes vos données.',
      },
      {
        Icone: IconChatDots,
        titre: 'Une question ?',
        texte: 'Écrivez-nous à contact@malow.app, nous vous répondrons avec plaisir.',
        lien: 'mailto:contact@malow.app',
      },
    ],
  },
]

// En-tête commun : vague bleue, titre, sous-titre et ourson de la rubrique.
function EnteteAide({ sousTitre, ours, onRetour }) {
  return (
    <header className="aide-haut">
      <svg className="aide-vague" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0h400v150c-60-40-130 10-200-30S60 60 0 110z" />
      </svg>
      {onRetour && (
        <button className="aide-retour" onClick={onRetour} aria-label="Retour">
          <IconChevron width={26} height={26} />
        </button>
      )}
      <div className="aide-titres">
        <h1 className="titre-l">Aide & conseils</h1>
        <p>{sousTitre}</p>
      </div>
      <img className={`aide-ours ${ours ? '' : 'mascotte'}`} src={ours || mascotte} alt="" aria-hidden="true" />
    </header>
  )
}

export default function Conseils({ retourInterne }) {
  const [rubrique, setRubrique] = useState(null)
  const theme = THEMES.find((t) => t.id === rubrique)

  // Bouton retour d'Android : d'une rubrique, on revient au menu de l'aide.
  useEffect(() => {
    if (!retourInterne) return
    retourInterne.current = () => {
      if (!rubrique) return false
      setRubrique(null)
      return true
    }
    return () => {
      retourInterne.current = null
    }
  }, [rubrique, retourInterne])

  if (theme) {
    return (
      <main className="page page-aide" key={theme.id}>
        <EnteteAide sousTitre={theme.titre} ours={theme.ours} onRetour={() => setRubrique(null)} />
        <ol className="items-aide">
          {theme.items.map(({ Icone, image, titre, texte, lien }, i) => (
            <li key={titre}>
              {image ? (
                <img className="icone-aide image" src={image} alt="" aria-hidden="true" />
              ) : (
                <span className={`icone-aide ${i % 2 ? 'beige' : ''}`}>
                  <Icone width={30} height={30} />
                </span>
              )}
              <div>
                <strong>
                  <span className="num-aide">{i + 1}</span>
                  {titre}
                </strong>
                <p>{lien ? <a href={lien}>{texte}</a> : texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
    )
  }

  return (
    <main className="page page-aide">
      <EnteteAide sousTitre="Comment pouvons-nous vous aider ?" ours={null} />
      <ul className="rubriques-aide">
        {THEMES.map((t) => (
          <li key={t.id}>
            <button className="rubrique-aide" onClick={() => setRubrique(t.id)}>
              <img src={t.ours || mascotte} alt="" aria-hidden="true" />
              <span>
                <strong>{t.titre}</strong>
                <small>{t.resume}</small>
              </span>
              <IconChevron width={20} height={20} />
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
