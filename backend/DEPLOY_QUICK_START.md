# Déploiement Rapide sur Render - Checklist

## ✅ Étapes Rapides

### 1. Préparer la Base de Données
- [ ] **Option A (Recommandé)** : Créer une base MySQL sur PlanetScale (gratuit)
  - Aller sur [planetscale.com](https://planetscale.com)
  - Créer un compte et une base de données
  - Générer un mot de passe et noter les credentials
- [ ] **Option B** : Créer une base PostgreSQL sur Render (gratuit, nécessite migration)
  - Dans Render : "New +" > "PostgreSQL"
  - Configurer et noter les credentials
- [ ] Noter les credentials : `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- [ ] 📖 Voir `CREATE_DATABASE_RENDER.md` pour le guide détaillé

### 2. Créer le Service sur Render
- [ ] Aller sur [render.com](https://render.com) et créer un compte
- [ ] Cliquer sur "New +" > "Web Service"
- [ ] Connecter votre repository GitHub/GitLab
- [ ] Configurer :
  - **Name** : `dailyfix-backend`
  - **Root Directory** : `backend` ⚠️ IMPORTANT
  - **Environment** : `Node`
  - **Build Command** : `npm install`
  - **Start Command** : `npm start`

### 3. Configurer les Variables d'Environnement
Dans Render > Environment, ajouter :

```env
NODE_ENV=production
DB_HOST=votre-host
DB_USER=votre-user
DB_PASSWORD=votre-password
DB_NAME=dailyfix
DB_PORT=3306
JWT_SECRET=[générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
JWT_EXPIRE=7d
FRONTEND_URL=https://votre-frontend-url.com
GOOGLE_CLIENT_ID=votre-id (optionnel)
GOOGLE_CLIENT_SECRET=votre-secret (optionnel)
```

### 4. Initialiser la Base de Données
- [ ] Après le premier déploiement, aller dans Render > Shell
- [ ] Exécuter : `npm run create-tables`

### 5. Tester
- [ ] Vérifier : `https://votre-service.onrender.com/api/health`
- [ ] Devrait retourner : `{"status":"OK","message":"DailyFix API is running"}`

## 🔗 URLs Importantes

- **API Backend** : `https://dailyfix-backend.onrender.com`
- **Health Check** : `https://dailyfix-backend.onrender.com/api/health`
- **Root** : `https://dailyfix-backend.onrender.com/`

## ⚠️ Points d'Attention

1. **Root Directory** : Si votre repo contient frontend + backend, définir `backend` comme root directory
2. **CORS** : `FRONTEND_URL` doit correspondre EXACTEMENT à l'URL de votre frontend
3. **Base de données** : Les tables doivent être créées manuellement après le premier déploiement
4. **Plan gratuit** : Le service se met en veille après 15 min d'inactivité (première requête sera lente)

## 📚 Documentation Complète

Voir `RENDER_DEPLOYMENT.md` pour plus de détails.

