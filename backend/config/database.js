const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'dailyfix',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');
    
    // Sync models (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Use { force: true } to drop and recreate tables
      console.log('✅ Database models synchronized');
    }
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

