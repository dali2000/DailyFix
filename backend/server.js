// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();

// Middleware CORS - Configuration améliorée
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://dali2000.github.io' // Frontend GitHub Pages
];

const corsOptions = {
  origin: function (origin, callback) {
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    
    // Si pas d'origine (requêtes depuis le même serveur ou outils comme Postman), autoriser
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Nettoyer l'origine (enlever les trailing slashes et normaliser)
    const cleanOrigin = origin.replace(/\/$/, '').toLowerCase();
    
    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.some(allowed => {
      const cleanAllowed = allowed.replace(/\/$/, '').toLowerCase();
      return cleanOrigin === cleanAllowed || cleanOrigin.startsWith(cleanAllowed);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      console.log('🔍 FRONTEND_URL env:', process.env.FRONTEND_URL);
      // En production, bloquer les origines non autorisées
      // En développement, autoriser pour faciliter le débogage
      if (process.env.NODE_ENV === 'production') {
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      } else {
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight pour 24 heures
};

// Appliquer CORS à toutes les routes
app.use(cors(corsOptions));

// Middleware pour gérer explicitement les requêtes OPTIONS (preflight)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
  }
  next();
});
// Limite augmentée pour permettre l'envoi de la photo de profil en base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware pour le développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Load all models to ensure they are registered with Sequelize
require('./models/User.model');
require('./models/Task.model');
require('./models/Event.model');
require('./models/Health.model');
require('./models/Finance.model');
require('./models/Home.model');
require('./models/Wellness.model');
require('./models/Social.model');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/health', require('./routes/health.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/home', require('./routes/home.routes'));
app.use('/api/wellness', require('./routes/wellness.routes'));
app.use('/api/social', require('./routes/social.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

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

