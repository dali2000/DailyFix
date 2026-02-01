# Migration : catégories de dépenses personnalisées

## 1. Champ `category` des dépenses (Expense)

Le champ `category` est passé d’un **ENUM fixe** à un **STRING(100)** pour accepter toute catégorie.

### Base déjà existante (PostgreSQL)

Si la table `expenses` existe déjà avec l’ancien ENUM :

```sql
ALTER TABLE expenses
  ALTER COLUMN category TYPE VARCHAR(100) USING category::text;
```

### Nouvelle base

Aucune action : Sequelize crée la colonne en `VARCHAR(100)`.

## 2. Table des catégories personnalisées (expense_categories)

Une table **expense_categories** stocke les catégories ajoutées par chaque utilisateur (id, userId, name). Créée automatiquement au `sequelize.sync()` (script `create-tables.js`). Aucune migration manuelle nécessaire pour une nouvelle base.
