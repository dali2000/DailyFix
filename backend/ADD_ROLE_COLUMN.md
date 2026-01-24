# Ajouter la Colonne 'role' à la Base de Données

## ⚠️ Erreur : "Unknown column 'role' in 'field list'"

Cette erreur signifie que la colonne `role` n'existe pas encore dans votre table `users`.

## ✅ Solution : Exécuter le Script de Migration

### En Local (MySQL)

```bash
cd backend
npm run add-role-column
```

### Sur Render (PostgreSQL)

Si vous avez accès au Shell Render :
```bash
npm run add-role-column
```

Si vous n'avez pas accès au Shell, vous pouvez :

1. **Exécuter le script localement** avec les variables de production :
   - Créez un fichier `.env` temporaire avec les variables de Render
   - Exécutez : `npm run add-role-column`

2. **Ou exécuter directement la requête SQL** dans votre base PostgreSQL :
   ```sql
   -- Créer le type ENUM
   CREATE TYPE user_role AS ENUM ('user', 'admin');
   
   -- Ajouter la colonne
   ALTER TABLE users 
   ADD COLUMN role user_role DEFAULT 'user'::user_role NOT NULL;
   ```

## 🔍 Vérification

Après avoir exécuté le script, vérifiez que la colonne existe :

**MySQL :**
```sql
DESCRIBE users;
```

**PostgreSQL :**
```sql
\d users
```

Vous devriez voir la colonne `role` avec le type `ENUM('user', 'admin')` ou `user_role`.

## 📝 Après Ajout de la Colonne

1. **Tous les utilisateurs existants** auront automatiquement le rôle `user`
2. **Créez votre premier admin** :
   ```bash
   npm run create-admin
   ```

3. **Redémarrez le serveur** pour que les changements prennent effet

## 🆘 Si le Script Échoue

### Erreur : "Column already exists"

Cela signifie que la colonne existe déjà. Vous pouvez ignorer cette erreur.

### Erreur de connexion

Vérifiez que :
- Les variables d'environnement sont correctement configurées
- La base de données est accessible
- Les credentials sont corrects

### Erreur de syntaxe SQL

Le script détecte automatiquement MySQL ou PostgreSQL. Si vous avez une erreur, vérifiez le dialect de votre base de données.

