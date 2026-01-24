# Configuration de l'authentification Google

## ✅ Vous avez déjà des Client ID OAuth 2.0 !

Si vous voyez des Client ID dans votre console Google Cloud, suivez ces étapes :

### Étape 1 : Choisir le bon Client ID

Utilisez celui de type **"Application Web"** (Web Application). Dans votre console, vous avez :
- "New Actions on Google App" (Application Web) - ID: `248580902178-vrt9...`
- "Web client (auto created by Google Service)" (Application Web) - ID: `248580902178-1151...`

**Recommandation** : Utilisez "New Actions on Google App" ou créez-en un nouveau spécifiquement pour DailyFix.

### Étape 2 : Copier le Client ID complet

1. Cliquez sur l'icône de copie (📋) à côté du Client ID
2. Ou cliquez sur le nom du Client ID pour voir les détails
3. Copiez le Client ID complet (il ressemble à : `248580902178-xxxxx.apps.googleusercontent.com`)

### Étape 3 : Vérifier les URI autorisés

Cliquez sur le crayon (✏️) pour éditer le Client ID et vérifier que ces URI sont configurés :

**Authorized JavaScript origins:**
- `http://localhost:4200` (pour le développement local)
- `https://votre-nom-utilisateur.github.io` (pour GitHub Pages si vous déployez)

**Authorized redirect URIs:**
- `http://localhost:4200` (pour le développement local)
- `https://votre-nom-utilisateur.github.io` (pour GitHub Pages si vous déployez)

### Étape 4 : Configurer dans le code

Ouvrez `src/app/components/login/login.component.ts` et trouvez la ligne 44 :
```typescript
private googleClientId: string = ''; // Exemple: '123456789-abc.apps.googleusercontent.com'
```

Remplacez par votre Client ID :
```typescript
private googleClientId: string = '248580902178-vrt9xxxxx.apps.googleusercontent.com';
```

---

## Créer un nouveau Client ID (si nécessaire)

1. **Aller sur Google Cloud Console**
   - Visitez https://console.cloud.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer ou sélectionner un projet**
   - Cliquez sur le sélecteur de projet en haut
   - Créez un nouveau projet ou sélectionnez un projet existant

3. **Activer l'API Google Identity Services**
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google Identity Services API"
   - Cliquez sur "Enable"

4. **Créer des identifiants OAuth 2.0**
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth client ID"
   - Si c'est la première fois, configurez l'écran de consentement OAuth
   - Sélectionnez "Web application" comme type d'application
   - Donnez un nom à votre application
   - Ajoutez les URI autorisés :
     - **Authorized JavaScript origins**: 
       - `http://localhost:4200` (pour le développement)
       - `https://votre-domaine.com` (pour la production)
     - **Authorized redirect URIs**:
       - `http://localhost:4200` (pour le développement)
       - `https://votre-domaine.com` (pour la production)

5. **Copier le Client ID**
   - Après la création, copiez le "Client ID"
   - Il ressemble à : `123456789-abc.apps.googleusercontent.com`

6. **Configurer dans l'application**
   - Ouvrez `src/app/components/login/login.component.ts`
   - Trouvez la ligne : `private googleClientId: string = '';`
   - Remplacez la chaîne vide par votre Client ID :
     ```typescript
     private googleClientId: string = 'VOTRE_CLIENT_ID.apps.googleusercontent.com';
     ```

## Test de l'authentification

Une fois le Client ID configuré :

1. Redémarrez l'application Angular
2. Allez sur la page d'inscription
3. Cliquez sur "Continuer avec Google"
4. Une fenêtre popup Google s'ouvrira pour vous connecter
5. Après la connexion, vous serez automatiquement inscrit/connecté

## Mode développement (sans Client ID)

Si vous n'avez pas encore de Client ID, l'application utilisera un mode simulation qui crée un utilisateur de test. Cela permet de tester le reste de l'application sans configuration Google.

## Notes importantes

- Le Client ID doit correspondre au domaine où l'application est hébergée
- Pour GitHub Pages, ajoutez l'URL de votre site GitHub Pages dans les URI autorisés
- Ne partagez jamais votre Client Secret publiquement
- Le Client ID peut être partagé publiquement (il est visible dans le code source)

