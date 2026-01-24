# Guide de Déploiement sur Render

Ce guide vous explique comment déployer le backend DailyFix sur Render.

## Prérequis

1. Un compte Render (gratuit disponible sur [render.com](https://render.com))
2. Une base de données MySQL (Render propose PostgreSQL par défaut, mais vous pouvez utiliser une base MySQL externe ou créer une instance MySQL sur Render)
3. Les variables d'environnement nécessaires

## Étapes de Déploiement

### 1. Préparer votre Base de Données

> ⚠️ **Important** : Render propose principalement PostgreSQL, pas MySQL directement. Voir le guide détaillé dans `CREATE_DATABASE_RENDER.md` pour toutes les options.

#### Option A : Utiliser PostgreSQL sur Render (Gratuit - Recommandé si migration possible)
- Cliquez sur "New +" > "PostgreSQL" dans Render
- Configurez la base (nom, région, plan gratuit)
- Récupérez les credentials dans l'onglet "Info"
- ⚠️ Nécessite de modifier `database.js` pour PostgreSQL

#### Option B : Utiliser une base MySQL externe (Recommandé pour MySQL)
- **PlanetScale** (gratuit) : [planetscale.com](https://planetscale.com) - Créez une base MySQL gratuite
- **AWS RDS** : Instance MySQL payante mais flexible
- **Railway** : Alternative avec MySQL
- Notez les informations de connexion (host, user, password, database, port)

#### Option C : Créer une base MySQL via Docker sur Render (Avancé)
- Nécessite un plan payant et configuration Docker
- Voir `CREATE_DATABASE_RENDER.md` pour plus de détails

### 2. Créer un Nouveau Service Web sur Render

1. Connectez-vous à votre compte Render
2. Cliquez sur "New +" puis sélectionnez "Web Service"
3. Connectez votre repository GitHub/GitLab/Bitbucket
4. Configurez le service :
   - **Name**: `dailyfix-backend` (ou le nom de votre choix)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend` (important si votre repo contient frontend et backend)

### 3. Configurer les Variables d'Environnement

Dans la section "Environment" de votre service Render, ajoutez les variables suivantes :

#### Variables Requises

```env
# Server Configuration
NODE_ENV=production
PORT=10000
# Note: Render définit automatiquement PORT, mais vous pouvez le laisser à 10000

# MySQL Configuration
DB_HOST=votre-host-mysql
DB_USER=votre-utilisateur-mysql
DB_PASSWORD=votre-mot-de-passe-mysql
DB_NAME=dailyfix
DB_PORT=3306

# JWT Configuration
JWT_SECRET=votre-secret-jwt-tres-securise-changez-moi
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=https://votre-frontend-url.com
# Exemple: https://dailyfix-frontend.onrender.com

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
```

#### Générer un JWT_SECRET sécurisé

Vous pouvez générer un secret sécurisé avec cette commande :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialiser la Base de Données

**✅ Les tables sont créées automatiquement au démarrage du serveur !**

Le code a été configuré pour créer automatiquement les tables si elles n'existent pas. Vous n'avez **rien à faire** - les tables seront créées lors du premier démarrage du serveur.

**Note :** Si vous avez accès au Shell Render (plan payant), vous pouvez aussi créer les tables manuellement avec `npm run create-tables`, mais ce n'est pas nécessaire.

Voir `DEPLOY_SANS_SHELL.md` pour plus de détails sur le déploiement sans accès Shell.

### 5. Vérifier le Déploiement

1. Une fois déployé, votre API sera accessible à : `https://dailyfix-backend.onrender.com`
2. Testez l'endpoint de santé : `https://dailyfix-backend.onrender.com/api/health`
3. Vous devriez recevoir : `{"status":"OK","message":"DailyFix API is running"}`

## Configuration CORS

Assurez-vous que `FRONTEND_URL` correspond exactement à l'URL de votre frontend déployé. Le backend autorise uniquement les requêtes provenant de cette URL en production.

## Mise à Jour du Frontend

Après le déploiement, mettez à jour l'URL de l'API dans votre frontend :

1. Modifiez `src/environments/environment.prod.ts`
2. Changez l'URL de l'API pour pointer vers votre backend Render :
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://dailyfix-backend.onrender.com/api'
   };
   ```

## Dépannage

### Le service ne démarre pas
- Vérifiez les logs dans l'onglet "Logs" de Render
- Assurez-vous que toutes les variables d'environnement sont définies
- Vérifiez que la connexion à la base de données fonctionne

### Erreur de connexion à la base de données
- Vérifiez que votre base MySQL accepte les connexions externes
- Vérifiez que l'IP de Render est autorisée (si nécessaire)
- Vérifiez les credentials dans les variables d'environnement

### Erreur CORS
- Vérifiez que `FRONTEND_URL` correspond exactement à l'URL de votre frontend
- Assurez-vous que l'URL inclut le protocole (https://)

### Tables manquantes
- Exécutez `npm run create-tables` via le Shell Render
- Vérifiez les logs pour voir s'il y a des erreurs

## Commandes Utiles

- **Voir les logs** : Dashboard Render > Votre service > Logs
- **Redémarrer le service** : Dashboard Render > Votre service > Manual Deploy > Clear build cache & deploy
- **Accéder au shell** : Dashboard Render > Votre service > Shell

## Coûts

- Le plan gratuit de Render permet :
  - Services web qui se mettent en veille après 15 minutes d'inactivité
  - Base de données gratuite (PostgreSQL) - mais vous utilisez MySQL
  - 750 heures de runtime par mois

Pour un service qui reste toujours actif, vous devrez passer au plan payant.

## Support

Pour plus d'aide, consultez :
- [Documentation Render](https://render.com/docs)
- Les logs de votre service dans le dashboard Render

