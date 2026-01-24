# Guide de démarrage rapide - Frontend + Backend

## 🚀 Démarrage complet

### 1. Démarrer le Backend

```bash
cd backend
npm install
npm run dev
```

Le backend sera accessible sur `http://localhost:3000`

### 2. Démarrer le Frontend

Dans un nouveau terminal :

```bash
npm install
npm start
```

Le frontend sera accessible sur `http://localhost:4200`

---

## ✅ Vérification

1. **Backend** : Ouvrez `http://localhost:3000/api/health`
   - Devrait retourner : `{"status":"OK","message":"DailyFix API is running"}`

2. **Frontend** : Ouvrez `http://localhost:4200`
   - La page de login devrait s'afficher

3. **Test d'inscription** :
   - Créez un compte via le formulaire
   - Vous devriez être redirigé vers `/home` après inscription

---

## 🔧 Configuration requise

### Backend
- ✅ Fichier `.env` créé dans `backend/`
- ✅ `JWT_SECRET` défini dans `.env`
- ✅ Base de données MySQL créée
- ✅ Tables créées (`npm run create-tables`)

### Frontend
- ✅ `HttpClient` configuré dans `app.config.ts`
- ✅ Intercepteur d'authentification configuré
- ✅ Service API créé
- ✅ `AuthService` mis à jour pour utiliser le backend

---

## 📝 Fichiers importants

### Backend
- `backend/.env` - Variables d'environnement
- `backend/server.js` - Serveur Express
- `backend/routes/auth.routes.js` - Routes d'authentification

### Frontend
- `src/environments/environment.ts` - URL de l'API
- `src/app/services/api.service.ts` - Service HTTP générique
- `src/app/services/auth.service.ts` - Service d'authentification
- `src/app/interceptors/auth.interceptor.ts` - Intercepteur JWT

---

## 🐛 Problèmes courants

### Erreur CORS
Vérifiez que le backend autorise les requêtes depuis `http://localhost:4200`

### Erreur 401
- Vérifiez que le token est bien stocké dans `localStorage`
- Vérifiez que `JWT_SECRET` est défini dans `.env`

### Erreur de connexion MySQL
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`

---

## 📚 Documentation

- `FRONTEND_BACKEND_INTEGRATION.md` - Guide d'intégration complet
- `backend/POSTMAN_GUIDE.md` - Guide pour tester avec Postman
- `backend/README.md` - Documentation du backend

