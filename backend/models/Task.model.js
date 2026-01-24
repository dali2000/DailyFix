const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

const Task = sequelize.define('Task', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('lowest', 'low', 'medium', 'high', 'highest'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('todo', 'in-progress', 'in-review', 'done'),
    defaultValue: 'todo'
  },
  assignee: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reporter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  labels: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  storyPoints: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminder: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'status'] },
    { fields: ['userId', 'dueDate'] }
  ]
});

// Define associations
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Task;
