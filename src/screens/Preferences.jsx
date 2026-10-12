import { useEffect, useState } from 'react'
import { IconBack, IconCheck } from '../components/Icons.jsx'
import { PLATEFORMES } from '../lib/partage.js'
import { LIVRAISONS, MAX_PHRASE_FIN, normaliserPreferences } from '../lib/preferences.js'
import { enregistrerPreferences, lirePreferences } from '../lib/profil.js'

// « Mes préférences de vente » : ajoutées automatiquement à chaque annonce générée
// (rubrique Livraison, mentions du foyer, phrase de fin) ; les plateformes choisies
// passent en premier dans « Où publier ? ».
export default function Preferences({ session, onRetour, notifier }) {
  const [prefs, setPrefs] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!session) return
    lirePreferences(session.user.id)
      .then(setPrefs)
      .catch(() => setPrefs(normaliserPreferences()))
  }, [session])

  if (!session || !prefs) return <main className="page" />

  const basculer = (champ, cle) =>
    setPrefs((p) => ({ ...p, [champ]: p[champ].includes(cle) ? p[champ].filter((c) => c !== cle) : [...p[champ], cle] }))

  const enregistrer = async () => {
    setEnvoi(true)
    try {
      await enregistrerPreferences(session.user.id, prefs)
      notifier('Préférences enregistrées')
      onRetour()
    } catch (e) {
      console.error(e)
      notifier('Enregistrement impossible')
    } finally {
      setEnvoi(false)
    }
  }

  const Case = ({ champ, children }) => (
    <button className={`case-pref ${prefs[champ] ? 'on' : ''}`} onClick={() => setPrefs((p) => ({ ...p, [champ]: !p[champ] }))}>
      <span>{prefs[champ] && <IconCheck width={14} height={14} />}</span>
      {children}
    </button>
  )

  return (
    <main className="page page-sous-compte page-prefs">
      <header className="sous-compte-haut">
        <button className="lien-retour abos-retour" onClick={onRetour}>
          <IconBack width={20} height={20} /> Retour
        </button>
        <h1>Mes préférences de vente</h1>
        <p className="prefs-intro">Nalow les ajoute automatiquement à chacune de vos annonces.</p>
      </header>

      <section className="bloc-pref">
        <h2>📦 Livraison</h2>
        <div className="puces-pref">
          {LIVRAISONS.map(({ cle, libelle }) => (
            <button key={cle} className={prefs.livraison.includes(cle) ? 'on' : ''} onClick={() => basculer('livraison', cle)}>
              {libelle}
            </button>
          ))}
        </div>
        {prefs.livraison.includes('main') && (
          <label className="champ-pref">
            Ville pour la remise en main propre
            <input
              value={prefs.ville}
              maxLength={60}
              placeholder="Ex. : Grenoble"
              onChange={(e) => setPrefs((p) => ({ ...p, ville: e.target.value }))}
            />
          </label>
        )}
      </section>

      <section className="bloc-pref">
        <h2>🏠 Mon foyer</h2>
        <Case champ="non_fumeur">Maison non-fumeur</Case>
        <Case champ="sans_animaux">Sans animaux</Case>
      </section>

      <section className="bloc-pref">
        <h2>✍️ Ma phrase de fin</h2>
        <textarea
          className="texte-pref"
          rows={3}
          maxLength={MAX_PHRASE_FIN}
          value={prefs.phrase_fin}
          placeholder="Ex. : Je fais des lots, n'hésitez pas à regarder mes autres articles !"
          onChange={(e) => setPrefs((p) => ({ ...p, phrase_fin: e.target.value }))}
        />
      </section>

      <section className="bloc-pref">
        <h2>🛍️ Mes plateformes</h2>
        <div className="puces-pref">
          {Object.entries(PLATEFORMES).map(([cle, { nom }]) => (
            <button key={cle} className={prefs.plateformes.includes(cle) ? 'on' : ''} onClick={() => basculer('plateformes', cle)}>
              {nom}
            </button>
          ))}
        </div>
        <small className="aide-pref">Elles apparaîtront en premier dans « Où publier ? ».</small>
      </section>

      <button className="bouton bouton-principal" onClick={enregistrer} disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </main>
  )
}
