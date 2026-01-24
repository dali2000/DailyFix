# Variables d'Environnement pour Render - Configuration Complète

## ⚠️ Problème Actuel

Vous avez copié les valeurs de développement dans Render. Il faut les remplacer par les valeurs de **production PostgreSQL**.

## ✅ Configuration Correcte pour Render

Dans Render > Environment, **remplacez TOUT** par ces valeurs :

```env
NODE_ENV=production
```

```env
DB_DIALECT=postgres
```

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

```env
GOOGLE_CLIENT_ID=your-google-client-id
```

```env
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📋 Comparaison : Avant vs Après

| Variable | ❌ Actuel (Développement) | ✅ Correct (Production) |
|----------|---------------------------|------------------------|
| `NODE_ENV` | `development` | `production` |
| `DB_DIALECT` | **MANQUANT** | `postgres` |
| `DB_HOST` | `localhost` | `dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com` |
| `DB_USER` | `root` | `dailyfix_user` |
| `DB_PASSWORD` | `your-mysql-password` | `GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8` |
| `DB_PORT` | `3306` (MySQL) | `5432` (PostgreSQL) |
| `FRONTEND_URL` | `http://localhost:4200` | `https://dali2000.github.io/DailyFix/` |

## 🔧 Comment Modifier dans Render

### Option 1 : Modifier Variable par Variable

1. Allez dans Render > Votre service > **Environment**
2. Pour chaque variable, cliquez sur **"Edit"**
3. Modifiez la valeur
4. Cliquez sur **"Save"**

### Option 2 : Supprimer et Recréer (Plus Rapide)

1. Allez dans Render > Votre service > **Environment**
2. **Supprimez** toutes les variables DB_* existantes
3. **Ajoutez** les nouvelles variables une par une avec les bonnes valeurs

## ✅ Checklist de Modification

- [ ] `NODE_ENV` = `production` (pas `development`)
- [ ] `DB_DIALECT` = `postgres` (AJOUTER cette variable - elle n'existe pas actuellement)
- [ ] `DB_HOST` = `dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com` (pas `localhost`)
- [ ] `DB_USER` = `dailyfix_user` (pas `root`)
- [ ] `DB_PASSWORD` = `GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8` (pas `your-mysql-password`)
- [ ] `DB_PORT` = `5432` (pas `3306`)
- [ ] `FRONTEND_URL` = `https://dali2000.github.io/DailyFix/` (pas `http://localhost:4200`)

## 🚀 Après Modification

1. **Sauvegardez** toutes les modifications
2. Render va **redéployer automatiquement**
3. Vérifiez les **logs** - vous devriez voir :
   ```
   🔍 Database configuration: {
     DB_DIALECT: 'postgres',
     DB_PORT: '5432',
     DB_HOST: 'dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com',
     detected_dialect: 'postgres'
   }
   ✅ PostgreSQL Connected successfully
   ```

## ⚠️ Variables Importantes

### Variables CRITIQUES (doivent absolument être modifiées) :
- `NODE_ENV` → `production`
- `DB_DIALECT` → `postgres` (à AJOUTER)
- `DB_HOST` → host PostgreSQL Render
- `DB_PORT` → `5432`
- `DB_USER` → `dailyfix_user`
- `DB_PASSWORD` → mot de passe PostgreSQL

### Variables à Modifier :
- `FRONTEND_URL` → URL de votre frontend déployé

### Variables Optionnelles (peuvent rester telles quelles) :
- `GOOGLE_CLIENT_ID` (si vous n'utilisez pas Google OAuth)
- `GOOGLE_CLIENT_SECRET` (si vous n'utilisez pas Google OAuth)

## 🆘 Si ça ne fonctionne toujours pas

1. Vérifiez que toutes les variables sont **sauvegardées** (rafraîchissez la page)
2. Vérifiez qu'il n'y a **pas d'espaces** avant/après les valeurs
3. Vérifiez que `DB_DIALECT=postgres` est bien défini
4. Vérifiez les **logs** pour voir ce qui est détecté
5. **Redéployez** manuellement si nécessaire

