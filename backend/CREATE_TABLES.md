# Guide pour créer les tables de la base de données

Il existe **3 méthodes** pour créer toutes les tables de la base de données DailyFix.

## 📋 Prérequis

1. **Créer la base de données MySQL** :
   ```sql
   CREATE DATABASE dailyfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configurer le fichier `.env`** avec vos informations de connexion :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre-mot-de-passe
   DB_NAME=dailyfix
   DB_PORT=3306
   ```

---

## 🚀 Méthode 1 : Script Node.js (Recommandé)

Cette méthode utilise Sequelize pour créer automatiquement toutes les tables.

### Étapes :

1. **Installer les dépendances** (si pas déjà fait) :
   ```bash
   cd backend
   npm install
   ```

2. **Exécuter le script** :
   ```bash
   npm run create-tables
   ```

   Ou directement :
   ```bash
   node scripts/create-tables.js
   ```

### ✅ Avantages :
- Automatique et rapide
- Utilise les modèles Sequelize (cohérence garantie)
- Crée toutes les relations et index

---

## 🚀 Méthode 2 : Automatique au démarrage du serveur

Les tables seront créées automatiquement lors du premier démarrage en mode développement.

### Étapes :

1. **Démarrer le serveur en mode développement** :
   ```bash
   npm run dev
   ```

2. Les tables seront créées automatiquement si elles n'existent pas.

### ⚠️ Note :
Cette méthode fonctionne uniquement si `NODE_ENV=development` dans votre fichier `.env`.

---

## 🚀 Méthode 3 : Script SQL manuel

Cette méthode utilise un script SQL pour créer toutes les tables manuellement.

### Étapes :

1. **Ouvrir MySQL** :
   ```bash
   mysql -u root -p
   ```

2. **Exécuter le script SQL** :
   ```bash
   mysql -u root -p dailyfix < scripts/create-tables.sql
   ```

   Ou depuis MySQL :
   ```sql
   USE dailyfix;
   SOURCE scripts/create-tables.sql;
   ```

   Ou copiez-collez le contenu du fichier `scripts/create-tables.sql` dans votre client MySQL (phpMyAdmin, MySQL Workbench, etc.)

### ✅ Avantages :
- Contrôle total sur la structure
- Peut être modifié avant exécution
- Utile pour comprendre la structure de la base de données

---

## 📊 Tables créées

Les 18 tables suivantes seront créées :

1. **users** - Utilisateurs
2. **tasks** - Tâches
3. **events** - Événements du calendrier
4. **meals** - Repas
5. **physical_activities** - Activités physiques
6. **sleep_records** - Enregistrements de sommeil
7. **water_intakes** - Consommation d'eau
8. **meditation_sessions** - Sessions de méditation
9. **expenses** - Dépenses
10. **budgets** - Budgets
11. **savings_goals** - Objectifs d'épargne
12. **salaries** - Salaires
13. **shopping_lists** - Listes de courses
14. **household_tasks** - Tâches ménagères
15. **journal_entries** - Entrées de journal
16. **personal_goals** - Objectifs personnels
17. **stress_management** - Gestion du stress
18. **social_events** - Événements sociaux
19. **activity_suggestions** - Suggestions d'activités

---

## 🔍 Vérifier que les tables sont créées

Après avoir exécuté une des méthodes, vérifiez que les tables existent :

```sql
USE dailyfix;
SHOW TABLES;
```

Vous devriez voir toutes les 19 tables listées ci-dessus.

---

## 🔄 Réinitialiser les tables (ATTENTION : Supprime toutes les données)

Si vous voulez supprimer et recréer toutes les tables :

### Avec Sequelize :
Modifiez `scripts/create-tables.js` et changez :
```javascript
await sequelize.sync({ force: false, alter: false });
```
en :
```javascript
await sequelize.sync({ force: true }); // ⚠️ Supprime toutes les données !
```

### Avec SQL :
```sql
DROP DATABASE dailyfix;
CREATE DATABASE dailyfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dailyfix;
SOURCE scripts/create-tables.sql;
```

---

## ❓ Problèmes courants

### Erreur : "Access denied"
- Vérifiez vos identifiants MySQL dans le fichier `.env`
- Assurez-vous que l'utilisateur a les droits nécessaires

### Erreur : "Database doesn't exist"
- Créez d'abord la base de données : `CREATE DATABASE dailyfix;`

### Erreur : "Table already exists"
- C'est normal si les tables existent déjà
- Utilisez `{ alter: true }` dans Sequelize pour mettre à jour les tables existantes

### Erreur : "Cannot find module"
- Exécutez `npm install` dans le dossier `backend`

---

## 📝 Notes importantes

- **En production** : Utilisez des migrations Sequelize plutôt que `sync()`
- **Backup** : Faites toujours un backup avant de modifier la structure
- **Index** : Toutes les tables ont des index sur `userId` pour de meilleures performances
- **Foreign Keys** : Toutes les relations utilisent `ON DELETE CASCADE` pour maintenir l'intégrité

