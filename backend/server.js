const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser toutes les origines en développement, ou seulement l'URL configurée en production
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:4200',
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ];
    
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

