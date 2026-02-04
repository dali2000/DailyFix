const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist', 'daily-fix', 'browser');

// Vérifier que le build existe (créé par "npm run build" sur Render)
if (!fs.existsSync(distPath)) {
  console.error('Erreur: le dossier dist/daily-fix/browser n\'existe pas.');
  console.error('Exécutez d\'abord: npm run build -- --configuration production');
  process.exit(1);
}

app.use(express.static(distPath));

// SPA: toutes les routes renvoient index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log('Serveur démarré sur le port', port);
});
