# Nalow : feuille de route et décisions

Dernière mise à jour : 4 octobre 2026. Ce fichier garde en mémoire ce qui a été décidé et ce qui reste à faire.

## Nom de l'appli : Nalow (choisi le 10 octobre 2026)

L'ancien nom « Malow » est une marque de l'Union européenne déjà enregistrée en classes 9, 35 et 42 (logiciels) par MALOW Sp. z o.o. (fabricant polonais de mobilier). Josh a choisi **Nalow**, en connaissant le risque de ressemblance restant (une seule lettre de différence).

- [x] Textes de l'appli, du site et de l'APK passés à « Nalow » (offres « Nalow Gratuit » et « Nalow+ »)
- [x] nalow.app acheté et branché (Cloudflare → Vercel) ; appli, serveur IA et liens des e-mails sur nalow.app ; malow.app redirige vers nalow.app
- [ ] Supabase → Authentication → URL Configuration : Site URL https://nalow.app, Redirect URLs https://nalow.app et app.nalow://auth (Josh)
- [x] Adresse contact@nalow.app (Cloudflare Email Routing vers le Gmail de Josh), utilisée dans l'appli et le site
- [x] E-mails de compte envoyés par Resend depuis bonjour@nalow.app (DKIM vérifié, DMARC géré par Cloudflare en p=none ; passer en quarantine après quelques semaines sans échec)
- [ ] malow.app gardé jusqu'à son échéance (redirection vers nalow.app via vercel.json) : désactiver le renouvellement automatique dans Cloudflare ; à l'échéance, retirer malow.app de Vercel et la redirection de vercel.json
- [ ] Nettoyage : domaine malow.app et ancienne clé API dans Resend ; enregistrements Resend de malow.app dans Cloudflare ; https://malow.app/** et app.malow://auth dans les Redirect URLs Supabase (après désinstallation de l'ancienne appli)
- [ ] nalow.fr (libre le 10 octobre 2026) : à acheter pour protéger le nom
- [x] Nouveau logo « Nalow » (icônes, écran d'ouverture) et oursons d'abonnement « NALOW+ »
- [x] Identifiant Android `app.malow` → `app.nalow` ; APK : .../releases/download/derniere-version/nalow.apk
- [ ] Recherche INPI / EUIPO « Nalow », puis dépôt de la marque (classes 9, 42, 35)

## Offres (plaquette « Mes abonnements »)

| Offre | Prix | Contenu |
|---|---|---|
| Nalow Gratuit | 0 € | 5 annonces / mois, analyse standard (sans estimation de prix ni recherche du marché), 1 pub par annonce |
| Nalow+ Mensuel | 5,99 € / mois | 15 annonces / mois, analyse avancée, estimation du prix, recherche du marché, sans pub |
| Nalow+ Annuel | 54,99 € / an (4,58 € / mois, −23 %) | Comme le mensuel |

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

## Avant le lancement (liste complète, mise à jour le 8 octobre 2026)

Déjà fait : écran Abonnements et rubrique d'aide, « Mon compte » (profil, niveau, abonnement, paramètres), lien de désabonnement vers Google Play, suppression du compte avec confirmation, IA réservée à l'appli (serveur), site malow.app fermé au public (page « bientôt », confirmation d'e-mail, nouveau mot de passe et confidentialité gardés).

### 1. Dans l'appli (Claude)
- [ ] Optimisation des coûts IA : Premium 2 recherches (≈ 0,12 €), Gratuit sans recherche ni prix sur un modèle économique (≈ 0,03 €)
- [ ] Quotas côté serveur : 5 / mois en gratuit, 15 / mois en Malow+, 2 Premium offertes à l'inscription, compteur visible dans l'appli
- [ ] Google Play Billing + RevenueCat : boutons « Choisir », formule mise à jour par le serveur, désabonnement
- [ ] Pub AdMob (1 par annonce en gratuit) avec consentement RGPD
- [ ] Play Integrity : l'IA ne répond qu'à l'appli officielle
- [ ] Récompenses de fidélité (à choisir dans les propositions)
- [ ] Suivi des plantages (Sentry)
- [ ] Page web de demande de suppression de compte (exigée par Google, à garder ouverte sur malow.app)
- [ ] Aide : ourson de la rubrique « Mon compte » (en attente de la maquette)
- [ ] Décider du lien « Découvrir sans compte » (garder ou retirer)

### 2. Comptes et réglages (Josh)
- [ ] Plafond de dépense mensuel et alerte dans la console Anthropic
- [ ] Double authentification sur GitHub, Vercel, Supabase, Anthropic, Google, Cloudflare
- [ ] Supabase → Authentication : protection contre les mots de passe piratés
- [ ] Micro-entreprise / SIRET, compte marchand Google Payments, compte AdMob, compte RevenueCat
- [ ] Recherche INPI sur « Malow » (et dépôt de la marque si libre)

### 3. Hébergement et sécurité (ensemble)
- [ ] Migration : site sur Cloudflare Pages, fonction IA sur Supabase Edge Functions, photos sur Cloudflare R2
- [ ] Sauvegarde de la base chaque nuit (GitHub Actions)
- [ ] Clé de signature de production (la clé de test actuelle est publique dans le dépôt)

### 4. Juridique (Claude rédige, Josh valide)
- [ ] Mentions légales, CGU / conditions de vente des abonnements
- [ ] Politique de confidentialité complète : bulle, micro, photos dans la galerie, fidélité, Anthropic, Google, AdMob, RevenueCat

### 5. Google Play
- [ ] Compte développeur (25 $, vérification d'identité)
- [ ] Fiche Store : icône, captures d'écran, bannière, textes
- [ ] Déclarations : bulle (SYSTEM_ALERT_WINDOW, avec vidéo), service « specialUse », micro, caméra, formulaire Sécurité des données, classification du contenu
- [ ] Test fermé : 12 testeurs pendant 14 jours d'affilée, obligatoire pour un nouveau compte personnel
- [ ] Demande d'accès en production, puis publication
- [ ] Rouvrir malow.app en vitrine (lien Google Play)
