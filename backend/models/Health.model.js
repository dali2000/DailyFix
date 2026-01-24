const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

// Meal Model
const Meal = sequelize.define('Meal', {
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
  type: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    allowNull: false
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'meals',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Physical Activity Model
const PhysicalActivity = sequelize.define('PhysicalActivity', {
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
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'physical_activities',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Sleep Record Model
const SleepRecord = sequelize.define('SleepRecord', {
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
    allowNull: false
  },
  sleepTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  wakeTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  quality: {
    type: DataTypes.ENUM('poor', 'fair', 'good', 'excellent'),
    defaultValue: 'good'
  },
  hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 24
    }
  }
}, {
  tableName: 'sleep_records',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Water Intake Model
const WaterIntake = sequelize.define('WaterIntake', {
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
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'water_intakes',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Meditation Session Model
const MeditationSession = sequelize.define('MeditationSession', {
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
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'meditation_sessions',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Define associations
Meal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PhysicalActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SleepRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WaterIntake.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MeditationSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  Meal,
  PhysicalActivity,
  SleepRecord,
  WaterIntake,
  MeditationSession
};
