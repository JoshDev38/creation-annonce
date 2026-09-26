import Entete from '../components/Entete.jsx'
import { IconCheck, IconFlash } from '../components/Icons.jsx'

export default function PhotoPrise({ photo, onRetour, onContinuer, onReprendre }) {
  return (
    <main className="page">
      <Entete onRetour={onRetour} droite={<IconFlash className="brun-clair" width={22} height={22} />} />

      <div className="cadre-photo">
        <img src={photo} alt="Votre objet" />
        <span className="coin coin-hg" />
        <span className="coin coin-hd" />
        <span className="coin coin-bg" />
        <span className="coin coin-bd" />
      </div>

      <div className="photo-ok">
        <span className="coche-ronde">
          <IconCheck width={22} height={22} />
        </span>
        <h2 className="titre-m">Photo prise !</h2>
      </div>
      <p className="texte-bleu centre">Un détail à ajouter sur votre objet ?</p>

      <div className="actions">
        <button className="bouton bouton-principal" onClick={onContinuer}>
          Continuer
        </button>
        <button className="bouton-lien" onClick={onReprendre}>
          Reprendre la photo
        </button>
      </div>
    </main>
  )
}
