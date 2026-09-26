import { IconHeart, IconHome, IconPlus, IconSearch, IconUser } from './Icons.jsx'

const ONGLETS = [
  { id: 'accueil', label: 'Accueil', Icone: IconHome },
  { id: 'annonces', label: 'Mes annonces', Icone: IconSearch },
  { id: 'nouveau', label: 'Nouvelle', Icone: IconPlus, central: true },
  { id: 'conseils', label: 'Conseils', Icone: IconHeart },
  { id: 'profil', label: 'Profil', Icone: IconUser },
]

export default function TabBar({ actif, onChange }) {
  return (
    <nav className="tabbar">
      {ONGLETS.map(({ id, label, Icone, central }) =>
        central ? (
          <button key={id} className="tab-plus" onClick={() => onChange(id)} aria-label="Nouvelle annonce">
            <Icone />
          </button>
        ) : (
          <button
            key={id}
            className={`tab ${actif === id ? 'actif' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icone />
            <span>{label}</span>
          </button>
        ),
      )}
    </nav>
  )
}
