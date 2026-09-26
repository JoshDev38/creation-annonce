import { useState } from 'react'
import { IconCamera, IconTrash } from '../components/Icons.jsx'
import { lireAnnonces, supprimerAnnonce } from '../lib/stockage.js'

export default function MesAnnonces({ onOuvrir, onNouvelle }) {
  const [annonces, setAnnonces] = useState(lireAnnonces)

  const supprimer = (id) => {
    if (confirm('Supprimer cette annonce ?')) setAnnonces(supprimerAnnonce(id))
  }

  return (
    <main className="page">
      <h1 className="titre-l">Mes annonces</h1>
      {annonces.length === 0 ? (
        <div className="vide-etat">
          <p className="texte-bleu">Aucune annonce sauvegardée pour l’instant.</p>
          <button className="bouton bouton-principal" onClick={onNouvelle}>
            <IconCamera width={24} height={24} /> Créer ma première annonce
          </button>
        </div>
      ) : (
        <ul className="liste-annonces">
          {annonces.map((a) => (
            <li key={a.id} className="annonce-ligne">
              <button className="annonce-ouvrir" onClick={() => onOuvrir(a)}>
                {a.photo ? <img src={a.photo} alt="" /> : <span className="vignette-vide" />}
                <span className="carte-texte">
                  <strong>{a.titre}</strong>
                  <small>
                    {a.prix.conseille} € · {new Date(a.date).toLocaleDateString('fr-FR')}
                  </small>
                </span>
              </button>
              <button className="icone-bouton" aria-label="Supprimer" onClick={() => supprimer(a.id)}>
                <IconTrash width={20} height={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
