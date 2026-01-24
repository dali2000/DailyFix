# DailyFix Backend API

Backend API pour l'application DailyFix, construit avec Node.js, Express et MongoDB.

## 🚀 Installation

### Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v5.7 ou supérieur, ou MariaDB)
- npm ou yarn

### Étapes d'installation

1. **Installer les dépendances**
   ```bash
   cd backend
   npm install
   ```

2. **Créer la base de données MySQL**
   ```sql
   CREATE DATABASE dailyfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp env.example .env
   ```
   
   Puis éditez le fichier `.env` avec vos configurations :
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-mysql-password
   DB_NAME=dailyfix
   DB_PORT=3306
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:4200
   ```

4. **Démarrer MySQL**
   - Assurez-vous que MySQL est en cours d'exécution
   - Les tables seront créées automatiquement au premier démarrage

4. **Créer les tables de la base de données**

   **Option 1 : Automatique avec Sequelize (Recommandé)**
   ```bash
   npm run create-tables
   ```
   
   **Option 2 : Automatique au démarrage du serveur**
   Les tables seront créées automatiquement au premier démarrage en mode développement.
   
   **Option 3 : Manuel avec SQL**
   ```bash
   mysql -u root -p < scripts/create-tables.sql
   ```
   Ou ouvrez le fichier `scripts/create-tables.sql` dans votre client MySQL et exécutez-le.

5. **Démarrer le serveur**
   ```bash
   # Mode développement (avec nodemon)
   npm run dev
   
   # Mode production
   npm start
   ```

Le serveur sera accessible sur `http://localhost:3000`

## 📚 Structure du Projet

```
backend/
├── config/
│   └── database.js          # Configuration MySQL/Sequelize
├── middleware/
│   └── auth.middleware.js   # Middleware d'authentification JWT
├── models/
│   ├── User.model.js        # Modèle utilisateur
│   ├── Task.model.js        # Modèle tâches
│   ├── Event.model.js       # Modèle événements
│   ├── Health.model.js      # Modèles santé (repas, activités, sommeil, etc.)
│   ├── Finance.model.js     # Modèles finances
│   ├── Home.model.js        # Modèles maison (listes de courses, tâches ménagères)
│   ├── Wellness.model.js    # Modèles bien-être
│   └── Social.model.js      # Modèles sociaux
├── routes/
│   ├── auth.routes.js       # Routes d'authentification
│   ├── tasks.routes.js       # Routes tâches
│   ├── events.routes.js     # Routes événements
│   ├── health.routes.js      # Routes santé
│   ├── finance.routes.js     # Routes finances
│   ├── home.routes.js        # Routes maison
│   ├── wellness.routes.js    # Routes bien-être
│   └── social.routes.js      # Routes sociaux
├── server.js                # Point d'entrée de l'application
├── package.json
└── README.md
```

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Endpoints d'authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/google` - Connexion avec Google
- `GET /api/auth/me` - Obtenir l'utilisateur actuel (protégé)

### Utilisation du token

Pour les routes protégées, incluez le token dans les headers :
```
Authorization: Bearer <votre-token-jwt>
```

## 📡 Routes API

### Tâches
- `GET /api/tasks` - Liste des tâches
- `GET /api/tasks/:id` - Détails d'une tâche
- `POST /api/tasks` - Créer une tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
- `GET /api/tasks/status/:status` - Tâches par statut

### Événements
- `GET /api/events` - Liste des événements
- `GET /api/events/:id` - Détails d'un événement
- `POST /api/events` - Créer un événement
- `PUT /api/events/:id` - Modifier un événement
- `DELETE /api/events/:id` - Supprimer un événement
- `GET /api/events/date/:date` - Événements pour une date

### Santé
- `GET /api/health/meals` - Liste des repas
- `POST /api/health/meals` - Ajouter un repas
- `PUT /api/health/meals/:id` - Modifier un repas
- `DELETE /api/health/meals/:id` - Supprimer un repas
- (Même structure pour `activities`, `sleep`, `water`, `meditation`)

### Finances
- `GET /api/finance/expenses` - Liste des dépenses
- `POST /api/finance/expenses` - Ajouter une dépense
- (Même structure pour `budgets`, `savings-goals`, `salaries`)

### Maison
- `GET /api/home/shopping-lists` - Listes de courses
- `POST /api/home/shopping-lists` - Créer une liste
- (Même structure pour `household-tasks`)

### Bien-être
- `GET /api/wellness/journal` - Entrées de journal
- `POST /api/wellness/journal` - Créer une entrée
- (Même structure pour `goals`, `stress`)

### Social
- `GET /api/social/events` - Événements sociaux
- `POST /api/social/events` - Créer un événement
- (Même structure pour `suggestions`)

## 🔒 Sécurité

- Toutes les routes (sauf auth) sont protégées par JWT
- Les mots de passe sont hashés avec bcrypt
- Validation des données avec express-validator
- CORS configuré pour le frontend
- Isolation des données par utilisateur (userId)

## 🧪 Test de l'API

Vous pouvez tester l'API avec :
- Postman
- Insomnia
- curl
- L'application Angular frontend

### Exemple de requête

```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Obtenir les tâches (avec token)
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Notes

- Toutes les données sont isolées par utilisateur (userId)
- Les dates sont stockées en UTC
- Les IDs sont des entiers auto-incrémentés (MySQL)
- Les timestamps (createdAt, updatedAt) sont gérés automatiquement par Sequelize
- Les tables sont créées automatiquement au premier démarrage en mode développement

## 🚀 Déploiement

Pour déployer en production :

1. Configurez les variables d'environnement
2. Utilisez une base de données MySQL (local ou cloud comme AWS RDS, PlanetScale, etc.)
3. Changez le JWT_SECRET pour une valeur sécurisée
4. Configurez CORS pour votre domaine de production
5. Utilisez un processus manager comme PM2
6. Assurez-vous que les tables sont créées (migration manuelle ou sync en production)

```bash
npm install -g pm2
pm2 start server.js --name dailyfix-api
```

