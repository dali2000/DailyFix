# Installation des Dépendances PostgreSQL

## 📦 Installation Locale

Pour tester en local avec PostgreSQL, installez les dépendances :

```bash
cd backend
npm install
```

Cela installera automatiquement :
- `pg` - Driver PostgreSQL pour Node.js
- `pg-hstore` - Support HStore pour Sequelize

## ✅ Vérification

Les dépendances suivantes sont maintenant dans `package.json` :
- `pg` (PostgreSQL driver)
- `pg-hstore` (HStore support)
- `mysql2` (toujours présent pour compatibilité MySQL)

## 🔄 Migration Automatique

Le code détecte automatiquement le type de base de données :
- Si `DB_PORT=5432` → Utilise PostgreSQL
- Si `DB_PORT=3306` → Utilise MySQL
- Ou définissez explicitement `DB_DIALECT=postgres` ou `DB_DIALECT=mysql`

## 🚀 Sur Render

Sur Render, les dépendances seront installées automatiquement lors du build avec `npm install`.

Pas besoin d'action supplémentaire !

