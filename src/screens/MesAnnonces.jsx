import { useEffect, useState } from 'react'
import { IconCamera, IconTrash } from '../components/Icons.jsx'
import { listerAnnoncesCloud, supprimerAnnonceCloud } from '../lib/annoncesCloud.js'
import { lireAnnonces, supprimerAnnonce } from '../lib/stockage.js'

export default function MesAnnonces({ session, onOuvrir, onNouvelle, onConnexion, notifier }) {
  const [annonces, setAnnonces] = useState(session ? null : lireAnnonces)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    if (!session) {
      setAnnonces(lireAnnonces())
      return
    }
    setErreur(false)
    listerAnnoncesCloud()
      .then(setAnnonces)
      .catch(() => {
        setErreur(true)
        setAnnonces([])
      })
  }, [session])

  const supprimer = async (a) => {
    if (!confirm('Supprimer cette annonce ?')) return
    if (!session) {
      setAnnonces(supprimerAnnonce(a.id))
      return
    }
    try {
      await supprimerAnnonceCloud(a)
      setAnnonces((liste) => liste.filter((x) => x.id !== a.id))
    } catch {
      notifier('La suppression a échoué')
    }
  }

  return (
    <main className="page">
      <h1 className="titre-l">Mes annonces</h1>

      {!session && (
        <div className="encart-compte">
          <p>Connectez-vous pour sauvegarder vos annonces et les retrouver sur tous vos appareils.</p>
          <button className="bouton-petit" onClick={onConnexion}>
            Se connecter
          </button>
        </div>
      )}

      {annonces === null ? (
        <p className="petit centre">Chargement de vos annonces…</p>
      ) : erreur ? (
        <p className="erreur">Impossible de charger vos annonces. Vérifiez votre connexion.</p>
      ) : annonces.length === 0 ? (
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
                    {a.prix?.conseille ? `${a.prix.conseille} € · ` : ''}
                    {new Date(a.date).toLocaleDateString('fr-FR')}
                  </small>
                </span>
              </button>
              <button className="icone-bouton" aria-label="Supprimer" onClick={() => supprimer(a)}>
                <IconTrash width={20} height={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
