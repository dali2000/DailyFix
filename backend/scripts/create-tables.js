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
    // Use { alter: true } to update existing tables
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ All tables created successfully!');
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

// Run the script
createTables();

