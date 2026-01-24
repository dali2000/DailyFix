# Guide de Débogage - API Frontend/Backend

## Problèmes courants et solutions

### 1. Vérifier que le backend est démarré

```bash
cd backend
npm start
```

Le serveur doit afficher :
```
🚀 Server running on port 3000
📝 Environment: development
✅ MySQL Connected successfully
```

### 2. Vérifier que le frontend est démarré

```bash
npm start
```

Le serveur doit démarrer sur `http://localhost:4200`

### 3. Vérifier la console du navigateur

Ouvrez les outils de développement (F12) et regardez l'onglet **Console** et **Network**.

### 4. Erreurs courantes

#### Erreur: "Impossible de se connecter au serveur"
- **Cause**: Le backend n'est pas démarré ou n'écoute pas sur le bon port
- **Solution**: Vérifiez que le backend tourne sur le port 3000

#### Erreur: "CORS policy"
- **Cause**: Le backend bloque les requêtes depuis le frontend
- **Solution**: Vérifiez que `FRONTEND_URL` dans `.env` du backend correspond à l'URL du frontend

#### Erreur: "401 Unauthorized"
- **Cause**: Le token JWT est invalide ou expiré
- **Solution**: Déconnectez-vous et reconnectez-vous

#### Erreur: "404 Not Found"
- **Cause**: L'endpoint n'existe pas ou l'URL est incorrecte
- **Solution**: Vérifiez les logs du backend pour voir quelle route est appelée

### 5. Vérifier les logs

#### Frontend (Console du navigateur)
Tous les appels API sont maintenant loggés :
- `GET Request: http://localhost:3000/api/...`
- `POST Request: http://localhost:3000/api/...`
- `Error: ...`

#### Backend (Terminal)
Tous les appels sont loggés :
- `GET /api/...`
- `POST /api/...`
- `Error: ...`

### 6. Tester manuellement avec Postman

1. Importez la collection Postman : `backend/DailyFix_API.postman_collection.json`
2. Testez d'abord `/api/auth/register` ou `/api/auth/login`
3. Copiez le token retourné
4. Utilisez le token dans les autres endpoints

### 7. Vérifier la configuration

#### Frontend (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

#### Backend (`backend/.env`)
```env
PORT=3000
FRONTEND_URL=http://localhost:4200
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=dailyfix
JWT_SECRET=votre_secret_jwt
```

### 8. Vérifier que la base de données est accessible

```bash
cd backend
node scripts/create-tables.js
```

Si cela échoue, vérifiez vos credentials MySQL dans `.env`

### 9. Tester un endpoint simple

Dans la console du navigateur, testez :
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Cela doit retourner :
```json
{
  "status": "OK",
  "message": "DailyFix API is running"
}
```

### 10. Vérifier le token dans localStorage

Dans la console du navigateur :
```javascript
localStorage.getItem('dailyfix_token')
```

Si c'est `null`, vous n'êtes pas connecté.

### 11. Vérifier les headers HTTP

Dans l'onglet **Network** des outils de développement :
1. Cliquez sur une requête
2. Vérifiez l'onglet **Headers**
3. Vérifiez que `Authorization: Bearer <token>` est présent pour les requêtes authentifiées

## Checklist de débogage

- [ ] Backend démarré sur le port 3000
- [ ] Frontend démarré sur le port 4200
- [ ] Base de données MySQL accessible
- [ ] Tables créées dans la base de données
- [ ] `.env` du backend correctement configuré
- [ ] Token présent dans localStorage après connexion
- [ ] Headers `Authorization` présents dans les requêtes
- [ ] Pas d'erreurs CORS dans la console
- [ ] Logs visibles dans la console du navigateur
- [ ] Logs visibles dans le terminal du backend

## Commandes utiles

### Redémarrer le backend
```bash
cd backend
npm start
```

### Redémarrer le frontend
```bash
npm start
```

### Vérifier les processus en cours
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4200

# Linux/Mac
lsof -i :3000
lsof -i :4200
```

### Nettoyer et reconstruire
```bash
# Frontend
rm -rf node_modules dist
npm install
npm start

# Backend
cd backend
rm -rf node_modules
npm install
npm start
```

