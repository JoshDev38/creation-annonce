import { useEffect, useState } from 'react'
import Entete from '../components/Entete.jsx'
import { IconCheck } from '../components/Icons.jsx'
import { chargerFidelite } from '../lib/fidelite.js'

const date = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export default function Fidelite({ onRetour }) {
  const [f, setF] = useState(null)
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    chargerFidelite()
      .then(setF)
      .catch((e) => {
        console.error(e)
        setErreur(true)
      })
  }, [])

  const libelles = Object.fromEntries((f?.regles || []).map((r) => [r.action, r.libelle]))

  return (
    <main className="page page-fidelite">
      <Entete onRetour={onRetour} />
      <h1 className="titre-l centre">Fidélité</h1>

      {erreur && <p className="centre texte-bleu">Impossible de charger votre fidélité. Vérifiez votre connexion.</p>}
      {!f && !erreur && <p className="centre texte-bleu">Chargement…</p>}

      {f && (
        <>
          <section className="carte-niveau">
            <div className="medaille">{f.actuel?.niveau ?? 1}</div>
            <strong>{f.actuel?.nom}</strong>
            <span>{f.total} point{f.total > 1 ? 's' : ''}</span>
            <div className="jauge" aria-hidden="true">
              <div style={{ width: `${Math.round(f.progression * 100)}%` }} />
            </div>
            <small>
              {f.suivant
                ? `Encore ${f.suivant.points_min - f.total} points pour « ${f.suivant.nom} »`
                : 'Vous avez atteint le plus haut palier !'}
            </small>
          </section>

          <h2 className="titre-m">Les paliers</h2>
          <ol className="paliers">
            {f.niveaux.map((n) => (
              <li key={n.niveau} className={`${n.atteint ? 'atteint' : ''} ${n.niveau === f.actuel?.niveau ? 'actuel' : ''}`}>
                <span className="pastille">{n.atteint ? <IconCheck width={16} height={16} /> : n.niveau}</span>
                <div>
                  <strong>{n.nom}</strong>
                  <small>
                    {n.points_min} points · {n.description}
                  </small>
                  {n.recompenses.length > 0 ? (
                    <ul className="recompenses">
                      {n.recompenses.map((r) => (
                        <li key={r.id}>
                          🎁 {r.titre}
                          {r.description && <small> — {r.description}</small>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <em>Récompense à venir</em>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <h2 className="titre-m">Gagner des points</h2>
          <ul className="regles">
            {f.regles.map((r) => (
              <li key={r.action}>
                <span>{r.libelle}</span>
                <strong>+{r.points}</strong>
              </li>
            ))}
          </ul>

          {f.historique.length > 0 && (
            <>
              <h2 className="titre-m">Derniers points gagnés</h2>
              <ul className="regles historique">
                {f.historique.slice(0, 10).map((p, i) => (
                  <li key={i}>
                    <span>
                      {libelles[p.action] || p.action}
                      <small>{date(p.created_at)}</small>
                    </span>
                    <strong>+{p.points}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  )
}
