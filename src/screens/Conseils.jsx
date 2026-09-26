const CONSEILS = [
  { titre: 'Soignez la lumière', texte: 'Photographiez près d’une fenêtre, en journée, sans flash. La lumière naturelle rend les couleurs fidèles.' },
  { titre: 'Un fond simple', texte: 'Un drap clair, un mur uni ou un parquet : votre objet doit être la star de la photo.' },
  { titre: 'Montrez les détails', texte: 'Étiquette, marque, matière… et les petits défauts. L’honnêteté rassure et évite les retours.' },
  { titre: 'Le bon prix', texte: 'Le prix « vente rapide » part souvent en quelques jours. Le prix haut demande un peu plus de patience.' },
  { titre: 'Des mots-clés précis', texte: 'Taille, saison, couleur : les acheteurs cherchent avec ces mots. Nos mots-clés sont faits pour ça.' },
  { titre: 'Répondez vite', texte: 'Une réponse dans l’heure multiplie les chances de vendre. Activez les notifications de vos plateformes.' },
]

export default function Conseils() {
  return (
    <main className="page">
      <h1 className="titre-l">Conseils</h1>
      <p className="manuscrit">Les petits objets font les grands changements ♡</p>
      <ul className="liste-conseils">
        {CONSEILS.map((c, i) => (
          <li key={c.titre}>
            <span className="numero">{i + 1}</span>
            <div>
              <strong>{c.titre}</strong>
              <p>{c.texte}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
