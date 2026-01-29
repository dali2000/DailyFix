/** En prod, utilisez un proxy backend pour Gemini ou définissez la clé au build (ne commitez jamais la clé). */
export const environment = {
  production: true,
  apiUrl: 'https://dailyfix-backend.onrender.com/api',
  geminiApiKey: ''
};

