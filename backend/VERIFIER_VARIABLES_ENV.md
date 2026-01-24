# Vérifier les Variables d'Environnement sur Render

## ⚠️ Erreur : "MySQL connection error" au lieu de PostgreSQL

Si vous voyez cette erreur, cela signifie que le code détecte MySQL au lieu de PostgreSQL.

## ✅ Solution : Vérifier et Ajouter les Variables

### Étape 1 : Vérifier dans Render

1. Allez dans Render > Votre service > **Environment**
2. Vérifiez que **TOUTES** ces variables sont présentes :

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

### Étape 2 : Variable CRITIQUE

**La variable la plus importante est :**

```env
DB_DIALECT=postgres
```

**Sans cette variable, le code peut détecter MySQL par défaut !**

### Étape 3 : Vérifier le Format

Assurez-vous que :
- ✅ Pas d'espaces avant/après les valeurs
- ✅ Pas de guillemets autour des valeurs
- ✅ `DB_PORT=5432` (pas `DB_PORT="5432"` ou `DB_PORT= 5432`)
- ✅ `DB_DIALECT=postgres` (pas `DB_DIALECT=postgresql` ou `DB_DIALECT=PostgreSQL`)

### Étape 4 : Ajouter la Variable si Manquante

Si `DB_DIALECT` n'existe pas :

1. Dans Render > Environment
2. Cliquez sur **"Add Environment Variable"**
3. **Key** : `DB_DIALECT`
4. **Value** : `postgres`
5. Cliquez sur **"Save Changes"**

### Étape 5 : Redéployer

Après avoir ajouté/modifié les variables :

1. Render redéploiera automatiquement
2. Ou allez dans **Manual Deploy** > **Deploy latest commit**

## 🔍 Comment Vérifier que ça Fonctionne

Dans les logs, vous devriez voir :

```
✅ PostgreSQL Connected successfully
✅ Database models synchronized (tables created if needed)
🚀 Server running on port 10000
```

**Si vous voyez "MySQL" au lieu de "PostgreSQL", les variables ne sont pas correctement configurées.**

## 🆘 Dépannage

### Le code détecte toujours MySQL

1. Vérifiez que `DB_DIALECT=postgres` est défini (pas `postgresql`)
2. Vérifiez qu'il n'y a pas d'espaces : `DB_DIALECT=postgres` (pas `DB_DIALECT = postgres`)
3. Vérifiez que la variable est bien sauvegardée (rafraîchissez la page)
4. Redéployez après avoir modifié les variables

### Erreur "ECONNREFUSED"

1. Vérifiez que `DB_HOST` est correct (avec `.oregon-postgres.render.com`)
2. Vérifiez que `DB_PORT=5432` est défini
3. Vérifiez que `DB_USER` et `DB_PASSWORD` sont corrects
4. Vérifiez que la base de données PostgreSQL est bien active sur Render

### Comment Voir les Variables Actuelles

Le code a été mis à jour pour afficher les variables de détection en développement. En production, vérifiez les logs pour voir quelle base est détectée.

## 📋 Checklist Complète

- [ ] `NODE_ENV=production` est défini
- [ ] `DB_DIALECT=postgres` est défini (CRITIQUE)
- [ ] `DB_HOST` contient `.oregon-postgres.render.com`
- [ ] `DB_PORT=5432` est défini
- [ ] `DB_USER=dailyfix_user` est défini
- [ ] `DB_PASSWORD` est correct
- [ ] `DB_NAME=dailyfix` est défini
- [ ] Toutes les variables sont sauvegardées
- [ ] Service redéployé après modification
- [ ] Logs affichent "PostgreSQL" et non "MySQL"

