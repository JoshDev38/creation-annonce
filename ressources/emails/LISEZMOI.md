# E-mails Nalow (Supabase)

À coller dans Supabase : *Authentication → Emails → Templates*.

| Modèle Supabase | Objet (Subject) | Fichier |
|---|---|---|
| Confirm signup | Confirmez votre compte Nalow | `confirmation.html` |
| Reset password | Votre nouveau mot de passe Nalow | `mot-de-passe.html` |
| Change email address | Confirmez votre nouvelle adresse Nalow | `changement-email.html` |

Pour chaque modèle : remplacer l’objet, puis coller tout le contenu du fichier dans *Message body* et enregistrer.
Le lien `{{ .ConfirmationURL }}` est rempli automatiquement par Supabase.

Pour que les e-mails partent de `bonjour@malow.app` (et non de Supabase), configurer un envoi SMTP
(par exemple Resend) dans *Authentication → Emails → SMTP Settings*.
