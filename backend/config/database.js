const { Sequelize } = require('sequelize');

// Debug: Log all DB-related environment variables
console.log('🔍 Environment variables check:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  DB_DIALECT: process.env.DB_DIALECT || 'NOT SET',
  DB_HOST: process.env.DB_HOST || 'NOT SET',
  DB_USER: process.env.DB_USER || 'NOT SET',
  DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
  DB_NAME: process.env.DB_NAME || 'NOT SET',
  DB_PORT: process.env.DB_PORT || 'NOT SET'
});

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
    
    // Ajouter les colonnes supplémentaires si elles n'existent pas
    await addRoleColumnIfNeeded();
    await addCurrencyColumnIfNeeded();
    await addThemeColumnIfNeeded();
    await addLocaleColumnIfNeeded();
    await addProfilePhotoColumnIfNeeded();
    await addHealthProfileColumnsIfNeeded();
    await addResetPasswordColumnsIfNeeded();
    await ensureExpenseCategoryAcceptsCustom();
    await addWalletCardIdColumnsIfNeeded();
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    process.exit(1);
  }
};

/** Add wallet_card_id to expenses and salaries for per-card stats, then create indexes. */
const addWalletCardIdColumnsIfNeeded = async () => {
  const dialect = sequelize.getDialect();
  const tables = ['expenses', 'salaries'];
  const column = 'wallet_card_id';
  for (const table of tables) {
    try {
      if (dialect === 'postgres') {
        await sequelize.query(
          `ALTER TABLE "${table}" ADD COLUMN "${column}" INTEGER NULL`
        );
        console.log(`✅ Column "${column}" added to ${table}`);
      } else if (dialect === 'mysql') {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` INT NULL`
        );
        console.log(`✅ Column "${column}" added to ${table}`);
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate column') || msg.includes('Duplicate column name')) {
        console.log(`✅ Column "${column}" already exists on ${table}`);
      } else {
        console.warn(`⚠️ Warning: Could not add ${column} to ${table}:`, msg);
      }
    }
  }
  // Create indexes on wallet_card_id (raw SQL so we use the real column name, not the attribute name)
  for (const table of tables) {
    try {
      const indexName = `${table}_wallet_card_id_idx`;
      if (dialect === 'postgres') {
        await sequelize.query(
          `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ("${column}")`
        );
        console.log(`✅ Index "${indexName}" on ${table}(${column})`);
      } else if (dialect === 'mysql') {
        await sequelize.query(
          `CREATE INDEX \`${indexName}\` ON \`${table}\` (\`${column}\`)`
        );
        console.log(`✅ Index "${indexName}" on ${table}(${column})`);
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`✅ Index on ${table}.${column} already exists`);
      } else {
        console.warn(`⚠️ Warning: Could not add index on ${table}.${column}:`, msg);
      }
    }
  }
};

/** Ensure expenses.category accepts any string (VARCHAR), not only ENUM values, so custom categories work. */
const ensureExpenseCategoryAcceptsCustom = async () => {
  try {
    const dialect = sequelize.getDialect();
    if (dialect === 'postgres') {
      const [rows] = await sequelize.query(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'category'
      `);
      if (rows.length === 0) return;
      const { data_type } = rows[0];
      const isVarchar = data_type === 'character varying';
      if (isVarchar) return;
      // Column is ENUM (USER-DEFINED) or other restricted type → allow any string for custom categories
      await sequelize.query(`
        ALTER TABLE expenses
        ALTER COLUMN category TYPE VARCHAR(100) USING category::text
      `);
      console.log('✅ expenses.category updated to VARCHAR(100) (custom categories allowed)');
    } else if (dialect === 'mysql') {
      const [rows] = await sequelize.query(`
        SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'category'
      `);
      if (rows.length === 0) return;
      const colType = (rows[0].COLUMN_TYPE || '').toLowerCase();
      if (colType.includes('enum(')) {
        await sequelize.query(`
          ALTER TABLE expenses MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'other'
        `);
        console.log('✅ expenses.category updated to VARCHAR(100) (custom categories allowed)');
      }
    }
  } catch (error) {
    if (error.message && (error.message.includes('does not exist') || error.message.includes("Unknown column"))) {
      return;
    }
    console.warn('⚠️ Warning: Could not ensure expense category column:', error.message);
  }
};

// Fonction pour ajouter la colonne role si elle n'existe pas
const addRoleColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();
    
    if (dialect === 'postgres') {
      // Vérifier si la colonne existe déjà (PostgreSQL)
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
      `);

      if (results.length > 0) {
        console.log('✅ Column "role" already exists');
        return;
      }

      // Créer le type ENUM s'il n'existe pas
      try {
        await sequelize.query(`CREATE TYPE user_role AS ENUM ('user', 'admin')`);
        console.log('✅ ENUM type user_role created');
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log('✅ ENUM type user_role already exists');
        } else {
          throw error;
        }
      }

      // Ajouter la colonne role
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN role user_role DEFAULT 'user'::user_role NOT NULL
      `);
      console.log('✅ Column "role" added successfully to users table');
    } else if (dialect === 'mysql') {
      // Vérifier si la colonne existe déjà (MySQL)
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
      `);

      if (results.length > 0) {
        console.log('✅ Column "role" already exists');
        return;
      }

      // Ajouter la colonne role
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' NOT NULL
      `);
      console.log('✅ Column "role" added successfully to users table');
    }
  } catch (error) {
    // Ne pas faire échouer le démarrage si la colonne existe déjà ou autre erreur mineure
    if (error.message && (
      error.message.includes('already exists') || 
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "role" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add role column:', error.message);
      // Ne pas faire échouer le démarrage, juste logger l'avertissement
    }
  }
};

// Fonction pour ajouter la colonne currency si elle n'existe pas
const addCurrencyColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      // Vérifier si la colonne existe déjà (PostgreSQL)
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'currency'
      `);

      if (results.length > 0) {
        console.log('✅ Column "currency" already exists');
        return;
      }

      // Ajouter la colonne currency
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'EUR' NOT NULL
      `);
      console.log('✅ Column "currency" added successfully to users table');
    } else if (dialect === 'mysql') {
      // Vérifier si la colonne existe déjà (MySQL)
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'currency'
      `);

      if (results.length > 0) {
        console.log('✅ Column "currency" already exists');
        return;
      }

      // Ajouter la colonne currency
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'EUR' NOT NULL
      `);
      console.log('✅ Column "currency" added successfully to users table');
    }
  } catch (error) {
    // Ne pas faire échouer le démarrage si la colonne existe déjà ou autre erreur mineure
    if (error.message && (
      error.message.includes('already exists') || 
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "currency" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add currency column:', error.message);
      // Ne pas faire échouer le démarrage, juste logger l'avertissement
    }
  }
};

// Fonction pour ajouter la colonne theme si elle n'existe pas
const addThemeColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'theme'
      `);

      if (results.length > 0) {
        console.log('✅ Column "theme" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN theme VARCHAR(20) DEFAULT 'light' NOT NULL
      `);
      console.log('✅ Column "theme" added successfully to users table');
    } else if (dialect === 'mysql') {
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'theme'
      `);

      if (results.length > 0) {
        console.log('✅ Column "theme" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN theme VARCHAR(20) DEFAULT 'light' NOT NULL
      `);
      console.log('✅ Column "theme" added successfully to users table');
    }
  } catch (error) {
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "theme" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add theme column:', error.message);
    }
  }
};

// Fonction pour ajouter la colonne locale si elle n'existe pas
const addLocaleColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'locale'
      `);

      if (results.length > 0) {
        console.log('✅ Column "locale" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN locale VARCHAR(10) DEFAULT 'fr' NOT NULL
      `);
      console.log('✅ Column "locale" added successfully to users table');
    } else if (dialect === 'mysql') {
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'locale'
      `);

      if (results.length > 0) {
        console.log('✅ Column "locale" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN locale VARCHAR(10) DEFAULT 'fr' NOT NULL
      `);
      console.log('✅ Column "locale" added successfully to users table');
    }
  } catch (error) {
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "locale" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add locale column:', error.message);
    }
  }
};

// Fonction pour ajouter la colonne profilePhoto si elle n'existe pas
const addProfilePhotoColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_photo'
      `);

      if (results.length > 0) {
        console.log('✅ Column "profile_photo" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN profile_photo TEXT
      `);
      console.log('✅ Column "profile_photo" added successfully to users table');
    } else if (dialect === 'mysql') {
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'profile_photo'
      `);

      if (results.length > 0) {
        console.log('✅ Column "profile_photo" already exists');
        return;
      }

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN profile_photo TEXT
      `);
      console.log('✅ Column "profile_photo" added successfully to users table');
    }
  } catch (error) {
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "profile_photo" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add profile_photo column:', error.message);
    }
  }
};

// Colonnes profil santé (taille, poids, genre) pour conseils personnalisés
const addHealthProfileColumnsIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();
    const columns = [
      { name: 'height', type: 'DECIMAL(5,2)', pgType: 'DECIMAL(5,2)' },
      { name: 'weight', type: 'DECIMAL(5,2)', pgType: 'DECIMAL(5,2)' },
      { name: 'gender', type: 'VARCHAR(20)', pgType: 'VARCHAR(20)' }
    ];
    for (const col of columns) {
      if (dialect === 'postgres') {
        const [results] = await sequelize.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = '${col.name}'
        `);
        if (results.length > 0) continue;
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.pgType}`);
        console.log(`✅ Column "${col.name}" added to users table`);
      } else if (dialect === 'mysql') {
        const [results] = await sequelize.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = '${col.name}'
        `);
        if (results.length > 0) continue;
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Column "${col.name}" added to users table`);
      }
    }
  } catch (error) {
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate column') || error.message.includes('Duplicate column name'))) {
      console.log('✅ Health profile columns already exist');
    } else {
      console.warn('⚠️ Warning: Could not add health profile columns:', error.message);
    }
  }
};

// Colonnes pour réinitialisation mot de passe
const addResetPasswordColumnsIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      const [tokenExists] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_password_token'
      `);
      if (tokenExists.length > 0) {
        console.log('✅ Column "reset_password_token" already exists');
        return;
      }
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN reset_password_token VARCHAR(64),
        ADD COLUMN reset_password_expires TIMESTAMP
      `);
      console.log('✅ Reset password columns added to users table');
    } else if (dialect === 'mysql') {
      const [tokenExists] = await sequelize.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_password_token'
      `);
      if (tokenExists.length > 0) {
        console.log('✅ Column "reset_password_token" already exists');
        return;
      }
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN reset_password_token VARCHAR(64) NULL,
        ADD COLUMN reset_password_expires DATETIME NULL
      `);
      console.log('✅ Reset password columns added to users table');
    }
  } catch (error) {
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Reset password columns already exist');
    } else {
      console.warn('⚠️ Warning: Could not add reset password columns:', error.message);
    }
  }
};

module.exports = { sequelize, connectDB };