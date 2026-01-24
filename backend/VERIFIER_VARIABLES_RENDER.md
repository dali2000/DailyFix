# Comment Vérifier les Variables dans Render

## ⚠️ Problème : Le code détecte toujours MySQL

Si vous voyez toujours "MySQL connection error", cela signifie que les variables d'environnement ne sont **pas correctement définies** dans Render.

## 🔍 Vérification Étape par Étape

### Étape 1 : Vérifier dans Render

1. Allez dans **Render Dashboard**
2. Cliquez sur votre service **dailyfix-backend**
3. Allez dans l'onglet **"Environment"**
4. **Vérifiez visuellement** que vous voyez ces variables :

```
NODE_ENV = production
DB_DIALECT = postgres
DB_HOST = dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
DB_USER = dailyfix_user
DB_PASSWORD = GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
DB_NAME = dailyfix
DB_PORT = 5432
```

### Étape 2 : Vérifier le Format

Pour chaque variable, vérifiez :
- ✅ Pas d'espaces avant/après le nom
- ✅ Pas d'espaces avant/après la valeur
- ✅ Pas de guillemets autour de la valeur
- ✅ `DB_DIALECT` = `postgres` (pas `postgresql` ou `PostgreSQL`)

### Étape 3 : Vérifier que `NODE_ENV=production`

**CRITIQUE** : Si `NODE_ENV` n'est pas `production`, le code ne forcera pas PostgreSQL.

Vérifiez que :
```
NODE_ENV = production
```

**Pas** :
- `NODE_ENV = development`
- `NODE_ENV = Development`
- `NODE_ENV = PRODUCTION`

### Étape 4 : Vérifier que `DB_DIALECT` Existe

**CRITIQUE** : La variable `DB_DIALECT` doit exister et être égale à `postgres`.

Si elle n'existe pas :
1. Cliquez sur **"Add Environment Variable"**
2. **Key** : `DB_DIALECT`
3. **Value** : `postgres`
4. Cliquez sur **"Save"**

### Étape 5 : Vérifier les Logs

Après redéploiement, dans les logs, vous devriez voir :

```
🔍 Database configuration: {
  NODE_ENV: 'production',
  DB_DIALECT: 'postgres',
  DB_PORT: '5432',
  DB_HOST: 'dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com',
  detected_dialect: 'postgres'
}
✅ PostgreSQL Connected successfully
```

**Si vous ne voyez PAS ces logs**, les variables ne sont pas chargées.

## 🆘 Si les Variables Ne Sont Pas Visibles dans les Logs

Cela signifie que les variables d'environnement ne sont **pas chargées**. Vérifiez :

1. **Les variables sont-elles sauvegardées ?**
   - Rafraîchissez la page Render
   - Vérifiez que toutes les variables sont toujours là

2. **Avez-vous redéployé après avoir ajouté les variables ?**
   - Render redéploie automatiquement, mais parfois il faut forcer
   - Allez dans **Manual Deploy** > **Deploy latest commit**

3. **Le code est-il à jour ?**
   - Assurez-vous que le dernier commit est déployé
   - Vérifiez que `server.js` charge `dotenv` avant `database.js`

## ✅ Solution de Secours : Forcer PostgreSQL

J'ai modifié le code pour **forcer PostgreSQL en production**. Même si `DB_DIALECT` n'est pas défini, si `NODE_ENV=production`, le code utilisera PostgreSQL.

**MAIS** : Vous devez quand même avoir `NODE_ENV=production` défini dans Render !

## 📋 Checklist Finale

- [ ] Toutes les variables sont visibles dans Render > Environment
- [ ] `NODE_ENV=production` (pas `development`)
- [ ] `DB_DIALECT=postgres` existe
- [ ] `DB_HOST` contient `.oregon-postgres.render.com`
- [ ] `DB_PORT=5432` (pas `3306`)
- [ ] Toutes les variables sont sauvegardées
- [ ] Service redéployé après modification
- [ ] Logs affichent "PostgreSQL" et non "MySQL"

