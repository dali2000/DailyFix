const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { admin } = require('../middleware/admin.middleware');
const User = require('../models/User.model');
const Task = require('../models/Task.model');
const Event = require('../models/Event.model');
const { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } = require('../models/Health.model');
const { Expense, Budget, SavingsGoal, Salary } = require('../models/Finance.model');
const { ShoppingList, HouseholdTask } = require('../models/Home.model');
const { JournalEntry, PersonalGoal, StressManagement } = require('../models/Wellness.model');
const { SocialEvent, ActivitySuggestion } = require('../models/Social.model');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// ==================== STATISTICS ====================

// Helper function to safely count with fallback
const safeCount = async (Model, fallback = 0) => {
  try {
    if (!Model) {
      console.warn('Model is undefined');
      return fallback;
    }
    // Vérifier si le modèle a une méthode count
    if (typeof Model.count !== 'function') {
      console.warn(`Model ${Model.name || 'unknown'} does not have count method`);
      return fallback;
    }
    return await Model.count();
  } catch (error) {
    // Ignorer les erreurs de table inexistante
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('doesn\'t exist')) {
      console.warn(`Table for ${Model?.name || 'model'} doesn't exist yet`);
      return fallback;
    }
    console.warn(`Error counting ${Model?.name || 'model'}:`, error.message);
    return fallback;
  }
};

// Helper function to safely count with where clause
const safeCountWhere = async (Model, where, fallback = 0) => {
  try {
    if (!Model) {
      console.warn('Model is undefined');
      return fallback;
    }
    if (typeof Model.count !== 'function') {
      console.warn(`Model ${Model.name || 'unknown'} does not have count method`);
      return fallback;
    }
    return await Model.count({ where });
  } catch (error) {
    // Ignorer les erreurs de table inexistante
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('doesn\'t exist')) {
      console.warn(`Table for ${Model?.name || 'model'} doesn't exist yet`);
      return fallback;
    }
    console.warn(`Error counting ${Model?.name || 'model'} with where:`, error.message);
    return fallback;
  }
};

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await safeCount(User);
    const newUsersThisMonth = await safeCountWhere(User, {
      createdAt: { [Op.gte]: startOfMonth }
    });
    const newUsersThisWeek = await safeCountWhere(User, {
      createdAt: { [Op.gte]: startOfWeek }
    });
    const activeUsers = await safeCountWhere(User, {
      updatedAt: { [Op.gte]: startOfWeek }
    });

    // Task statistics
    const totalTasks = await safeCount(Task);
    const completedTasks = await safeCountWhere(Task, { completed: true });
    const pendingTasks = await safeCountWhere(Task, { completed: false });

    // Event statistics
    const totalEvents = await safeCount(Event);
    const upcomingEvents = await safeCountWhere(Event, {
      date: { [Op.gte]: new Date() }
    });

    // Health statistics
    const totalMeals = await safeCount(Meal);
    const totalActivities = await safeCount(PhysicalActivity);
    const totalSleepRecords = await safeCount(SleepRecord);

    // Finance statistics
    const totalExpenses = await safeCount(Expense);
    const totalBudgets = await safeCount(Budget);
    const totalSavingsGoals = await safeCount(SavingsGoal);

    // Wellness statistics
    const totalJournalEntries = await safeCount(JournalEntry);
    const totalPersonalGoals = await safeCount(PersonalGoal);

    // Social statistics
    const totalSocialEvents = await safeCount(SocialEvent);

    // Recent activity (last 7 days)
    let recentUsers = [];
    try {
      recentUsers = await User.findAll({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo }
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'fullName', 'email', 'role', 'provider', 'createdAt']
      });
    } catch (error) {
      console.warn('Error fetching recent users:', error.message);
      recentUsers = [];
    }

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          newThisWeek: newUsersThisWeek,
          active: activeUsers,
          recent: recentUsers
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents
        },
        health: {
          meals: totalMeals,
          activities: totalActivities,
          sleepRecords: totalSleepRecords
        },
        finance: {
          expenses: totalExpenses,
          budgets: totalBudgets,
          savingsGoals: totalSavingsGoals
        },
        wellness: {
          journalEntries: totalJournalEntries,
          personalGoals: totalPersonalGoals
        },
        social: {
          events: totalSocialEvents
        }
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from removing their own admin role
    if (req.user.id === parseInt(req.params.id) && role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'You cannot remove your own admin privileges'
      });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (and all related data to avoid foreign key errors)
router.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (Number.isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  try {
    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { sequelize } = require('../config/database');
    const whereUser = { where: { userId } };

    await sequelize.transaction(async (transaction) => {
      // Delete in order: tables that reference the user
      await Task.destroy({ ...whereUser, transaction });
      await Event.destroy({ ...whereUser, transaction });
      await Meal.destroy({ ...whereUser, transaction });
      await PhysicalActivity.destroy({ ...whereUser, transaction });
      await SleepRecord.destroy({ ...whereUser, transaction });
      await WaterIntake.destroy({ ...whereUser, transaction });
      await MeditationSession.destroy({ ...whereUser, transaction });
      await Expense.destroy({ ...whereUser, transaction });
      await Budget.destroy({ ...whereUser, transaction });
      await SavingsGoal.destroy({ ...whereUser, transaction });
      await Salary.destroy({ ...whereUser, transaction });
      await ShoppingList.destroy({ ...whereUser, transaction });
      await HouseholdTask.destroy({ ...whereUser, transaction });
      await JournalEntry.destroy({ ...whereUser, transaction });
      await PersonalGoal.destroy({ ...whereUser, transaction });
      await StressManagement.destroy({ ...whereUser, transaction });
      await SocialEvent.destroy({ ...whereUser, transaction });
      await ActivitySuggestion.destroy({ ...whereUser, transaction });
      await user.destroy({ transaction });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Create user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName and email'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password: password || null,
      role: role || 'user',
      provider: password ? 'local' : 'google'
    });

    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

module.exports = router;

