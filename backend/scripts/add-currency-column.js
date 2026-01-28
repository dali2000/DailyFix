require('dotenv').config();
const { sequelize } = require('../config/database');

const addCurrencyColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const dialect = sequelize.getDialect();
    console.log(`📊 Database dialect: ${dialect}`);

    let columnExists = false;
    let addColumnQuery = '';

    if (dialect === 'mysql') {
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'currency'
      `);
      if (results.length > 0) columnExists = true;
      addColumnQuery = `ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'EUR' NOT NULL`;
    } else if (dialect === 'postgres') {
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'currency'
      `);
      if (results.length > 0) columnExists = true;
      addColumnQuery = `ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR' NOT NULL`;
    }

    if (columnExists) {
      console.log('✅ Column "currency" already exists');
      process.exit(0);
    }

    await sequelize.query(addColumnQuery);
    console.log('✅ Column "currency" added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding currency column:', error);
    process.exit(1);
  }
};

addCurrencyColumn();
