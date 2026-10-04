# Malow : feuille de route et décisions

Dernière mise à jour : 4 octobre 2026. Ce fichier garde en mémoire ce qui a été décidé et ce qui reste à faire.

## Offres (plaquette « Mes abonnements »)

| Offre | Prix | Contenu |
|---|---|---|
| Malow Gratuit | 0 € | 5 annonces / mois, analyse standard (sans estimation de prix ni recherche du marché), 1 pub par annonce |
| Malow+ Mensuel | 5,99 € / mois | 15 annonces / mois, analyse avancée, estimation du prix, recherche du marché, sans pub |
| Malow+ Annuel | 54,99 € / an (4,58 € / mois, −23 %) | Comme le mensuel |

- Plafond Premium retenu : **15 annonces par mois** (mensuel et annuel).
- Conseil : mettre les « 2 annonces Premium offertes à l'inscription » sur la carte **Gratuit** plutôt que sur les cartes payantes.

## Coûts de l'IA

- Mesuré sur les tests (27-30 sept., export console Anthropic) : **2,79 $** au total, environ **0,19 € par annonce** (Opus 5.5, jusqu'à 3 recherches web).
  - 70 % du coût = texte envoyé à l'IA (surtout les pages web lues), 17 % = texte généré, 12 % = recherches web.
- **Objectifs** :
  - annonce Premium à **0,12 €** : 2 recherches web maximum, moins de texte lu par recherche ;
  - annonce Gratuite à **0,03 €** : modèle économique (Sonnet 5.5), sans recherche web ni estimation de prix.
- Le coût réel de chaque analyse est enregistré dans Supabase : table `couts_analyses`, synthèse par jour dans la vue `couts_par_jour`.

## Rentabilité (après TVA 20 %, commission Google 15 %, cotisations micro-entreprise ≈ 22 %)

| Par utilisateur et par mois | Usage moyen | Usage maximum |
|---|---|---|
| Gratuit (3 ou 5 annonces, pub déduite) | −0,04 € | −0,07 € |
| Mensuel (10 ou 15 annonces) | +2,11 € | +1,51 € |
| Annuel (10 ou 15 annonces) | +1,33 € | +0,73 € |

- Exemple à 1 000 utilisateurs (800 gratuits, 150 mensuels, 50 annuels, 100 nouveaux inscrits) : bénéfice ≈ **281 € / mois** en usage moyen, ≈ **138 €** en usage maximum, avec 43 € de frais fixes.
- Sans Vercel Pro ni Supabase Pro (voir plus bas) : ≈ **323 € / mois** en usage moyen.
- Chiffres fiscaux à faire valider par un comptable ou l'URSSAF.

## Hébergement : à faire plus tard

L'offre gratuite de **Vercel interdit l'usage commercial**. Plan retenu pour ramener les frais fixes d'environ 43 € à environ 1 € par mois :

1. **Quitter Vercel** : le site passe sur Cloudflare Pages (gratuit, domaine déjà chez Cloudflare) et la fonction d'analyse IA sur Supabase Edge Functions (gratuit, 150 s maximum). Environ 1 à 2 h de travail.
2. **Rester sur Supabase gratuit** (usage commercial autorisé). Ses limites :
   - **1 Go de fichiers** → déplacer les photos vers **Cloudflare R2** (10 Go gratuits) ;
   - **pas de sauvegardes automatiques** → sauvegarde de la base chaque nuit via GitHub Actions (le mot de passe de la base est à ajouter par Josh dans les secrets GitHub).
3. Passer Supabase en Pro (≈ 23 € / mois) seulement au-delà d'environ 50 000 utilisateurs actifs, ou pour des sauvegardes gérées.

## Avant le lancement (liste complète)

- [ ] Optimisation des coûts IA : Premium 2 recherches, analyse Gratuite économique
- [ ] Quotas côté serveur : 5 / mois en gratuit, 15 / mois en Premium, 2 Premium offertes à l'inscription
- [ ] Plafond de dépense mensuel et alerte dans la console Anthropic (à faire par Josh)
- [ ] Pub AdMob avec consentement RGPD (compte AdMob : Josh)
- [x] Écran « Abonnements » (3 formules, Gratuit par défaut) ; colonne `formule` dans `profils`, modifiable seulement par le serveur
- [ ] Abonnements via Google Play Billing + RevenueCat (compte marchand et SIRET : Josh) : les boutons « Choisir » affichent pour l’instant « bientôt disponible »
- [ ] Migration de l'hébergement (voir plus haut)
- [ ] Clé de signature de production pour le Play Store (la clé de test actuelle est publique dans le dépôt)
- [ ] Protection contre les mots de passe piratés : Supabase → Authentication (case à cocher, Josh)
- [ ] Double authentification sur GitHub, Vercel, Supabase, Anthropic, Google, Cloudflare
- [ ] Juridique : mentions légales, CGU, politique de confidentialité à compléter (bulle, micro, photos dans la galerie, fidélité, Anthropic, Google), recherche INPI sur « Malow »
- [ ] Play Store : compte développeur (25 $), **test fermé avec 12 testeurs pendant 14 jours**, déclarations (bulle SYSTEM_ALERT_WINDOW avec vidéo, service « specialUse », micro, caméra), formulaire Sécurité des données, page web de suppression de compte, fiche Store (visuels et textes)
- [ ] Suivi des plantages (Sentry)
- [ ] Récompenses de fidélité à définir (tables `fidelite_*` dans Supabase)
- [ ] Aide : ourson de la rubrique « Mon compte » (en attente de la maquette)
- [ ] Décider du lien « Découvrir sans compte » (garder ou retirer)
