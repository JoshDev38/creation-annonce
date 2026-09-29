import { useEffect, useRef, useState } from 'react'
import Entete from '../components/Entete.jsx'
import { demarrerDictee, dicteeDisponible } from '../lib/dictee.js'
import { IconChat, IconChevron, IconKeyboard, IconMic, IconSparkle, IconStop } from '../components/Icons.jsx'

export default function Detail({ valeurInitiale, onRetour, onValider }) {
  const [mode, setMode] = useState(valeurInitiale ? 'ecrit' : null)
  const [texte, setTexte] = useState(valeurInitiale)
  const [ecoute, setEcoute] = useState(false)
  const [erreur, setErreur] = useState('')
  const reco = useRef(null)
  const base = useRef('')
  const zone = useRef(null)

  useEffect(() => () => reco.current?.annuler(), [])

  const demarrerOral = async () => {
    setMode('oral')
    setErreur('')
    reco.current?.annuler()
    base.current = texte ? `${texte.trim()} ` : ''
    setEcoute(true)
    try {
      reco.current = await demarrerDictee({
        onTexte: (finaux, partiel) => setTexte(base.current + [finaux, partiel].filter(Boolean).join(' ')),
        onErreur: (message) => setErreur(message),
        onFin: () => setEcoute(false),
      })
    } catch (e) {
      setEcoute(false)
      setErreur(e?.message || 'La dictée n’a pas pu démarrer. Réessayez.')
    }
  }

  const arreterOral = () => reco.current?.arreter()

  const demarrerEcrit = () => {
    reco.current?.annuler()
    setEcoute(false)
    setMode('ecrit')
    setTimeout(() => zone.current?.focus(), 50)
  }

  const valider = () => {
    reco.current?.annuler()
    onValider(texte.trim())
  }

  return (
    <main className="page">
      <Entete onRetour={onRetour} />

      <div className="duo-icones">
        <span className="rond-icone grand">
          <IconMic width={34} height={34} />
        </span>
        <span className="rond-icone grand">
          <IconChat width={34} height={34} />
        </span>
      </div>

      <h1 className="titre-l centre">
        Un détail à ajouter
        <br />
        sur votre objet ?
      </h1>
      <p className="texte-bleu centre">
        Vous pouvez nous donner quelques informations par la voix ou par écrit.
      </p>

      {!mode && (
        <div className="liste-cartes">
          <button className="carte-choix" onClick={demarrerOral}>
            <span className="rond-icone">
              <IconMic width={30} height={30} />
            </span>
            <span className="carte-texte">
              <strong>Le dire à l’oral</strong>
              <small>Parlez quelques secondes : taille, marque, état, défauts… On s’occupe du reste.</small>
            </span>
            <IconChevron width={20} height={20} />
          </button>
          <button className="carte-choix" onClick={demarrerEcrit}>
            <span className="rond-icone">
              <IconKeyboard width={30} height={30} />
            </span>
            <span className="carte-texte">
              <strong>L’écrire</strong>
              <small>Notez simplement ce qui peut être utile : taille, marque, état, défauts…</small>
            </span>
            <IconChevron width={20} height={20} />
          </button>
        </div>
      )}

      {mode && (
        <div className="saisie">
          {mode === 'oral' && dicteeDisponible() && (
            <button
              className={`micro ${ecoute ? 'enregistre' : ''}`}
              onClick={ecoute ? arreterOral : demarrerOral}
              aria-label={ecoute ? 'Arrêter la dictée' : 'Reprendre la dictée'}
            >
              {ecoute ? <IconStop width={28} height={28} /> : <IconMic width={28} height={28} />}
            </button>
          )}
          {mode === 'oral' && dicteeDisponible() && (
            <p className="petit centre">{ecoute ? 'Je vous écoute…' : 'Touchez le micro pour continuer à parler'}</p>
          )}
          {erreur && <p className="erreur">{erreur}</p>}
          <textarea
            ref={zone}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={5}
            placeholder="Ex. : manteau enfant 8 ans, beige, très bon état, capuche avec fourrure, 2 poches…"
          />
          <div className="bascule">
            {mode === 'oral' ? (
              <button className="bouton-lien" onClick={demarrerEcrit}>
                Plutôt l’écrire
              </button>
            ) : (
              <button className="bouton-lien" onClick={demarrerOral}>
                Plutôt le dire à l’oral
              </button>
            )}
          </div>
          <button className="bouton bouton-principal" onClick={valider} disabled={!texte.trim()}>
            <IconSparkle width={22} height={22} /> Créer mon annonce
          </button>
        </div>
      )}

      <div className="actions">
        <button className="bouton bouton-doux" onClick={() => onValider('')}>
          Passer cette étape <IconChevron width={18} height={18} />
        </button>
      </div>
    </main>
  )
}
