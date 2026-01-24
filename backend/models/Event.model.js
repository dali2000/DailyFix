const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

const Event = sequelize.define('Event', {
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
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('task', 'event', 'reminder'),
    defaultValue: 'event'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3b82f6'
  }
}, {
  tableName: 'events',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'startDate'] },
    { fields: ['userId', 'type'] }
  ]
});

// Define associations
Event.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Event;
