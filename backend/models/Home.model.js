const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

// Shopping List Model
const ShoppingList = sequelize.define('ShoppingList', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'shopping_lists',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Household Task Model
const HouseholdTask = sequelize.define('HouseholdTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'one-time'),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastCompleted: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'household_tasks',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Define associations
ShoppingList.belongsTo(User, { foreignKey: 'userId', as: 'user' });
HouseholdTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  ShoppingList,
  HouseholdTask
};
