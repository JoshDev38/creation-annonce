# Malow – Créez votre annonce

Application web (pensée pour le mobile) qui transforme la photo d’un objet en annonce prête à publier.

**Parcours :** Accueil → Photos (caméra intégrée, jusqu’à 8 photos, galerie, flash et zoom si le téléphone le permet) → Détail (à l’oral ou à l’écrit) → Analyse → Résultat (prix, titre, description, mots-clés) → Partage (copier, partager avec les photos, sauvegarder).

La caméra intégrée demande l’autorisation d’accès à l’appareil photo et un site en HTTPS. Si elle n’est pas disponible, l’appli ouvre l’appareil photo natif du téléphone.

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

## Appli Android

Le dossier `android/` contient l’appli Android (Capacitor). Dans l’appli installée, la caméra
passe par le module natif (`@capacitor-community/camera-preview`), qui a accès au flash —
ce que le navigateur ne permet pas sur beaucoup de téléphones.

- **Récupérer l’APK sans rien installer** : à chaque envoi sur GitHub, l’onglet *Actions* du dépôt
  construit l’appli (« Appli Android »). Ouvrez la dernière exécution et téléchargez
  `malow-apk`, puis installez `app-debug.apk` sur le téléphone (autorisez les sources inconnues).
- **Avec Android Studio** : `npm run build && npx cap sync android && npx cap open android`.
- Après chaque modification du code web : `npm run build && npx cap sync android`.

L’identifiant de l’appli (`app.malow`) est défini dans `capacitor.config.json` et `android/app/build.gradle` :
une fois l’appli publiée sur le Play Store, il ne peut plus changer.
