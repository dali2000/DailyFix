const { Sequelize } = require('sequelize');

// Si DATABASE_URL est définie, l'utiliser directement (priorité)
let sequelize;

if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL for connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Code existant avec variables individuelles...
  let dbDialect = process.env.DB_DIALECT;
  
  if (!dbDialect) {
    if (process.env.NODE_ENV === 'production') {
      dbDialect = 'postgres';
      console.log('🔍 Production mode: Forcing PostgreSQL');
    } else if (process.env.DB_HOST && (
      process.env.DB_HOST.includes('postgres') || 
      process.env.DB_HOST.includes('render.com') ||
      process.env.DB_HOST.includes('oregon-postgres')
    )) {
      dbDialect = 'postgres';
      console.log('🔍 Auto-detected PostgreSQL from DB_HOST:', process.env.DB_HOST);
    } else {
      const port = process.env.DB_PORT;
      if (port === '5432' || port === 5432) {
        dbDialect = 'postgres';
        console.log('🔍 Auto-detected PostgreSQL from DB_PORT:', port);
      } else {
        dbDialect = 'mysql';
        console.log('⚠️ Using MySQL as default (development mode)');
      }
    }
  } else {
    console.log('✅ Using DB_DIALECT:', dbDialect);
  }

  console.log('🔍 Database configuration:', {
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    DB_DIALECT: process.env.DB_DIALECT || 'NOT SET',
    DB_PORT: process.env.DB_PORT || 'NOT SET',
    DB_HOST: process.env.DB_HOST || 'NOT SET',
    detected_dialect: dbDialect
  });

  const defaultPort = dbDialect === 'postgres' ? 5432 : 3306;
  const defaultUser = dbDialect === 'postgres' ? 'dailyfix_user' : 'root';

  sequelize = new Sequelize(
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
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected successfully');
    
    const syncOptions = { 
      alter: false,
      force: false
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database models synchronized (tables created if needed)');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };