# Variables d'Environnement Complètes pour Render

## 📋 Liste Complète des Variables

Copiez-collez ces variables **une par une** dans Render > Environment :

### 1. Configuration Serveur
```
NODE_ENV=production
```

### 2. Configuration PostgreSQL (CRITIQUE)
```
DB_DIALECT=postgres
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
DB_USER=dailyfix_user
DB_PASSWORD=GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
DB_NAME=dailyfix
DB_PORT=5432
```

### 3. Configuration JWT
```
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
JWT_EXPIRE=7d
```

### 4. Configuration CORS
```
FRONTEND_URL=https://dali2000.github.io/DailyFix/
```

### 5. Configuration Google OAuth (Optionnel)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🔧 Comment Ajouter dans Render

### Méthode 1 : Ajouter Variable par Variable

1. Allez dans **Render** > Votre service > **Environment**
2. Pour chaque variable ci-dessus :
   - Cliquez sur **"Add Environment Variable"**
   - **Key** : Le nom de la variable (ex: `NODE_ENV`)
   - **Value** : La valeur (ex: `production`)
   - Cliquez sur **"Save"**

### Méthode 2 : Format Complet (Pour Référence)

Si Render permet l'import en masse, utilisez ce format :

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
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## ✅ Checklist

Après avoir ajouté toutes les variables, vérifiez :

- [ ] `NODE_ENV` = `production`
- [ ] `DB_DIALECT` = `postgres` (CRITIQUE - doit être présent)
- [ ] `DB_HOST` = host PostgreSQL complet
- [ ] `DB_USER` = `dailyfix_user`
- [ ] `DB_PASSWORD` = mot de passe PostgreSQL
- [ ] `DB_NAME` = `dailyfix`
- [ ] `DB_PORT` = `5432`
- [ ] `JWT_SECRET` = votre secret
- [ ] `JWT_EXPIRE` = `7d`
- [ ] `FRONTEND_URL` = URL de votre frontend
- [ ] Toutes les variables sont sauvegardées

## 🚀 Après Configuration

1. **Sauvegardez** toutes les modifications
2. Render va **redéployer automatiquement**
3. Vérifiez les **logs** pour confirmer :
   ```
   ✅ PostgreSQL Connected successfully
   ```

## 📝 Notes Importantes

- **Pas d'espaces** avant/après le `=`
- **Pas de guillemets** autour des valeurs
- `DB_DIALECT=postgres` (pas `postgresql` ou `PostgreSQL`)
- `DB_PORT=5432` (pas `"5432"` ou `5432 `)

