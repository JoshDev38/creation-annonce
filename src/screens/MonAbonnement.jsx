import { useEffect, useState } from 'react'
import { AppLauncher } from '@capacitor/app-launcher'
import { IconBack, IconCheck } from '../components/Icons.jsx'
import { estAppliNative } from '../lib/cameraNative.js'
import { formule } from '../lib/formules.jsx'
import { lireProfil } from '../lib/profil.js'

// Les abonnements passent par Google Play : la résiliation se fait sur sa page
// « Abonnements », qu'on ouvre directement sur Malow.
const PAGE_ABONNEMENTS_PLAY = 'https://play.google.com/store/account/subscriptions?package=app.malow'

const dateLongue = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function MonAbonnement({ session, onRetour, onOffres }) {
  const [profil, setProfil] = useState(null)
  const [confirmation, setConfirmation] = useState(false)

  useEffect(() => {
    if (!session) return
    lireProfil(session.user.id)
      .then(setProfil)
      .catch(() => setProfil({ formule: 'gratuit', formuleFin: null }))
  }, [session])

  const f = formule(profil?.formule)
  const payant = profil && f.id !== 'gratuit'

  const ouvrirGooglePlay = async () => {
    setConfirmation(false)
    if (estAppliNative()) await AppLauncher.openUrl({ url: PAGE_ABONNEMENTS_PLAY }).catch(() => {})
    else window.open(PAGE_ABONNEMENTS_PLAY, '_blank', 'noopener')
  }

  return (
    <main className="page page-mon-abo">
      <header className="mon-abo-haut">
        <button className="abos-retour" onClick={onRetour} aria-label="Retour">
          <IconBack width={24} height={24} />
        </button>
        <h1>Mon abonnement</h1>
      </header>

      <section className={`mon-abo-carte abo-${f.id}`}>
        <img src={f.ours} alt="" aria-hidden="true" />
        <div className="mon-abo-corps">
          <small>Formule actuelle</small>
          <h2>{profil ? f.nom : '…'}</h2>
          <p className="mon-abo-prix">{f.prix}</p>
          <p className="mon-abo-statut">
            {!profil
              ? ''
              : payant
                ? profil.formuleFin
                  ? `Renouvellement le ${dateLongue(profil.formuleFin)}`
                  : 'Abonnement actif'
                : 'Gratuit et sans engagement'}
          </p>
        </div>
      </section>

      <section className="mon-abo-inclus">
        <h3>Ce qui est inclus</h3>
        <ul>
          {f.avantages
            .filter(([oui]) => oui)
            .map(([, texte], i) => (
              <li key={i}>
                <IconCheck width={16} height={16} />
                <span>{texte}</span>
              </li>
            ))}
        </ul>
      </section>

      <div className="actions">
        <button className="bouton bouton-principal" onClick={onOffres}>
          {payant ? 'Changer de formule' : 'Voir les offres'}
        </button>
        {payant ? (
          <button className="bouton-lien danger" onClick={() => setConfirmation(true)}>
            Me désabonner
          </button>
        ) : (
          <p className="petit centre">
            Vous êtes sur la formule gratuite : il n’y a aucun abonnement à résilier.
          </p>
        )}
      </div>

      {confirmation && (
        <div className="fond-modale" role="dialog" aria-modal="true" aria-labelledby="titre-desabo" onClick={() => setConfirmation(false)}>
          <div className="modale" onClick={(e) => e.stopPropagation()}>
            <h2 id="titre-desabo" className="titre-m">
              Se désabonner ?
            </h2>
            <p>
              Votre abonnement est géré par Google Play : la résiliation se fait sur sa page «&nbsp;Abonnements&nbsp;».
            </p>
            <p className="petit">
              {profil?.formuleFin
                ? `Vous gardez ${f.nom} jusqu’au ${dateLongue(profil.formuleFin)}, puis vous repassez sur Malow Gratuit.`
                : 'Vous gardez votre formule jusqu’à la fin de la période payée, puis vous repassez sur Malow Gratuit.'}
            </p>
            <button className="bouton bouton-principal" onClick={ouvrirGooglePlay}>
              Continuer vers Google Play
            </button>
            <button className="bouton bouton-doux" onClick={() => setConfirmation(false)}>
              Garder mon abonnement
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
