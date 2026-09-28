import { useEffect, useState } from 'react'
import mascotte from '../assets/mascotte.png'
import { IconCamera, IconCheck, IconDoc, IconSearch, IconSparkle, IconTag } from '../components/Icons.jsx'

const ETAPES = [
  { Icone: IconCamera, texte: 'J’analyse votre objet…' },
  { Icone: IconSearch, texte: 'Je recherche les informations…' },
  { Icone: IconTag, texte: 'J’estime son prix…' },
  { Icone: IconDoc, texte: 'Je prépare votre annonce…' },
]

const DUREE_ETAPE = 1200

// Les premières étapes avancent seules ; la dernière attend que l'annonce soit prête.
export default function Analyse({ pret, onFini }) {
  const [faites, setFaites] = useState(0)

  useEffect(() => {
    if (faites < ETAPES.length - 1 || (faites === ETAPES.length - 1 && pret)) {
      const t = setTimeout(() => setFaites((n) => n + 1), faites === ETAPES.length - 1 ? 300 : DUREE_ETAPE)
      return () => clearTimeout(t)
    }
    if (faites < ETAPES.length) return
    const t = setTimeout(onFini, 400)
    return () => clearTimeout(t)
  }, [faites, pret, onFini])

  return (
    <main className="page page-analyse">
      <h1 className="titre-l centre">On s’occupe de tout !</h1>
      <p className="texte-bleu centre">
        Notre intelligence artificielle analyse
        <br />
        votre photo et vos informations.
      </p>

      <ul className="etapes">
        {ETAPES.map(({ Icone, texte }, i) => (
          <li key={texte} className={i < faites ? 'faite' : i === faites ? 'en-cours' : ''}>
            <span className="rond-icone petit">
              <Icone width={22} height={22} />
            </span>
            <span className="etape-texte">{texte}</span>
            <span className="etat-etape">{i < faites && <IconCheck width={16} height={16} />}</span>
          </li>
        ))}
      </ul>

      <div className="zone-mascotte">
        {/* Malow est accoudé à l'encadré */}
        <img className="mascotte-analyse" src={mascotte} alt="" aria-hidden="true" />
        <div className="encart-info">
          <IconSparkle width={34} height={34} />
          <p>Cela ne prend que quelques secondes…</p>
        </div>
      </div>
    </main>
  )
}
