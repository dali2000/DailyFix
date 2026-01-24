# Guide du Dashboard Administrateur

## 📋 Fonctionnalités

Le dashboard admin permet de :
- ✅ Voir les statistiques de l'application
- ✅ Gérer les utilisateurs (créer, modifier, supprimer)
- ✅ Voir les statistiques détaillées par catégorie
- ✅ Rechercher des utilisateurs
- ✅ Gérer les rôles (user/admin)

## 🔐 Créer le Premier Administrateur

### Option 1 : Via Script (Recommandé)

```bash
cd backend
npm run create-admin
```

Ou avec des paramètres personnalisés :
```bash
npm run create-admin admin@example.com motdepasse123 "Nom Admin"
```

### Option 2 : Via Base de Données

1. Connectez-vous à votre base de données
2. Exécutez cette requête SQL :

```sql
UPDATE users SET role = 'admin' WHERE email = 'votre-email@example.com';
```

### Option 3 : Via l'API (après création du premier admin)

1. Connectez-vous en tant qu'admin
2. Allez dans le dashboard admin
3. Créez un nouvel utilisateur avec le rôle "Administrateur"

## 🚀 Accéder au Dashboard Admin

1. Connectez-vous avec un compte admin
2. Allez sur : `https://votre-frontend.com/admin`
3. Ou naviguez depuis l'application

## 📊 Statistiques Disponibles

Le dashboard affiche :
- **Utilisateurs** : Total, nouveaux ce mois/semaine, actifs
- **Tâches** : Total, complétées, en attente, taux de complétion
- **Événements** : Total, à venir
- **Santé** : Repas, activités, enregistrements de sommeil
- **Finance** : Dépenses, budgets, objectifs d'épargne
- **Bien-être** : Entrées de journal, objectifs personnels
- **Social** : Événements sociaux

## 👥 Gestion des Utilisateurs

### Créer un Utilisateur

1. Cliquez sur "Nouvel Utilisateur"
2. Remplissez le formulaire :
   - Nom complet (obligatoire)
   - Email (obligatoire)
   - Mot de passe (optionnel)
   - Rôle (user/admin)
3. Cliquez sur "Créer"

### Modifier un Utilisateur

1. Cliquez sur "Modifier" dans la ligne de l'utilisateur
2. Modifiez les informations
3. Cliquez sur "Enregistrer"

### Supprimer un Utilisateur

1. Cliquez sur "Supprimer" dans la ligne de l'utilisateur
2. Confirmez la suppression

**⚠️ Note** : Un admin ne peut pas supprimer son propre compte.

## 🔍 Recherche

Utilisez la barre de recherche pour trouver des utilisateurs par :
- Nom complet
- Email

## 🔒 Sécurité

- Seuls les utilisateurs avec le rôle `admin` peuvent accéder au dashboard
- Les routes admin sont protégées par authentification
- Un admin ne peut pas supprimer son propre compte
- Un admin ne peut pas retirer ses propres privilèges admin

## 📝 Routes API Admin

Toutes les routes admin sont préfixées par `/api/admin` :

- `GET /api/admin/stats` - Statistiques
- `GET /api/admin/users` - Liste des utilisateurs (avec pagination)
- `GET /api/admin/users/:id` - Détails d'un utilisateur
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur

## 🆘 Dépannage

### Je ne peux pas accéder au dashboard

1. Vérifiez que votre compte a le rôle `admin`
2. Vérifiez que vous êtes connecté
3. Vérifiez les logs du backend pour les erreurs

### Les statistiques ne s'affichent pas

1. Vérifiez que la base de données contient des données
2. Vérifiez les logs du backend
3. Vérifiez la console du navigateur pour les erreurs

### Je ne peux pas créer/modifier un utilisateur

1. Vérifiez que tous les champs obligatoires sont remplis
2. Vérifiez que l'email n'existe pas déjà
3. Vérifiez les logs du backend

## ✅ Checklist de Déploiement

- [ ] Modèle User mis à jour avec le champ `role`
- [ ] Middleware admin créé
- [ ] Routes admin créées
- [ ] Frontend admin créé
- [ ] Route `/admin` ajoutée dans `app.routes.ts`
- [ ] Premier admin créé
- [ ] Testé en local
- [ ] Déployé sur Render

