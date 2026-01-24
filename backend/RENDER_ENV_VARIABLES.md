# Variables d'Environnement pour Render

## 📋 Variables à Configurer sur Render

Une fois votre base PostgreSQL créée sur Render, configurez ces variables dans votre **service web Render** :

### Variables d'Environnement Requises

Allez dans votre service Render > **Environment** > **Add Environment Variable** et ajoutez :

```env
# Server Configuration
NODE_ENV=production
# PORT est automatiquement défini par Render, pas besoin de le configurer

# PostgreSQL Configuration (depuis votre URL Render)
DB_DIALECT=postgres
DB_HOST=dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com
DB_USER=dailyfix_user
DB_PASSWORD=GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8
DB_NAME=dailyfix
DB_PORT=5432

# JWT Configuration
JWT_SECRET=ma-cle-secrete-super-forte-et-unique-123456789
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=https://votre-frontend-url.onrender.com
# Remplacez par l'URL réelle de votre frontend déployé
# Exemple: https://dailyfix-frontend.onrender.com

# Google OAuth Configuration (optionnel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🔐 Informations Extraites de votre URL PostgreSQL

De votre URL Render :
```
postgresql://dailyfix_user:GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8@dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com/dailyfix
```

**Informations extraites :**
- **DB_HOST** : `dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com`
- **DB_USER** : `dailyfix_user`
- **DB_PASSWORD** : `GAqChUzu0lr66wKlgqX3rhwEwHDqBWf8`
- **DB_NAME** : `dailyfix`
- **DB_PORT** : `5432` (port par défaut PostgreSQL)

## ⚠️ URL Interne vs Externe

- **External URL** : `dpg-d5qe3efgi27c73farq10-a.oregon-postgres.render.com`
  - Utilisez cette URL pour les services sur Render (recommandé)
  
- **Internal URL** : `dpg-d5qe3efgi27c73farq10-a`
  - Utilisez cette URL uniquement si votre service est dans le même réseau privé Render

**Recommandation** : Utilisez l'URL externe (`DB_HOST` avec le domaine complet).

## 📝 Checklist

- [ ] Toutes les variables d'environnement ajoutées dans Render
- [ ] `DB_HOST` utilise l'URL externe complète
- [ ] `FRONTEND_URL` correspond à l'URL de votre frontend déployé
- [ ] `JWT_SECRET` est sécurisé (généré avec une commande aléatoire)
- [ ] Service redéployé après l'ajout des variables

## 🔄 Après Configuration

1. **Redéployez votre service** sur Render
2. **Vérifiez les logs** pour confirmer la connexion :
   - Vous devriez voir : `✅ PostgreSQL Connected successfully`
3. **Créez les tables** :
   - Allez dans Render > Votre service > **Shell**
   - Exécutez : `npm run create-tables`

## 🆘 Dépannage

### Erreur de connexion SSL
Si vous voyez une erreur SSL, assurez-vous que `NODE_ENV=production` est défini (le code active SSL automatiquement en production).

### Erreur "relation does not exist"
Les tables n'ont pas encore été créées. Exécutez `npm run create-tables` dans le Shell Render.

### Erreur CORS
Vérifiez que `FRONTEND_URL` correspond **exactement** à l'URL de votre frontend (avec https://).

