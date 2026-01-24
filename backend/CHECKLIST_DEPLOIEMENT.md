# ✅ Checklist Complète de Déploiement Render

## ⚠️ Si vous voyez "MySQL connection error"

Cela signifie que **`DB_DIALECT=postgres` n'est pas défini** ou que les variables d'environnement ne sont pas correctement configurées.

## 📋 Checklist Étape par Étape

### 1. ✅ Build Command

Dans Render > Settings > Build Command :

```
npm install
```

**❌ NE PAS utiliser :** `npm install && npm run create-tables`

### 2. ✅ Variables d'Environnement (CRITIQUE)

Dans Render > Environment, vous DEVEZ avoir **EXACTEMENT** ces variables :

#### Variables OBLIGATOIRES :

```env
NODE_ENV=production
```

```env
DB_DIALECT=postgres
```
**⚠️ Cette variable est CRITIQUE ! Sans elle, le code utilisera MySQL !**

```env
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
```

```env
DB_USER=dailyfix_user
```

```env
DB_PASSWORD=GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
```

```env
DB_NAME=dailyfix
```

```env
DB_PORT=5432
```

```env
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
```

```env
JWT_EXPIRE=7d
```

```env
FRONTEND_URL=https://dali2000.github.io/DailyFix/
```

### 3. ✅ Comment Ajouter une Variable

1. Dans Render > Votre service > **Environment**
2. Cliquez sur **"Add Environment Variable"**
3. Entrez le **Key** (ex: `DB_DIALECT`)
4. Entrez la **Value** (ex: `postgres`)
5. Cliquez sur **"Save Changes"**

### 4. ✅ Vérifier que les Variables sont Sauvegardées

- Rafraîchissez la page
- Vérifiez que toutes les variables sont présentes
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

### 5. ✅ Redéployer

Après avoir ajouté/modifié les variables :

1. Render redéploiera automatiquement
2. OU allez dans **Manual Deploy** > **Deploy latest commit**

### 6. ✅ Vérifier les Logs

Dans Render > Logs, vous devriez voir :

```
🔍 Database configuration: {
  DB_DIALECT: 'postgres',
  DB_PORT: '5432',
  DB_HOST: 'dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com',
  detected_dialect: 'postgres'
}
✅ PostgreSQL Connected successfully
✅ Database models synchronized (tables created if needed)
🚀 Server running on port 10000
```

**Si vous voyez "MySQL" au lieu de "PostgreSQL", les variables ne sont pas correctement configurées.**

## 🆘 Erreurs Courantes

### Erreur : "MySQL connection error"

**Cause :** `DB_DIALECT=postgres` n'est pas défini

**Solution :** Ajoutez `DB_DIALECT=postgres` dans Render > Environment

### Erreur : "ECONNREFUSED"

**Cause :** Variables DB_* manquantes ou incorrectes

**Solution :** Vérifiez que toutes les variables DB_* sont définies et correctes

### Le code détecte toujours MySQL

**Cause :** Variables d'environnement non chargées ou mal formatées

**Solution :** 
1. Vérifiez le format (pas d'espaces, pas de guillemets)
2. Vérifiez que `DB_DIALECT=postgres` est défini
3. Redéployez après modification

## 📝 Format Correct des Variables

✅ **Correct :**
```
DB_DIALECT=postgres
DB_PORT=5432
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
```

❌ **Incorrect :**
```
DB_DIALECT = postgres          (espaces autour du =)
DB_DIALECT="postgres"          (guillemets)
DB_DIALECT=PostgreSQL          (majuscules)
DB_DIALECT=postgresql          (postgresql au lieu de postgres)
```

## 🎯 Résumé Rapide

1. Build Command = `npm install`
2. Ajoutez `DB_DIALECT=postgres` (CRITIQUE)
3. Ajoutez toutes les autres variables
4. Sauvegardez
5. Redéployez
6. Vérifiez les logs

## ✅ Test Final

Une fois déployé, testez :
```
https://votre-service.onrender.com/api/health
```

Vous devriez recevoir :
```json
{"status":"OK","message":"DailyFix API is running"}
```

