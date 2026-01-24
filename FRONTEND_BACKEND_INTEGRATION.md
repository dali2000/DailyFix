# Guide d'intégration Frontend-Backend

Ce guide explique comment le frontend Angular est connecté au backend Node.js.

## 🔗 Architecture

### Frontend (Angular)
- **URL API** : `http://localhost:3000/api`
- **Authentification** : JWT Token stocké dans `localStorage`
- **Intercepteur HTTP** : Ajoute automatiquement le token JWT à toutes les requêtes

### Backend (Node.js + Express)
- **Port** : `3000`
- **Base de données** : MySQL
- **Authentification** : JWT Token

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`src/environments/environment.ts`** - Configuration de l'URL de l'API
2. **`src/environments/environment.prod.ts`** - Configuration pour la production
3. **`src/app/services/api.service.ts`** - Service générique pour les requêtes HTTP
4. **`src/app/interceptors/auth.interceptor.ts`** - Intercepteur pour ajouter le token JWT

### Fichiers modifiés

1. **`src/app/app.config.ts`** - Ajout de `HttpClient` et de l'intercepteur
2. **`src/app/services/auth.service.ts`** - Migration vers le backend (Observables)
3. **`src/app/components/login/login.component.ts`** - Utilisation des Observables

---

## 🔐 Authentification

### Flux d'authentification

1. **Inscription/Connexion** :
   - L'utilisateur envoie ses identifiants
   - Le backend retourne un token JWT
   - Le token est stocké dans `localStorage`
   - L'utilisateur est redirigé vers `/home`

2. **Requêtes authentifiées** :
   - L'intercepteur HTTP ajoute automatiquement le header `Authorization: Bearer <token>`
   - Le backend vérifie le token
   - Si valide, la requête est traitée

3. **Déconnexion** :
   - Le token est supprimé de `localStorage`
   - L'utilisateur est redirigé vers `/login`

### Stockage

- **Token JWT** : `localStorage.getItem('dailyfix_token')`
- **Utilisateur** : `localStorage.getItem('dailyfix_user')`

---

## 🚀 Utilisation

### Dans un service

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private apiService: ApiService) {}

  getTasks(): Observable<any> {
    return this.apiService.get('/tasks');
  }

  createTask(task: any): Observable<any> {
    return this.apiService.post('/tasks', task);
  }

  updateTask(id: number, task: any): Observable<any> {
    return this.apiService.put(`/tasks/${id}`, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.apiService.delete(`/tasks/${id}`);
  }
}
```

### Dans un composant

```typescript
import { Component, OnInit } from '@angular/core';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html'
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (response) => {
        this.tasks = response.data || response;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }
}
```

---

## 🔧 Configuration

### Changer l'URL de l'API

Modifiez `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // Changez cette URL
};
```

### Pour la production

Modifiez `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-domaine.com/api' // URL de votre serveur de production
};
```

---

## 📡 Endpoints disponibles

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/google` - Connexion Google
- `GET /api/auth/me` - Obtenir l'utilisateur actuel

### Tâches
- `GET /api/tasks` - Liste des tâches
- `GET /api/tasks/:id` - Détails d'une tâche
- `POST /api/tasks` - Créer une tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche

### Événements
- `GET /api/events` - Liste des événements
- `POST /api/events` - Créer un événement
- `PUT /api/events/:id` - Modifier un événement
- `DELETE /api/events/:id` - Supprimer un événement

### Santé
- `GET /api/health/meals` - Liste des repas
- `POST /api/health/meals` - Ajouter un repas
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

---

## ⚠️ Prochaines étapes

Pour connecter complètement le frontend au backend, vous devez mettre à jour les autres services :

1. **TaskService** - Utiliser `ApiService` au lieu de `localStorage`
2. **HealthService** - Utiliser `ApiService` pour les données de santé
3. **FinanceService** - Utiliser `ApiService` pour les finances
4. **HomeService** - Utiliser `ApiService` pour les listes de courses
5. **WellnessService** - Utiliser `ApiService` pour le bien-être
6. **SocialService** - Utiliser `ApiService` pour les événements sociaux

---

## 🐛 Dépannage

### Erreur CORS

Si vous avez des erreurs CORS, vérifiez que le backend autorise les requêtes depuis `http://localhost:4200` :

```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
```

### Token expiré

Si le token expire, l'intercepteur devrait rediriger vers `/login`. Vous pouvez améliorer cela en ajoutant une gestion d'erreur dans l'intercepteur.

### Erreur 401 (Unauthorized)

- Vérifiez que le token est bien stocké dans `localStorage`
- Vérifiez que le token n'a pas expiré
- Vérifiez que le header `Authorization` est bien envoyé

---

## 📝 Notes importantes

- Toutes les requêtes authentifiées nécessitent un token JWT valide
- Le token est automatiquement ajouté par l'intercepteur
- Les données sont isolées par utilisateur (userId) côté backend
- En cas d'erreur 401, l'utilisateur devrait être redirigé vers `/login`

