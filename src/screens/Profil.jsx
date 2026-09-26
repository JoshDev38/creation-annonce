import { lireAnnonces } from '../lib/stockage.js'

export default function Profil() {
  const annonces = lireAnnonces()
  const total = annonces.reduce((s, a) => s + (a.prix?.conseille || 0), 0)

  return (
    <main className="page">
      <h1 className="titre-l">Mon espace</h1>
      <div className="stats">
        <div>
          <strong>{annonces.length}</strong>
          <span>annonce{annonces.length > 1 ? 's' : ''} créée{annonces.length > 1 ? 's' : ''}</span>
        </div>
        <div>
          <strong>{total} €</strong>
          <span>de valeur estimée</span>
        </div>
      </div>
      <p className="manuscrit centre">
        Une seconde vie
        <br />
        pour de belles histoires ♡
      </p>
      <p className="petit centre">
        Vos annonces sont enregistrées uniquement sur cet appareil.
      </p>
    </main>
  )
}
