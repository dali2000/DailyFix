require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User.model');
const Task = require('../models/Task.model');
const Event = require('../models/Event.model');
const { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } = require('../models/Health.model');
const { Expense, Budget, SavingsGoal, Salary } = require('../models/Finance.model');
const { ShoppingList, HouseholdTask } = require('../models/Home.model');
const { JournalEntry, PersonalGoal, StressManagement } = require('../models/Wellness.model');
const { SocialEvent, ActivitySuggestion } = require('../models/Social.model');

const createTables = async () => {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Sync all models (create tables if they don't exist)
    // Use { force: false } to not drop existing tables
    // Use { alter: false } to not alter existing tables
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ All tables created successfully!');
    
    // Ajouter la colonne role si elle n'existe pas
    await addRoleColumnIfNeeded();
    
    console.log('\n📋 Created tables:');
    console.log('  - users');
    console.log('  - tasks');
    console.log('  - events');
    console.log('  - meals');
    console.log('  - physical_activities');
    console.log('  - sleep_records');
    console.log('  - water_intakes');
    console.log('  - meditation_sessions');
    console.log('  - expenses');
    console.log('  - budgets');
    console.log('  - savings_goals');
    console.log('  - salaries');
    console.log('  - shopping_lists');
    console.log('  - household_tasks');
    console.log('  - journal_entries');
    console.log('  - personal_goals');
    console.log('  - stress_management');
    console.log('  - social_events');
    console.log('  - activity_suggestions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};

// Fonction pour ajouter la colonne role si elle n'existe pas
const addRoleColumnIfNeeded = async () => {
  try {
    const dialect = sequelize.getDialect();
    console.log(`📊 Database dialect: ${dialect}`);
    
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
    // Ne pas faire échouer le script si la colonne existe déjà
    if (error.message && (
      error.message.includes('already exists') || 
      error.message.includes('duplicate column') ||
      error.message.includes('Duplicate column name')
    )) {
      console.log('✅ Column "role" already exists (or similar column)');
    } else {
      console.warn('⚠️ Warning: Could not add role column:', error.message);
      // Ne pas faire échouer le script, juste logger l'avertissement
    }
  }
};

// Run the script
createTables();

