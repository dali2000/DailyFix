const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

// Social Event Model
const SocialEvent = sequelize.define('SocialEvent', {
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
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('birthday', 'anniversary', 'meeting', 'party', 'other'),
    defaultValue: 'other'
  },
  attendees: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminder: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'social_events',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Activity Suggestion Model
const ActivitySuggestion = sequelize.define('ActivitySuggestion', {
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
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('outdoor', 'indoor', 'cultural', 'sport', 'relaxation'),
    allowNull: false
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'activity_suggestions',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Define associations
SocialEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ActivitySuggestion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  SocialEvent,
  ActivitySuggestion
};
