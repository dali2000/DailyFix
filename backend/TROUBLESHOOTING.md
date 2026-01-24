# Guide de dépannage - DailyFix Backend

## ❌ Erreur : "Server error during registration" mais l'utilisateur est enregistré

### Problème
Vous recevez une erreur lors de l'inscription, mais l'utilisateur est quand même créé dans la base de données.

### Cause probable
Le problème vient généralement de la génération du token JWT. La cause la plus courante est que `JWT_SECRET` n'est pas défini dans votre fichier `.env`.

### Solution

1. **Vérifiez que le fichier `.env` existe** dans le dossier `backend/` :
   ```bash
   cd backend
   ls -la .env  # Linux/Mac
   dir .env     # Windows
   ```

2. **Créez le fichier `.env`** si il n'existe pas :
   ```bash
   cp env.example .env
   ```

3. **Vérifiez que `JWT_SECRET` est défini** dans votre fichier `.env` :
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```
   
   ⚠️ **Important** : Remplacez `your-super-secret-jwt-key-change-this-in-production` par une clé secrète forte et unique.

4. **Redémarrez le serveur** après avoir modifié le `.env` :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   npm run dev
   ```

### Vérification

Pour vérifier que `JWT_SECRET` est bien chargé, ajoutez temporairement dans `server.js` :
```javascript
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Defined' : '❌ Not defined');
```

### Exemple de `.env` complet

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre-mot-de-passe
DB_NAME=dailyfix
DB_PORT=3306

# JWT Configuration
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:4200
```

---

## ❌ Autres erreurs courantes

### Erreur : "Cannot connect to MySQL"

**Solution** :
1. Vérifiez que MySQL est démarré
2. Vérifiez les identifiants dans `.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
3. Testez la connexion :
   ```bash
   mysql -u root -p
   ```

### Erreur : "Table doesn't exist"

**Solution** :
1. Créez les tables :
   ```bash
   npm run create-tables
   ```

### Erreur : "Access denied for user"

**Solution** :
1. Vérifiez que l'utilisateur MySQL a les droits nécessaires
2. Créez un utilisateur si nécessaire :
   ```sql
   CREATE USER 'dailyfix_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON dailyfix.* TO 'dailyfix_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Erreur : "Port 3000 already in use"

**Solution** :
1. Changez le port dans `.env` :
   ```env
   PORT=3001
   ```
2. Ou arrêtez le processus qui utilise le port 3000

---

## 🔍 Comment déboguer

### 1. Vérifier les logs du serveur

Le serveur affiche les erreurs dans la console. Regardez attentivement les messages d'erreur.

### 2. Activer les logs Sequelize

Dans `config/database.js`, le logging est activé en mode développement :
```javascript
logging: process.env.NODE_ENV === 'development' ? console.log : false
```

### 3. Vérifier les variables d'environnement

Ajoutez temporairement dans `server.js` :
```javascript
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
```

### 4. Tester la connexion MySQL

Créez un fichier `test-db.js` :
```javascript
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful');
    await sequelize.close();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
  }
})();
```

Exécutez :
```bash
node test-db.js
```

---

## 📝 Checklist de vérification

Avant de tester l'API, assurez-vous que :

- [ ] Le fichier `.env` existe dans `backend/`
- [ ] `JWT_SECRET` est défini dans `.env`
- [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` sont corrects
- [ ] MySQL est démarré
- [ ] La base de données `dailyfix` existe
- [ ] Les tables sont créées (`npm run create-tables`)
- [ ] Le serveur est démarré (`npm run dev`)
- [ ] Le port 3000 est disponible

---

## 🆘 Besoin d'aide ?

Si le problème persiste :

1. Vérifiez les logs du serveur pour l'erreur exacte
2. Vérifiez que toutes les dépendances sont installées : `npm install`
3. Vérifiez la version de Node.js : `node --version` (doit être >= 14)
4. Vérifiez la version de MySQL : `mysql --version`

