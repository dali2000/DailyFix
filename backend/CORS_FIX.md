# Correction CORS - Frontend GitHub Pages

## ✅ Corrections Apportées

J'ai corrigé la configuration CORS dans `backend/server.js` pour :

1. **Mieux gérer les requêtes preflight (OPTIONS)**
2. **Autoriser explicitement `https://dali2000.github.io`**
3. **Gérer les URLs avec/sans trailing slash**
4. **Ajouter plus de headers autorisés**

## 📋 Variables d'Environnement dans Render

Assurez-vous que dans Render > Environment Variables, vous avez :

```
FRONTEND_URL=https://dali2000.github.io
```

**Important :**
- Sans le chemin `/DailyFix/`
- Sans trailing slash (pas de `/` à la fin)
- Exactement : `https://dali2000.github.io`

## 🔄 Après Modification

1. **Commitez et poussez les changements** :
   ```bash
   git add backend/server.js
   git commit -m "Fix CORS configuration for GitHub Pages"
   git push
   ```

2. **Render redéploiera automatiquement**

3. **Vérifiez les logs** - vous ne devriez plus voir "CORS blocked"

4. **Testez depuis le frontend** - les requêtes devraient fonctionner

## 🆘 Si ça ne fonctionne toujours pas

### Vérifier dans les logs du backend

Si vous voyez encore "CORS blocked origin", vérifiez :
- L'origine exacte dans le message d'erreur
- Que `FRONTEND_URL` est bien défini dans Render
- Que l'URL correspond exactement (sans trailing slash)

### Vérifier dans la console du navigateur

L'erreur devrait disparaître. Si elle persiste :
- Videz le cache du navigateur
- Testez en navigation privée
- Vérifiez que l'URL du frontend est bien `https://dali2000.github.io`

## ✅ Test

Après redéploiement, testez la connexion depuis le frontend. L'erreur CORS devrait être résolue.

