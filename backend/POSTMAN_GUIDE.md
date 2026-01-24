# Guide Postman - Endpoints d'authentification

Guide complet pour tester les endpoints d'authentification sur Postman.

## 🔧 Configuration de base

### URL de base
```
http://localhost:3000
```

### Headers par défaut
Pour toutes les requêtes (sauf mention contraire) :
```
Content-Type: application/json
```

---

## 📝 1. Inscription (Register)

### Endpoint
```
POST http://localhost:3000/api/auth/register
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Exemple de requête complète dans Postman :
1. **Méthode** : `POST`
2. **URL** : `http://localhost:3000/api/auth/register`
3. **Headers** :
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body** (sélectionner `raw` et `JSON`) :
   ```json
   {
     "fullName": "John Doe",
     "email": "john.doe@example.com",
     "password": "password123"
   }
   ```

### Réponse attendue (Succès - 201)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "provider": "local"
  }
}
```

### Réponse attendue (Erreur - 400)
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

ou

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Full name must be at least 2 characters",
      "param": "fullName",
      "location": "body"
    }
  ]
}
```

---

## 🔐 2. Connexion (Login)

### Endpoint
```
POST http://localhost:3000/api/auth/login
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Exemple de requête complète dans Postman :
1. **Méthode** : `POST`
2. **URL** : `http://localhost:3000/api/auth/login`
3. **Headers** :
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body** (sélectionner `raw` et `JSON`) :
   ```json
   {
     "email": "john.doe@example.com",
     "password": "password123"
   }
   ```

### Réponse attendue (Succès - 200)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "provider": "local"
  }
}
```

### Réponse attendue (Erreur - 401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## 🔑 3. Obtenir l'utilisateur actuel (Get Current User)

### Endpoint
```
GET http://localhost:3000/api/auth/me
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

⚠️ **Important** : Remplacez `YOUR_JWT_TOKEN` par le token reçu lors de l'inscription ou de la connexion.

### Exemple de requête complète dans Postman :
1. **Méthode** : `GET`
2. **URL** : `http://localhost:3000/api/auth/me`
3. **Headers** :
   - Key: `Content-Type`
   - Value: `application/json`
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (votre token)

### Réponse attendue (Succès - 200)
```json
{
  "success": true,
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "provider": "local"
  }
}
```

### Réponse attendue (Erreur - 401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## 🌐 4. Connexion avec Google

### Endpoint
```
POST http://localhost:3000/api/auth/google
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "sub": "1234567890"
}
```

**Note** : Le champ `sub` est l'ID Google de l'utilisateur.

### Réponse attendue (Succès - 200)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john.doe@gmail.com",
    "provider": "google"
  }
}
```

---

## 📋 Collection Postman complète

### Variables d'environnement Postman

Créez un environnement dans Postman avec ces variables :

| Variable | Valeur initiale |
|----------|----------------|
| `base_url` | `http://localhost:3000` |
| `token` | (vide, sera rempli après login) |

### Utilisation des variables

- **URL** : `{{base_url}}/api/auth/register`
- **Authorization Header** : `Bearer {{token}}`

---

## 🧪 Scénario de test complet

### Étape 1 : Inscription
1. Créez un nouvel utilisateur avec `/api/auth/register`
2. Copiez le `token` de la réponse
3. Sauvegardez-le dans la variable `token` de Postman

### Étape 2 : Test avec le token
1. Utilisez le token pour accéder à `/api/auth/me`
2. Vérifiez que vous recevez les informations de l'utilisateur

### Étape 3 : Connexion
1. Testez la connexion avec `/api/auth/login`
2. Utilisez les mêmes identifiants que l'inscription
3. Vous devriez recevoir un nouveau token

### Étape 4 : Test d'erreur
1. Essayez de vous connecter avec un mauvais mot de passe
2. Essayez de créer un compte avec un email déjà utilisé

---

## ✅ Checklist de test

- [ ] Inscription réussie avec des données valides
- [ ] Erreur lors de l'inscription avec email existant
- [ ] Erreur lors de l'inscription avec données invalides
- [ ] Connexion réussie avec bonnes identifiants
- [ ] Erreur lors de la connexion avec mauvais mot de passe
- [ ] Erreur lors de la connexion avec email inexistant
- [ ] Accès à `/api/auth/me` avec token valide
- [ ] Erreur lors de l'accès à `/api/auth/me` sans token
- [ ] Erreur lors de l'accès à `/api/auth/me` avec token invalide

---

## 🔍 Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé avec succès (inscription) |
| 400 | Requête invalide (données manquantes ou invalides) |
| 401 | Non autorisé (mauvais identifiants ou token invalide) |
| 500 | Erreur serveur |

---

## 💡 Astuces Postman

### 1. Sauvegarder automatiquement le token

Dans l'onglet **Tests** de votre requête de login, ajoutez :

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

### 2. Pré-requête pour vérifier le serveur

Dans l'onglet **Pre-request Script** :

```javascript
pm.test("Server is running", function () {
    pm.expect(pm.environment.get("base_url")).to.not.be.undefined;
});
```

### 3. Tests automatiques

Dans l'onglet **Tests** de l'inscription :

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    pm.expect(jsonData.token).to.not.be.empty;
});

pm.test("Response has user data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('user');
    pm.expect(jsonData.user).to.have.property('id');
    pm.expect(jsonData.user).to.have.property('email');
});
```

---

## 🚨 Erreurs courantes

### "Cannot POST /api/auth/register"
- Vérifiez que le serveur est démarré (`npm run dev`)
- Vérifiez que l'URL est correcte

### "Connection refused"
- Vérifiez que MySQL est démarré
- Vérifiez les variables d'environnement dans `.env`

### "Not authorized"
- Vérifiez que le token est bien dans le header `Authorization`
- Vérifiez que le format est : `Bearer YOUR_TOKEN`
- Vérifiez que le token n'a pas expiré

### "User already exists"
- L'email est déjà utilisé, essayez avec un autre email

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur
2. Vérifiez que la base de données est accessible
3. Vérifiez que toutes les tables sont créées

