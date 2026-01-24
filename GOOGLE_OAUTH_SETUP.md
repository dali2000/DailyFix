# Configuration Google OAuth pour DailyFix

## Problème : Erreur GSI_LOGGER

Si vous voyez l'erreur :
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

Cela signifie que l'origine de votre application (ex: `http://localhost:4200`) n'est pas autorisée dans la console Google Cloud.

## Solution : Configurer les origines autorisées

### 1. Accéder à la Console Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un nouveau)
3. Allez dans **APIs & Services** > **Credentials**

### 2. Configurer le Client ID OAuth 2.0

1. Trouvez votre **OAuth 2.0 Client ID** (celui utilisé dans `login.component.ts`)
2. Cliquez sur le nom du client ID pour l'éditer
3. Dans la section **Authorized JavaScript origins**, ajoutez :
   - `http://localhost:4200` (pour le développement local)
   - `http://localhost:3000` (si vous testez directement)
   - Votre URL de production (ex: `https://votre-domaine.com`)

4. Dans la section **Authorized redirect URIs**, ajoutez :
   - `http://localhost:4200` (pour le développement local)
   - Votre URL de production si nécessaire

5. Cliquez sur **Save**

### 3. Vérifier le Client ID dans le code

Le Client ID est défini dans `src/app/components/login/login.component.ts` :

```typescript
private googleClientId: string = '248580902178-3s8374jnjcm4o3g0k2oi98md1sl9r7av.apps.googleusercontent.com';
```

Assurez-vous que ce Client ID correspond à celui dans la console Google Cloud.

### 4. Redémarrer l'application

Après avoir modifié les origines autorisées :
1. Redémarrez votre serveur de développement Angular
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Réessayez la connexion Google

## Vérification du backend

Le backend est configuré pour accepter les requêtes Google OAuth via la route `/api/auth/google`.

### Endpoint backend

- **URL**: `POST http://localhost:3000/api/auth/google`
- **Body**:
  ```json
  {
    "name": "Nom de l'utilisateur",
    "email": "email@example.com",
    "sub": "Google ID (sub)"
  }
  ```

### Erreurs possibles

1. **Erreur 500**: Vérifiez les logs du serveur backend pour plus de détails
2. **Erreur de validation**: Assurez-vous que `name`, `email`, et `sub` sont fournis
3. **Erreur de base de données**: Vérifiez que la table `users` existe et que les colonnes `googleId` et `provider` sont présentes

## Test

1. Démarrez le backend : `cd backend && npm start`
2. Démarrez le frontend : `ng serve`
3. Allez sur la page de connexion
4. Cliquez sur "Se connecter avec Google"
5. Autorisez l'application dans la popup Google
6. Vous devriez être redirigé vers `/home` après connexion réussie

## Notes importantes

- Les origines autorisées doivent correspondre **exactement** à l'URL de votre application (y compris le protocole `http://` ou `https://`)
- Pour la production, utilisez `https://` et ajoutez votre domaine complet
- Le Client ID doit être le même dans la console Google et dans le code

