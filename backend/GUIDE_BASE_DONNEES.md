# Guide Visuel : Créer une Base de Données pour Render

## 🎯 Solution la Plus Simple : PlanetScale (MySQL Gratuit)

### Étape 1 : Créer un Compte PlanetScale

1. Allez sur **https://planetscale.com**
2. Cliquez sur **"Sign up"** (gratuit)
3. Connectez-vous avec GitHub (recommandé) ou créez un compte email

### Étape 2 : Créer une Base de Données

1. Une fois connecté, cliquez sur **"Create database"**
2. Remplissez le formulaire :
   - **Database name** : `dailyfix`
   - **Region** : Choisissez la région la plus proche (ex: `us-east`)
   - **Plan** : `Free` (Hobby)
3. Cliquez sur **"Create database"**

### Étape 3 : Récupérer les Credentials

1. Une fois la base créée, allez dans l'onglet **"Settings"**
2. Cliquez sur **"Passwords"** dans le menu de gauche
3. Cliquez sur **"New password"**
4. Donnez un nom au mot de passe (ex: `render-production`)
5. Cliquez sur **"Create password"**
6. **⚠️ IMPORTANT** : Copiez immédiatement les informations affichées :
   ```
   Host: aws.connect.psdb.cloud
   Username: xxxxxx
   Password: pscale_xxxxx
   Database: dailyfix
   Port: 3306
   ```
   ⚠️ Le mot de passe ne sera plus visible après !

### Étape 4 : Configurer sur Render

1. Dans votre **service web Render**, allez dans **"Environment"**
2. Ajoutez ces variables (cliquez sur "Add Environment Variable" pour chacune) :

   ```
   DB_HOST=aws.connect.psdb.cloud
   DB_USER=[votre-username-copié]
   DB_PASSWORD=[votre-password-copié]
   DB_NAME=dailyfix
   DB_PORT=3306
   ```

3. Cliquez sur **"Save Changes"**

### Étape 5 : Tester la Connexion

1. Redéployez votre service sur Render
2. Vérifiez les logs pour voir si la connexion fonctionne
3. Vous devriez voir : `✅ MySQL Connected successfully`

---

## 🔄 Alternative : PostgreSQL sur Render

Si vous préférez utiliser PostgreSQL (gratuit sur Render) :

### Étape 1 : Créer PostgreSQL sur Render

1. Dans Render, cliquez sur **"New +"**
2. Sélectionnez **"PostgreSQL"**
3. Configurez :
   - **Name** : `dailyfix-db`
   - **Database** : `dailyfix`
   - **User** : `dailyfix_user`
   - **Region** : `Oregon` (ou votre région)
   - **PostgreSQL Version** : La plus récente
   - **Plan** : `Free`
4. Cliquez sur **"Create Database"**

### Étape 2 : Récupérer les Credentials

1. Une fois créée, allez dans votre base PostgreSQL
2. Dans l'onglet **"Info"**, vous verrez :
   - **Internal Database URL** : Pour les services sur Render
   - **External Database URL** : Pour les connexions externes
3. Parsez l'URL pour obtenir :
   ```
   DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
   DB_USER=dailyfix_user
   DB_PASSWORD=xxxxx
   DB_NAME=dailyfix
   DB_PORT=5432
   ```

### Étape 3 : Modifier le Code pour PostgreSQL

Vous devrez modifier `backend/config/database.js` :

```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dailyfix',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432, // 5432 pour PostgreSQL
    dialect: 'postgres', // Au lieu de 'mysql'
    // ... reste du code
  }
);
```

Et installer le driver PostgreSQL :
```bash
npm install pg pg-hstore
```

---

## 📊 Comparaison des Options

| Option | Coût | Difficulté | Compatibilité |
|--------|------|------------|---------------|
| **PlanetScale MySQL** | Gratuit | ⭐ Facile | ✅ Compatible avec votre code actuel |
| **PostgreSQL Render** | Gratuit | ⭐⭐ Moyen | ⚠️ Nécessite modification du code |
| **AWS RDS MySQL** | Payant | ⭐⭐⭐ Complexe | ✅ Compatible |

---

## ✅ Checklist Finale

- [ ] Base de données créée (PlanetScale ou PostgreSQL)
- [ ] Credentials notés et sauvegardés
- [ ] Variables d'environnement ajoutées dans Render
- [ ] Service redéployé
- [ ] Connexion testée (vérifier les logs)
- [ ] Tables créées (`npm run create-tables` dans Render Shell)

---

## 🆘 Besoin d'Aide ?

- Voir `CREATE_DATABASE_RENDER.md` pour plus de détails
- Voir `RENDER_DEPLOYMENT.md` pour le guide complet
- Consulter les logs Render en cas d'erreur

