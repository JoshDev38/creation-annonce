import { useState } from 'react'
import Entete from '../components/Entete.jsx'
import { IconCheck, IconCopy, IconSparkle } from '../components/Icons.jsx'
import { texteAnnonce } from '../lib/generateur.js'
import { copierTexte } from '../lib/stockage.js'
import { formaterDescription, paragraphes } from '../lib/paragraphes.js'

// Question « marque » ou « modèle » : confirmer la proposition de l'IA, ou
// choisir parmi les autres possibilités, en saisir une, ou passer.
function QuestionIdentite({ question, proposition, autres = [], intitule, onChoix }) {
  const [choix, setChoix] = useState(!proposition)
  const [saisie, setSaisie] = useState('')

  if (!choix) {
    return (
      <div className="suggestion-marque">
        <p>{question}</p>
        <div>
          <button className="bouton-lien" onClick={() => setChoix(true)}>
            Non
          </button>
          <button className="bouton-petit" onClick={() => onChoix(proposition)}>
            C’est bien ça
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="suggestion-marque choix-marque">
      <p>
        {!proposition && typeof question === 'string'
          ? question
          : autres.length
            ? `C’est plutôt l’un de ces choix ?`
            : `Quel est le ${intitule === 'marque' ? 'nom de la marque' : 'modèle'} ?`}
      </p>
      {autres.length > 0 && (
        <div className="puces-marques">
          {autres.map((m) => (
            <button key={m} className="puce-marque" onClick={() => onChoix(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
      <form
        className="autre-marque"
        onSubmit={(e) => {
          e.preventDefault()
          onChoix(saisie)
        }}
      >
        <input
          className="champ"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={intitule === 'marque' ? 'Autre marque…' : 'Autre modèle…'}
          maxLength={60}
        />
        <button className="bouton-petit" type="submit" disabled={!saisie.trim()}>
          OK
        </button>
      </form>
      <button className="bouton-lien" onClick={() => onChoix('')}>
        Je ne sais pas / sans {intitule}
      </button>
    </div>
  )
}

export default function Resultat({ annonce, onChange, onCopie, onSuivant, onRetour, onAbonnements }) {
  const [edition, setEdition] = useState(false)
  const [tagsTexte, setTagsTexte] = useState(annonce.tags.join(', '))
  const [active, setActive] = useState(0)
  const photos = annonce.photos?.length ? annonce.photos : annonce.photo ? [annonce.photo] : []
  // Marque puis modèle incertains : l'IA propose, le vendeur confirme ou choisit.
  const dansTitre = (x) => x && annonce.titre.toLowerCase().includes(x.toLowerCase())
  const marque = annonce.marqueProbable
  const questionMarque = marque && !annonce.marqueTraitee && !dansTitre(marque)
  const modele = annonce.modeleProbable
  // modeleLibre : le vendeur a choisi une autre marque, on lui demande le modèle sans suggestion
  const questionModele =
    !questionMarque && !annonce.modeleTraite && ((modele && !dansTitre(modele)) || annonce.modeleLibre)

  // Ajoute la marque ou le modèle au titre, à la description et aux mots-clés.
  const ajouter = (type, valeur) => {
    const nom = valeur.trim()
    const drapeau = type === 'marque' ? 'marqueTraitee' : 'modeleTraite'
    if (!nom) return onChange({ ...annonce, [drapeau]: true })
    const t = annonce.titre
    let titre
    // marque choisie par le vendeur, ou marque certaine écrite par l'IA
    const marqueTitre = annonce.marqueChoisie || annonce.marque
    const posMarque = type === 'modele' && marqueTitre ? t.toLowerCase().indexOf(marqueTitre.toLowerCase()) : -1
    if (posMarque >= 0) {
      // le modèle se place juste après la marque ; les mots déjà en tête du modèle ne sont pas répétés
      // (« Nike Air » + « Air Force 1 » → « Nike Air Force 1 »)
      const fin = posMarque + marqueTitre.length
      let suite = t.slice(fin)
      const motsModele = nom.toLowerCase().split(/\s+/)
      for (const mot of motsModele) {
        const m = suite.match(/^\s+(\S+)/)
        if (!m || m[1].toLowerCase() !== mot) break
        suite = suite.slice(m[0].length)
      }
      titre = `${t.slice(0, fin)} ${nom}${suite}`
    } else {
      // juste après le type d'objet : avant le premier détail chiffré (« 19 programmes », « 8 ans »…)
      // ou le premier séparateur (« , » suivi d'un espace, pas la virgule d'un nombre comme « 1,5 kg »)
      const coupe = t.search(/ \d|, | – | - /)
      titre = coupe > 0 ? `${t.slice(0, coupe)} ${nom}${t.slice(coupe)}` : `${t} ${nom}`
    }
    // « Marque : … » / « Modèle : … » à la fin du paragraphe Description
    const mention = `${type === 'marque' ? 'Marque' : 'Modèle'} : ${nom}.`
    const blocs = paragraphes(annonce.description)
    if (blocs.length && /^Description\s*:/.test(blocs[0])) blocs[0] = `${blocs[0].replace(/\s*$/, '')} ${mention}`
    else blocs.unshift(mention)
    onChange({
      ...annonce,
      titre,
      description: blocs.join('\n\n'),
      tags: [...new Set([nom, ...annonce.tags])],
      [drapeau]: true,
      ...(type === 'marque' && {
        marqueChoisie: nom,
        // autre marque que celle proposée : les modèles suggérés ne valent plus
        ...(nom.toLowerCase() !== marque.toLowerCase() &&
          annonce.modeleProbable && { autresModeles: [], modeleProbable: '', modeleLibre: true }),
      }),
    })
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
        {annonce.prix?.conseille && annonce.typeAnalyse !== 'standard' ? (
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
        ) : (
          // Formule gratuite : pas d'estimation, le vendeur saisit son prix.
          <div className="carte-prix sans-estimation">
            <span>Votre prix</span>
            <label className="prix-edition">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="—"
                value={annonce.prix?.conseille || ''}
                onChange={(e) => majPrix(e.target.value)}
              />
              €
            </label>
            {onAbonnements && (
              <button className="lien-estimation" onClick={onAbonnements}>
                <IconSparkle width={14} height={14} /> Estimation du prix avec Nalow+
              </button>
            )}
          </div>
        )}
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

      {questionMarque && (
        <QuestionIdentite
          key="marque"
          question={
            <>
              L’IA pense à la marque <strong>{marque}</strong>, sans en être sûre.
            </>
          }
          proposition={marque}
          autres={annonce.autresMarques}
          intitule="marque"
          onChoix={(v) => ajouter('marque', v)}
        />
      )}
      {questionModele && (
        <QuestionIdentite
          key="modele"
          question={
            modele ? (
              <>
                Le modèle serait <strong>{modele}</strong>, sans certitude.
              </>
            ) : (
              'Et le modèle ?'
            )
          }
          proposition={modele}
          autres={annonce.autresModeles}
          intitule="modèle"
          onChoix={(v) => ajouter('modele', v)}
        />
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
