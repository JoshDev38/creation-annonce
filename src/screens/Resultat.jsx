import { useState } from 'react'
import Entete from '../components/Entete.jsx'
import { IconCheck, IconCopy, IconSparkle } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { copierTexte } from '../lib/stockage.js'

export default function Resultat({ annonce, onChange, onCopie, onSuivant, onRetour }) {
  const [edition, setEdition] = useState(false)
  const [tagsTexte, setTagsTexte] = useState(annonce.tags.join(', '))

  const maj = (champ, valeur) => onChange({ ...annonce, [champ]: valeur })

  const majPrix = (valeur) => {
    const conseille = Math.max(0, Number(valeur) || 0)
    onChange({
      ...annonce,
      prix: { conseille, rapide: Math.round(conseille * 0.75), haut: Math.round(conseille * 1.25) },
    })
  }

  const finirEdition = () => {
    maj('tags', tagsTexte.split(',').map((t) => t.trim()).filter(Boolean))
    setEdition(false)
  }

  const copier = async (texte) => {
    if (await copierTexte(texte)) onCopie()
  }

  const copierAnnonce = async () => {
    await copier(texteAnnonce(annonce))
    onSuivant()
  }

  return (
    <main className="page page-resultat">
      <Entete onRetour={onRetour} />

      <div className="resultat-haut">
        {annonce.photo ? (
          <img className="vignette" src={annonce.photo} alt="" />
        ) : (
          <div className="vignette vide" />
        )}
        <div className="carte-prix">
          <IconSparkle className="etincelle" width={22} height={22} />
          <span>Prix conseillé</span>
          {edition ? (
            <label className="prix-edition">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={annonce.prix.conseille}
                onChange={(e) => majPrix(e.target.value)}
              />
              €
            </label>
          ) : (
            <strong>{annonce.prix.conseille} €</strong>
          )}
          <small>Vente rapide : <b>{annonce.prix.rapide} €</b></small>
          <small>Prix haut : <b>{annonce.prix.haut} €</b></small>
        </div>
      </div>

      <section className="bloc">
        <div className="bloc-titre">
          <h2>Titre</h2>
          {!edition && (
            <button className="icone-bouton" onClick={() => copier(annonce.titre)} aria-label="Copier le titre">
              <IconCopy width={20} height={20} />
            </button>
          )}
        </div>
        {edition ? (
          <input className="champ" value={annonce.titre} onChange={(e) => maj('titre', e.target.value)} />
        ) : (
          <p>{annonce.titre}</p>
        )}
      </section>

      <section className="bloc">
        <div className="bloc-titre">
          <h2>Description</h2>
          {!edition && (
            <button
              className="icone-bouton"
              onClick={() => copier(annonce.description)}
              aria-label="Copier la description"
            >
              <IconCopy width={20} height={20} />
            </button>
          )}
        </div>
        {edition ? (
          <textarea
            className="champ"
            rows={6}
            value={annonce.description}
            onChange={(e) => maj('description', e.target.value)}
          />
        ) : (
          <p className="description">{annonce.description}</p>
        )}
      </section>

      {edition ? (
        <section className="bloc">
          <h2>Mots-clés (séparés par des virgules)</h2>
          <input className="champ" value={tagsTexte} onChange={(e) => setTagsTexte(e.target.value)} />
        </section>
      ) : (
        <ul className="tags">
          {annonce.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}

      <div className="actions">
        {edition ? (
          <button className="bouton bouton-principal" onClick={finirEdition}>
            <IconCheck width={22} height={22} /> Valider les modifications
          </button>
        ) : (
          <>
            <button className="bouton bouton-principal" onClick={copierAnnonce}>
              <IconCopy width={22} height={22} /> Copier l’annonce
            </button>
            <button
              className="bouton bouton-doux"
              onClick={() => {
                setTagsTexte(annonce.tags.join(', '))
                setEdition(true)
              }}
            >
              Modifier si besoin
            </button>
          </>
        )}
      </div>
    </main>
  )
}
