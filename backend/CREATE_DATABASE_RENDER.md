# Comment Créer une Base de Données sur Render

## ⚠️ Important : Render et MySQL

**Render propose principalement PostgreSQL**, pas MySQL directement. Vous avez plusieurs options :

## Option 1 : Utiliser PostgreSQL sur Render (Recommandé - Gratuit)

Si vous pouvez migrer vers PostgreSQL, c'est l'option la plus simple et gratuite sur Render.

### Étapes pour créer une base PostgreSQL sur Render :

1. **Connectez-vous à Render**
   - Allez sur [render.com](https://render.com)
   - Connectez-vous à votre compte

2. **Créer une nouvelle base de données**
   - Cliquez sur le bouton **"New +"** en haut à droite
   - Sélectionnez **"PostgreSQL"**

3. **Configurer la base de données**
   - **Name** : `dailyfix-db` (ou le nom de votre choix)
   - **Database** : `dailyfix` (nom de la base de données)
   - **User** : `dailyfix_user` (ou laissez le nom par défaut)
   - **Region** : Choisissez la même région que votre service web (ex: `Oregon`)
   - **PostgreSQL Version** : Laissez la version par défaut (généralement la plus récente)
   - **Plan** : `Free` (pour commencer)

4. **Créer la base de données**
   - Cliquez sur **"Create Database"**
   - Attendez quelques minutes que Render provisionne la base

5. **Récupérer les informations de connexion**
   - Une fois créée, allez dans votre base de données
   - Dans l'onglet **"Info"**, vous verrez :
     - **Internal Database URL** : Pour les services sur Render
     - **External Database URL** : Pour les connexions externes
   
   Les informations seront au format :
   ```
   postgresql://user:password@host:port/database
   ```

6. **Configurer les variables d'environnement**
   - Dans votre service web Render, ajoutez ces variables :
   ```env
   DB_HOST=le-host-de-render
   DB_USER=le-user
   DB_PASSWORD=le-password
   DB_NAME=dailyfix
   DB_PORT=5432
   ```

### ⚠️ Migration de MySQL vers PostgreSQL

Si vous choisissez PostgreSQL, vous devrez :
- Modifier `backend/config/database.js` pour utiliser PostgreSQL
- Adapter les modèles Sequelize si nécessaire
- Tester les requêtes SQL

---

## Option 2 : Utiliser une Base MySQL Externe (Recommandé pour MySQL)

Si vous devez absolument utiliser MySQL, utilisez un service externe :

### A. PlanetScale (Gratuit - Recommandé)

1. **Créer un compte sur PlanetScale**
   - Allez sur [planetscale.com](https://planetscale.com)
   - Créez un compte gratuit

2. **Créer une base de données**
   - Cliquez sur **"Create database"**
   - Choisissez un nom : `dailyfix`
   - Sélectionnez la région la plus proche
   - Cliquez sur **"Create database"**

3. **Récupérer les credentials**
   - Allez dans **"Settings"** > **"Passwords"**
   - Cliquez sur **"New password"**
   - Copiez les informations :
     - **Host**
     - **Username**
     - **Password**
     - **Database name**
     - **Port** (généralement 3306)

4. **Configurer sur Render**
   - Dans votre service web Render, ajoutez :
   ```env
   DB_HOST=votre-host-planetscale
   DB_USER=votre-username
   DB_PASSWORD=votre-password
   DB_NAME=dailyfix
   DB_PORT=3306
   ```

### B. AWS RDS MySQL (Payant mais flexible)

1. Créer une instance RDS MySQL sur AWS
2. Configurer les credentials
3. Ajouter les variables d'environnement sur Render

### C. Railway MySQL (Alternative)

1. Créer un compte sur [railway.app](https://railway.app)
2. Créer une base MySQL
3. Récupérer les credentials
4. Configurer sur Render

---

## Option 3 : Créer une Base MySQL via Docker sur Render (Avancé)

Vous pouvez créer un service privé avec MySQL, mais c'est plus complexe et nécessite un plan payant.

---

## 📋 Checklist : Créer une Base de Données

### Pour PostgreSQL sur Render :
- [ ] Se connecter à Render
- [ ] Cliquer sur "New +" > "PostgreSQL"
- [ ] Configurer le nom, la région, le plan
- [ ] Créer la base de données
- [ ] Noter les credentials (host, user, password, database, port)
- [ ] Ajouter les variables d'environnement dans le service web
- [ ] Modifier `database.js` pour PostgreSQL si nécessaire

### Pour MySQL externe (PlanetScale) :
- [ ] Créer un compte PlanetScale
- [ ] Créer une base de données
- [ ] Générer un mot de passe
- [ ] Noter les credentials
- [ ] Ajouter les variables d'environnement dans le service web Render

---

## 🔧 Configuration des Variables d'Environnement sur Render

Une fois votre base de données créée, dans votre **service web Render** :

1. Allez dans l'onglet **"Environment"**
2. Ajoutez ces variables :

### Pour PostgreSQL :
```env
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_USER=dailyfix_user
DB_PASSWORD=votre-password
DB_NAME=dailyfix
DB_PORT=5432
```

### Pour MySQL (PlanetScale) :
```env
DB_HOST=aws.connect.psdb.cloud
DB_USER=votre-username
DB_PASSWORD=votre-password
DB_NAME=dailyfix
DB_PORT=3306
```

---

## 🚀 Après la Création de la Base

1. **Déployer votre service web** sur Render
2. **Créer les tables** :
   - Allez dans Render > Votre service > **Shell**
   - Exécutez : `npm run create-tables`

---

## 💡 Recommandation

**Pour un projet en développement/test** :
- Utilisez **PlanetScale MySQL** (gratuit, facile, compatible avec votre code actuel)

**Pour un projet en production** :
- Si possible, migrez vers **PostgreSQL sur Render** (gratuit, intégré, performant)
- Sinon, utilisez **PlanetScale** ou **AWS RDS**

---

## 📚 Ressources

- [Documentation Render - Databases](https://render.com/docs/databases)
- [PlanetScale Documentation](https://planetscale.com/docs)
- [Sequelize PostgreSQL Guide](https://sequelize.org/docs/v6/getting-started/)

