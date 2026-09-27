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

L’analyse est faite par Claude (Anthropic) via la fonction serveur `api/analyser.js`, hébergée sur Vercel :
l’appli envoie les photos (réduites à 1024 px) et les infos dictées ou écrites, Claude renvoie le titre,
la description, les trois prix et les mots-clés.

- **Clé d’API** : créez-la sur https://console.anthropic.com, puis ajoutez-la dans Vercel
  (*Settings → Environment Variables*) sous le nom `ANTHROPIC_API_KEY`, et redéployez.
  Elle reste sur le serveur : elle n’est jamais envoyée au téléphone.
- **Modèle** : `claude-opus-5-5` (Claude Opus 5.5), effort `high`, avec repli automatique
  (`fallbacks: "default"`) si le modèle refuse une demande.
- **Prix** : Claude fait jusqu’à 3 recherches web (≈ 1 centime chacune) pour voir le prix d’articles
  similaires d’occasion, et explique son estimation (`explicationPrix`). Si la recherche échoue,
  l’analyse est relancée sans recherche.
- **Journal** : chaque analyse écrit dans les logs Vercel le modèle réellement utilisé
  (`modele_utilise`), le nombre de recherches et la durée.
- **Secours** : sans clé, sans réseau ou en cas d’erreur, l’appli utilise le générateur local
  `src/lib/generateur.js` (annonce construite à partir des infos du vendeur) et prévient l’utilisateur.

## Palette

| Bleu pastel | Chocolat au lait | Beige rosé | Crème |
|---|---|---|---|
| `#A8CBE0` | `#7A4532` | `#D9BFAF` | `#FBF6EE` |

## Appli Android

Le dossier `android/` contient l’appli Android (Capacitor). Dans l’appli installée, la caméra
passe par le module natif (`@capacitor-community/camera-preview`), qui a accès au flash —
ce que le navigateur ne permet pas sur beaucoup de téléphones.

- **Installer la dernière version** : ouvrez sur le téléphone
  https://github.com/JoshDev38/creation-annonce/releases/download/derniere-version/malow.apk
  (reconstruit à chaque envoi sur GitHub), puis autorisez l’installation d’applis inconnues.
  L’APK est signé avec une clé de test fixe (`android/app/malow-debug.keystore`) : chaque version
  s’installe par-dessus la précédente.
- **Avec Android Studio** : `npm run build && npx cap sync android && npx cap open android`.
- Après chaque modification du code web : `npm run build && npx cap sync android`.

L’identifiant de l’appli (`app.malow`) est défini dans `capacitor.config.json` et `android/app/build.gradle` :
une fois l’appli publiée sur le Play Store, il ne peut plus changer.
