import { useState } from 'react'
import Entete from '../components/Entete.jsx'
import { IconCheck, IconCopy, IconSparkle } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { copierTexte } from '../lib/stockage.js'
import { formaterDescription, paragraphes } from '../lib/paragraphes.js'

export default function Resultat({ annonce, onChange, onCopie, onSuivant, onRetour }) {
  const [edition, setEdition] = useState(false)
  const [tagsTexte, setTagsTexte] = useState(annonce.tags.join(', '))
  const [active, setActive] = useState(0)
  const photos = annonce.photos?.length ? annonce.photos : annonce.photo ? [annonce.photo] : []
  const marque = annonce.marqueProbable
  const marqueVisible =
    marque && !annonce.marqueTraitee && !annonce.titre.toLowerCase().includes(marque.toLowerCase())

  const [choixMarque, setChoixMarque] = useState(false) // « Non » : on propose les autres marques
  const [autreMarque, setAutreMarque] = useState('')

  // Ajoute la marque choisie au titre, à la description et aux mots-clés.
  const ajouterMarque = (m = marque) => {
    const nom = m.trim()
    if (!nom) return
    const t = annonce.titre
    const coupe = t.search(/,| – | - /)
    const titre = coupe > 0 ? `${t.slice(0, coupe)} ${nom}${t.slice(coupe)}` : `${t} ${nom}`
    // « Marque : … » à la fin du paragraphe Description
    const blocs = paragraphes(annonce.description)
    if (blocs.length && /^Description\s*:/.test(blocs[0])) blocs[0] = `${blocs[0].replace(/\s*$/, '')} Marque : ${nom}.`
    else blocs.unshift(`Marque : ${nom}.`)
    onChange({
      ...annonce,
      titre,
      description: blocs.join('\n\n'),
      tags: [...new Set([nom, ...annonce.tags])],
      marqueTraitee: true,
    })
    setChoixMarque(false)
  }

  const sansMarque = () => {
    onChange({ ...annonce, marqueTraitee: true })
    setChoixMarque(false)
  }

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
      <Entete
        onRetour={onRetour}
        droite={
          annonce.source === 'ia' ? (
            <span className="badge-ia">
              <IconSparkle width={15} height={15} /> Rédigée par l’IA
            </span>
          ) : annonce.source === 'local' ? (
            <span className="badge-local">Sans IA</span>
          ) : null
        }
      />

      <div className="resultat-haut">
        {photos.length ? (
          <div className="photo-principale">
            <img className="vignette" src={photos[Math.min(active, photos.length - 1)]} alt="" />
            {photos.length > 1 && (
              <span className="compteur-mini">
                {Math.min(active, photos.length - 1) + 1}/{photos.length}
              </span>
            )}
          </div>
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

      {annonce.explicationPrix && !edition && <p className="explication-prix">{annonce.explicationPrix}</p>}

      {photos.length > 1 && (
        <ul className="galerie">
          {photos.map((p, i) => (
            <li key={i}>
              <button
                className={i === active ? 'active' : ''}
                onClick={() => setActive(i)}
                aria-label={`Voir la photo ${i + 1}`}
              >
                <img src={p} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {marqueVisible && !choixMarque && (
        <div className="suggestion-marque">
          <p>
            L’IA pense à la marque <strong>{marque}</strong>, sans en être sûre.
          </p>
          <div>
            <button className="bouton-lien" onClick={() => setChoixMarque(true)}>
              Non
            </button>
            <button className="bouton-petit" onClick={() => ajouterMarque()}>
              C’est bien ça
            </button>
          </div>
        </div>
      )}

      {marqueVisible && choixMarque && (
        <div className="suggestion-marque choix-marque">
          <p>{annonce.autresMarques?.length ? 'C’est plutôt l’une de celles-ci ?' : 'Quelle est la marque ?'}</p>
          {annonce.autresMarques?.length > 0 && (
            <div className="puces-marques">
              {annonce.autresMarques.map((m) => (
                <button key={m} className="puce-marque" onClick={() => ajouterMarque(m)}>
                  {m}
                </button>
              ))}
            </div>
          )}
          <form
            className="autre-marque"
            onSubmit={(e) => {
              e.preventDefault()
              ajouterMarque(autreMarque)
            }}
          >
            <input
              className="champ"
              value={autreMarque}
              onChange={(e) => setAutreMarque(e.target.value)}
              placeholder="Autre marque ou modèle…"
              maxLength={60}
            />
            <button className="bouton-petit" type="submit" disabled={!autreMarque.trim()}>
              OK
            </button>
          </form>
          <button className="bouton-lien" onClick={sansMarque}>
            Je ne sais pas / sans marque
          </button>
        </div>
      )}

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
              onClick={() => copier(formaterDescription(annonce.description))}
              aria-label="Copier la description"
            >
              <IconCopy width={20} height={20} />
            </button>
          )}
        </div>
        {edition ? (
          <textarea
            className="champ"
            rows={12}
            value={annonce.description}
            onChange={(e) => maj('description', e.target.value)}
          />
        ) : (
          <div className="description">
            {paragraphes(annonce.description).map((p, i) => {
              const m = p.match(/^([^:]{2,25}) : ([\s\S]*)$/)
              return (
                <p key={i}>
                  {m ? (
                    <>
                      <strong>{m[1]} :</strong> {m[2]}
                    </>
                  ) : (
                    p
                  )}
                </p>
              )
            })}
          </div>
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
