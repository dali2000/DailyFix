require('dotenv').config();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const addRoleColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const dialect = sequelize.getDialect();
    console.log(`📊 Database dialect: ${dialect}`);

    let columnExists = false;
    let addColumnQuery = '';

    if (dialect === 'mysql') {
      // Vérifier si la colonne existe déjà (MySQL)
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
      `);

      if (results.length > 0) {
        columnExists = true;
      }

      // Ajouter la colonne role (MySQL)
      addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' NOT NULL
      `;
    } else if (dialect === 'postgres') {
      // Vérifier si la colonne existe déjà (PostgreSQL)
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
      `);

      if (results.length > 0) {
        columnExists = true;
      }

      // Créer le type ENUM s'il n'existe pas (PostgreSQL)
      try {
        await sequelize.query(`CREATE TYPE user_role AS ENUM ('user', 'admin')`);
        console.log('✅ ENUM type created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ ENUM type already exists');
        } else {
          throw error;
        }
      }

      // Ajouter la colonne role (PostgreSQL)
      addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN role user_role DEFAULT 'user'::user_role NOT NULL
      `;
    }

    if (columnExists) {
      console.log('✅ Column "role" already exists');
      process.exit(0);
    }

    // Ajouter la colonne
    await sequelize.query(addColumnQuery);

    console.log('✅ Column "role" added successfully');
    console.log('✅ All existing users have been set to role "user"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding role column:', error);
    process.exit(1);
  }
};

addRoleColumn();

