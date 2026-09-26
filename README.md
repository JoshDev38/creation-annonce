# Seconde Vie – Créez votre annonce

Application web (pensée pour le mobile) qui transforme la photo d’un objet en annonce prête à publier.

**Parcours :** Accueil → Photo prise → Détail (à l’oral ou à l’écrit) → Analyse → Résultat (prix, titre, description, mots-clés) → Partage (copier, partager, sauvegarder).

Onglets : Accueil, Mes annonces (sauvegardées sur l’appareil), Nouvelle annonce, Conseils, Profil.

## Lancer l’application

```bash
npm install
npm run dev      # puis ouvrir l’adresse affichée
npm run build    # version de production dans dist/
```

Pour tester sur téléphone : `npm run dev -- --host`, puis ouvrir l’adresse réseau affichée.
La dictée vocale utilise la reconnaissance vocale du navigateur (Chrome, Safari).

## Comment l’annonce est générée

`src/lib/generateur.js` construit le titre, la description, le prix conseillé et les mots-clés
à partir des informations dictées ou écrites (catégorie, taille, marque, état, couleurs, matières…).
Tout se passe dans le navigateur, sans serveur.

Pour une vraie reconnaissance de la photo par une IA, il suffit de remplacer `genererAnnonce`
par un appel à une API (via un petit serveur pour protéger la clé) qui renvoie le même objet :
`{ titre, description, prix: { conseille, rapide, haut }, tags }`.

## Palette

| Bleu pastel | Chocolat au lait | Beige rosé | Crème |
|---|---|---|---|
| `#A8CBE0` | `#7A4532` | `#D9BFAF` | `#FBF6EE` |
