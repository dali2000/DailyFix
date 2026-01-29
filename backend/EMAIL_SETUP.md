# Configuration de l’envoi d’emails (mot de passe oublié)

Sans SMTP configuré, le backend **n’envoie pas d’email** : le lien de réinitialisation est seulement affiché dans les logs du serveur (invisible sur Render).

Pour que les utilisateurs reçoivent l’email « Mot de passe oublié », configurez les variables d’environnement suivantes sur **Render** (Dashboard → votre service → Environment). Voir `env.example` pour la liste des variables SMTP SendGrid.

---

## Option 1 : Gmail

1. Activer la **validation en 2 étapes** sur le compte Google.
2. Créer un **mot de passe d’application** :  
   [Compte Google → Sécurité → Mots de passe des applications](https://myaccount.google.com/apppasswords)  
   Choisir « Courrier » et « Autre », puis copier le mot de passe généré (16 caractères).
3. Sur Render, ajouter :

| Variable       | Valeur                |
|----------------|------------------------|
| `SMTP_HOST`    | `smtp.gmail.com`       |
| `SMTP_PORT`    | `587`                  |
| `SMTP_SECURE`  | `false`                |
| `SMTP_USER`    | `votre@gmail.com`      |
| `SMTP_PASS`    | *mot de passe d’application (16 caractères)* |
| `SMTP_FROM`    | `votre@gmail.com` (optionnel) |
| `FRONTEND_URL` | `https://votre-front.com` (URL du lien dans l’email) |

4. Redéployer le service pour prendre en compte les variables.

---

## Option 2 : SendGrid (gratuit jusqu’à 100 emails/jour)

1. Créer un compte sur [SendGrid](https://sendgrid.com).
2. Créer une **clé API** (Settings → API Keys).
3. Sur Render :

| Variable       | Valeur                    |
|----------------|----------------------------|
| `SMTP_HOST`    | `smtp.sendgrid.net`        |
| `SMTP_PORT`    | `587`                      |
| `SMTP_USER`    | `apikey`                   |
| `SMTP_PASS`    | *votre clé API SendGrid*   |
| `SMTP_FROM`    | email vérifié dans SendGrid |
| `FRONTEND_URL` | URL de votre front         |

---

## Vérification

- **FRONTEND_URL** : doit être l’URL de votre app (ex. `https://dali2000.github.io/DailyFix` ou votre domaine). C’est elle qui est utilisée pour le lien « Réinitialiser mon mot de passe » dans l’email.
- Après modification des variables sur Render, un **redéploiement** est nécessaire.
