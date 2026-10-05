import { useEffect, useRef, useState } from 'react'
import { IconBack, IconBulb, IconCheck } from '../components/Icons.jsx'
import { FORMULES } from '../lib/formules.jsx'
import { lireProfil } from '../lib/profil.js'

// Choix de l'abonnement : les 3 cartes défilent de côté (une par écran).
export default function Abonnements({ session, onRetour, notifier }) {
  const defilement = useRef(null)
  const [visible, setVisible] = useState(0)
  const [formuleActuelle, setFormuleActuelle] = useState('gratuit') // formule par défaut

  useEffect(() => {
    if (!session) return
    lireProfil(session.user.id)
      .then((p) => setFormuleActuelle(p.formule))
      .catch(() => {})
  }, [session])

  // Arrivée sur la formule actuelle ; points sous les cartes mis à jour au défilement.
  useEffect(() => {
    const zone = defilement.current
    const i = Math.max(0, FORMULES.findIndex((f) => f.id === formuleActuelle))
    zone?.children[i]?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [formuleActuelle])

  const auDefilement = () => {
    const zone = defilement.current
    if (!zone) return
    const largeur = zone.children[0]?.offsetWidth || 1
    setVisible(Math.round(zone.scrollLeft / (largeur + 14)))
  }

  const aller = (i) => defilement.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })

  const choisir = (f) => {
    if (f.id === formuleActuelle) return
    notifier('Le paiement arrivera avec la sortie de Malow sur le Play Store. Merci de votre patience !')
  }

  return (
    <main className="page page-abonnements">
      <header className="abos-haut">
        <button className="abos-retour" onClick={onRetour} aria-label="Retour">
          <IconBack width={24} height={24} />
        </button>
        <h1>Abonnements</h1>
        <p>Choisissez l’offre qui vous correspond et vendez plus facilement avec Malow !</p>
      </header>

      <div className="abos-cartes" ref={defilement} onScroll={auDefilement}>
        {FORMULES.map((f) => {
          const actuelle = f.id === formuleActuelle
          return (
            <article key={f.id} className={`abo abo-${f.id} ${actuelle ? 'actuelle' : ''}`}>
              {f.economie && (
                <span className="abo-economie">
                  {f.economie}
                  <small>d’économie</small>
                </span>
              )}
              <img className="abo-ours" src={f.ours} alt="" aria-hidden="true" />
              <div className="abo-corps">
                <h2>{f.nom}</h2>
                {actuelle && <span className="abo-actuelle">Votre formule actuelle</span>}
                {f.cadeau ? (
                  <p className="abo-cadeau">
                    <span aria-hidden="true">🎁</span>
                    {f.cadeau}
                  </p>
                ) : (
                  <>
                    <p className="abo-prix">{f.prix}</p>
                    {f.soit && <p className="abo-soit">{f.soit}</p>}
                    <p className="abo-accroche">{f.accroche}</p>
                  </>
                )}
                <ul className="abo-avantages">
                  {f.avantages.map(([oui, texte], i) => (
                    <li key={i} className={oui ? 'oui' : 'non'}>
                      <span className="abo-puce" aria-label={oui ? 'Inclus' : 'Non inclus'}>
                        {oui ? <IconCheck width={16} height={16} /> : '✕'}
                      </span>
                      <span>{texte}</span>
                    </li>
                  ))}
                </ul>
                {f.bouton && (
                  <button className="abo-bouton" onClick={() => choisir(f)} disabled={actuelle}>
                    {actuelle ? 'Votre formule actuelle' : `${f.bouton} ›`}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="abos-points" role="tablist" aria-label="Formules">
        {FORMULES.map((f, i) => (
          <button
            key={f.id}
            className={i === visible ? 'actif' : ''}
            onClick={() => aller(i)}
            aria-label={f.nom}
            aria-selected={i === visible}
            role="tab"
          />
        ))}
      </div>

      <section className="abos-bon-a-savoir">
        <span className="abos-ampoule">
          <IconBulb width={20} height={20} />
        </span>
        <div>
          <strong>Bon à savoir !</strong>
          <ul>
            <li>Les 2 annonces Premium offertes le sont une seule fois, à l’inscription.</li>
            <li>Changez de formule à tout moment depuis votre compte.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
