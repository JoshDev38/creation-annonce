import { IconBulb, IconHome, IconHomeFilled, IconPlus, IconSearch, IconUser, IconUserFilled } from './Icons.jsx'

const ONGLETS = [
  { id: 'accueil', label: 'Accueil', Icone: IconHome, IconeActive: IconHomeFilled },
  { id: 'annonces', label: 'Mes annonces', Icone: IconSearch },
  { id: 'nouveau', label: 'Nouvelle', Icone: IconPlus, central: true },
  { id: 'conseils', label: 'Aide', Icone: IconBulb },
  { id: 'profil', label: 'Profil', Icone: IconUser, IconeActive: IconUserFilled },
]

export default function TabBar({ actif, onChange }) {
  return (
    <nav className="tabbar">
      {ONGLETS.map(({ id, label, Icone, IconeActive, central }) => {
        if (central) {
          return (
            <button key={id} className="tab-plus" onClick={() => onChange(id)} aria-label="Nouvelle annonce">
              <Icone />
            </button>
          )
        }
        const estActif = actif === id
        const Affichee = estActif && IconeActive ? IconeActive : Icone
        return (
          <button key={id} className={`tab ${estActif ? 'actif' : ''}`} onClick={() => onChange(id)}>
            <Affichee />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
