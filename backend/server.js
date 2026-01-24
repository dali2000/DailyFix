// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();

// Middleware CORS
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    
    // En production, définir les origines autorisées
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:4200',
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'https://dali2000.github.io' // Frontend GitHub Pages
    ];
    
    // Si pas d'origine (requêtes depuis le même serveur ou outils comme Postman), autoriser
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Vérifier si l'origine est autorisée (correspondance exacte ou commence par l'URL autorisée)
    const isAllowed = allowedOrigins.some(allowed => {
      // Nettoyer les URLs (enlever les trailing slashes)
      const cleanOrigin = origin.replace(/\/$/, '');
      const cleanAllowed = allowed.replace(/\/$/, '');
      return cleanOrigin === cleanAllowed || cleanOrigin.startsWith(cleanAllowed);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware pour le développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/health', require('./routes/health.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/home', require('./routes/home.routes'));
app.use('/api/wellness', require('./routes/wellness.routes'));
app.use('/api/social', require('./routes/social.routes'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DailyFix API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DailyFix API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Connect to MySQL and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

