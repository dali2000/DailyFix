const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

// Journal Entry Model
const JournalEntry = sequelize.define('JournalEntry', {
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
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mood: {
    type: DataTypes.ENUM('very-happy', 'happy', 'neutral', 'sad', 'very-sad'),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'journal_entries',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Personal Goal Model
const PersonalGoal = sequelize.define('PersonalGoal', {
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
  targetDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: DataTypes.ENUM('health', 'career', 'personal', 'financial', 'other'),
    allowNull: false
  },
  milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'personal_goals',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Stress Management Model
const StressManagement = sequelize.define('StressManagement', {
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
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  stressLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  triggers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  copingStrategies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'stress_management',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Define associations
JournalEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PersonalGoal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
StressManagement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  JournalEntry,
  PersonalGoal,
  StressManagement
};
