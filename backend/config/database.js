const { Sequelize } = require('sequelize');

// FORCER PostgreSQL si on est sur Render (production) ou si DB_DIALECT est défini
// En production sur Render, on utilise TOUJOURS PostgreSQL
let dbDialect = process.env.DB_DIALECT;

// Si DB_DIALECT n'est pas défini, forcer PostgreSQL en production
if (!dbDialect) {
  // Si on est en production, forcer PostgreSQL
  if (process.env.NODE_ENV === 'production') {
    dbDialect = 'postgres';
    console.log('🔍 Production mode: Forcing PostgreSQL');
  }
  // Détection par host (si contient postgres ou render.com)
  else if (process.env.DB_HOST && (
    process.env.DB_HOST.includes('postgres') || 
    process.env.DB_HOST.includes('render.com') ||
    process.env.DB_HOST.includes('oregon-postgres')
  )) {
    dbDialect = 'postgres';
    console.log('🔍 Auto-detected PostgreSQL from DB_HOST:', process.env.DB_HOST);
  } 
  // Détection par port
  else {
    const port = process.env.DB_PORT;
    if (port === '5432' || port === 5432) {
      dbDialect = 'postgres';
      console.log('🔍 Auto-detected PostgreSQL from DB_PORT:', port);
    } 
    // Par défaut MySQL (seulement en développement)
    else {
      dbDialect = 'mysql';
      console.log('⚠️ Using MySQL as default (development mode)');
    }
  }
} else {
  console.log('✅ Using DB_DIALECT:', dbDialect);
}

// Log de débogage (toujours affiché pour aider au dépannage)
console.log('🔍 Database configuration:', {
  NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  DB_DIALECT: process.env.DB_DIALECT || 'NOT SET',
  DB_PORT: process.env.DB_PORT || 'NOT SET',
  DB_HOST: process.env.DB_HOST || 'NOT SET',
  detected_dialect: dbDialect
});

const defaultPort = dbDialect === 'postgres' ? 5432 : 3306;
const defaultUser = dbDialect === 'postgres' ? 'dailyfix_user' : 'root';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'dailyfix',
  process.env.DB_USER || defaultUser,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || defaultPort,
    dialect: dbDialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configuration spécifique pour PostgreSQL
    ...(dbDialect === 'postgres' && {
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    })
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const dbType = dbDialect === 'postgres' ? 'PostgreSQL' : 'MySQL';
    console.log(`✅ ${dbType} Connected successfully`);
    
    // Sync models (create tables if they don't exist)
    // En production, on crée les tables automatiquement si elles n'existent pas
    // Cela permet de déployer sans avoir accès au Shell (plan gratuit Render)
    const syncOptions = { 
      alter: false,  // Ne modifie pas les tables existantes
      force: false   // Ne supprime pas les tables existantes
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database models synchronized (tables created if needed)');
  } catch (error) {
    const dbType = dbDialect === 'postgres' ? 'PostgreSQL' : 'MySQL';
    console.error(`❌ ${dbType} connection error:`, error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

