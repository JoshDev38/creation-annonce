import { useState } from 'react'
import oursPhoto from '../assets/ours-photo.png'
import {
  IconCamera,
  IconChatDots,
  IconChevron,
  IconClipboard,
  IconDrap,
  IconHeart,
  IconMessage,
  IconMic,
  IconSave,
  IconSearch,
  IconShare,
  IconSparkle,
  IconSun,
  IconTag,
  IconUser,
} from '../components/Icons.jsx'

// Chaque thème est un menu déroulant ; le premier est ouvert à l'arrivée.
// Pour ajouter de l'aide : une entrée dans un thème, ou un nouveau thème.
const THEMES = [
  {
    id: 'annonces',
    titre: 'Réussir mes annonces',
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
    id: 'malow',
    titre: 'Bien utiliser Malow',
    items: [
      {
        Icone: IconCamera,
        titre: 'Prendre les photos',
        texte:
          'Jusqu’à 8 photos par annonce, avec l’appareil photo de Malow ou depuis votre galerie. La première photo est la photo principale. Touchez l’éclair pour allumer le flash si besoin.',
      },
      {
        Icone: IconMic,
        titre: 'Dicter les détails',
        texte:
          'Touchez « Le dire à l’oral » et parlez naturellement : taille, état, défauts, prix d’achat… L’écoute continue jusqu’à ce que vous touchiez le bouton stop. Vous pouvez corriger le texte avant de lancer l’analyse.',
      },
      {
        Icone: IconSparkle,
        titre: 'Marque et modèle',
        texte:
          'Quand l’IA hésite sur la marque ou le modèle, elle vous le demande. Confirmez, choisissez parmi ses propositions ou écrivez la bonne réponse : elle s’ajoute au titre et à la description.',
      },
      {
        Icone: IconShare,
        titre: 'Publier sur Vinted, Leboncoin…',
        texte:
          'Touchez « Publier » puis choisissez la plateforme. Les photos sont rangées dans l’album « Malow » de votre galerie et une bulle Malow reste par-dessus l’appli : touchez-la pour copier le titre, la description ou le prix, puis collez-les dans le formulaire.',
      },
      {
        Icone: IconSave,
        titre: 'Retrouver mes annonces',
        texte:
          'Sauvegardez une annonce pour la retrouver dans « Mes annonces », sur tous vos appareils. Vous pouvez la rouvrir, la modifier et la publier plus tard.',
      },
    ],
  },
  {
    id: 'compte',
    titre: 'Mon compte',
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

export default function Conseils() {
  const [ouvert, setOuvert] = useState('annonces')

  return (
    <main className="page page-aide">
      <header className="aide-haut">
        <svg className="aide-vague" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0h400v150c-60-40-130 10-200-30S60 60 0 110z" />
        </svg>
        <div className="aide-titres">
          <h1 className="titre-l">Aide & conseils</h1>
          <p>Réussir mes annonces</p>
        </div>
        <img className="aide-ours" src={oursPhoto} alt="" aria-hidden="true" />
      </header>

      <div className="themes-aide">
        {THEMES.map((theme) => {
          const estOuvert = ouvert === theme.id
          return (
            <section key={theme.id} className={`theme-aide ${estOuvert ? 'ouvert' : ''}`}>
              <button
                className="theme-titre"
                onClick={() => setOuvert(estOuvert ? null : theme.id)}
                aria-expanded={estOuvert}
              >
                <span>{theme.titre}</span>
                <IconChevron width={20} height={20} />
              </button>
              {estOuvert && (
                <ol className="items-aide">
                  {theme.items.map(({ Icone, titre, texte, lien }, i) => (
                    <li key={titre}>
                      <span className={`icone-aide ${i % 2 ? 'beige' : ''}`}>
                        <Icone width={30} height={30} />
                      </span>
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
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
