# Dépannage du Déploiement Render

## ❌ Erreur : `ConnectionRefusedError` pendant le Build

### Problème
```
❌ Error creating tables: ConnectionRefusedError [SequelizeConnectionRefusedError]
```

### Cause
Vous essayez d'exécuter `npm run create-tables` pendant le **build**, mais :
1. Les variables d'environnement ne sont **pas disponibles** pendant le build
2. La base de données n'est **pas accessible** pendant le build
3. Le code détecte MySQL par défaut car `DB_PORT` n'est pas défini

### ✅ Solution

#### Étape 1 : Corriger le Build Command

Dans Render, modifiez le **Build Command** :

**❌ Incorrect :**
```
npm install && npm run create-tables
```

**✅ Correct :**
```
npm install
```

#### Étape 2 : Vérifier les Variables d'Environnement

Assurez-vous que **TOUTES** ces variables sont définies dans Render > Environment :

```env
NODE_ENV=production
DB_DIALECT=postgres
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
DB_USER=dailyfix_user
DB_PASSWORD=GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
DB_NAME=dailyfix
DB_PORT=5432
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
JWT_EXPIRE=7d
FRONTEND_URL=https://dali2000.github.io/DailyFix/
```

**⚠️ IMPORTANT :** `DB_DIALECT=postgres` doit être défini pour forcer PostgreSQL !

#### Étape 3 : Redéployer

1. Sauvegardez les changements dans Render
2. Le build devrait maintenant réussir avec juste `npm install`
3. Après le déploiement réussi, créez les tables via le Shell

#### Étape 4 : Vérifier la Création des Tables

Les tables sont créées **automatiquement au démarrage du serveur**. Vérifiez les logs pour confirmer :

1. Allez dans Render > Votre service > **Logs**
2. Vous devriez voir : `✅ Database models synchronized (tables created if needed)`

**Note :** Si vous avez accès au Shell (plan payant), vous pouvez aussi créer les tables manuellement, mais ce n'est pas nécessaire.

---

## 🔍 Autres Erreurs Courantes

### Erreur : "Dialect mysql is not supported"

**Cause :** Le code détecte MySQL au lieu de PostgreSQL

**Solution :** Ajoutez `DB_DIALECT=postgres` dans les variables d'environnement

### Erreur : "SSL connection required"

**Cause :** PostgreSQL sur Render nécessite SSL en production

**Solution :** Le code gère déjà SSL automatiquement si `NODE_ENV=production`. Vérifiez que cette variable est définie.

### Erreur : "ECONNREFUSED" au démarrage

**Cause :** Variables d'environnement manquantes ou incorrectes

**Solution :** 
1. Vérifiez que toutes les variables DB_* sont définies
2. Vérifiez que `DB_HOST` utilise l'URL complète (avec `.oregon-postgres.render.com`)
3. Vérifiez que `DB_DIALECT=postgres` est défini

### Le service démarre mais les requêtes échouent

**Cause :** Les tables n'ont pas été créées

**Solution :** Exécutez `npm run create-tables` dans le Shell Render

---

## ✅ Checklist de Déploiement

- [ ] Build Command = `npm install` (sans `create-tables`)
- [ ] Toutes les variables d'environnement sont définies
- [ ] `DB_DIALECT=postgres` est défini
- [ ] `NODE_ENV=production` est défini
- [ ] Build réussi (vérifier les logs)
- [ ] Service démarre (vérifier les logs : `✅ PostgreSQL Connected successfully`)
- [ ] Tables créées via Shell (`npm run create-tables`)

---

## 📋 Configuration Finale sur Render

### Build Command
```
npm install
```

### Start Command
```
npm start
```

### Root Directory
```
backend
```

### Variables d'Environnement (Toutes requises)
```
NODE_ENV=production
DB_DIALECT=postgres
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
DB_USER=dailyfix_user
DB_PASSWORD=GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
DB_NAME=dailyfix
DB_PORT=5432
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
JWT_EXPIRE=7d
FRONTEND_URL=https://dali2000.github.io/DailyFix/
```

---

## 🆘 Besoin d'Aide ?

1. Vérifiez les logs dans Render > Logs
2. Vérifiez que toutes les variables sont définies
3. Testez la connexion via le Shell Render
4. Consultez `RENDER_DEPLOYMENT.md` pour le guide complet
