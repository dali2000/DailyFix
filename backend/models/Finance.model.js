const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

// Expense Model
const Expense = sequelize.define('Expense', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  walletCardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'wallet_card_id',
    comment: 'Card used for this expense; null = before multi-card or unset'
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
  // No index on walletCardId: Sequelize would use attribute name "walletCardId" but column is "wallet_card_id"
});

// Budget Model
const Budget = sequelize.define('Budget', {
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
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  limit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  period: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: false
  },
  spent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Savings Goal Model
const SavingsGoal = sequelize.define('SavingsGoal', {
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
  targetAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'savings_goals',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Salary Model
const Salary = sequelize.define('Salary', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  period: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  walletCardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'wallet_card_id',
    comment: 'Card/account that received this salary; null = before multi-card or unset'
  }
}, {
  tableName: 'salaries',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
  // No index on walletCardId: Sequelize would use attribute name "walletCardId" but column is "wallet_card_id"
});

// Expense Category (catégories personnalisées par utilisateur)
const ExpenseCategory = sequelize.define('ExpenseCategory', {
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
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'expense_categories',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { unique: true, fields: ['userId', 'name'] }
  ]
});

// Wallet Card Model (user's bank cards for wallet display)
const WalletCard = sequelize.define('WalletCard', {
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
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Friendly name for the card e.g. Carte perso, Carte pro'
  },
  holderName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cardNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Display number e.g. 4532 1234 5678 9010'
  },
  expiryDate: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'MM/YY'
  },
  rib: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Currency for this card e.g. EUR, USD'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'wallet_cards',
  timestamps: true,
  indexes: [{ fields: ['userId'] }]
});

// Define associations (WalletCard must be defined before these)
Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Expense.belongsTo(WalletCard, { foreignKey: 'walletCardId', as: 'walletCard' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SavingsGoal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Salary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Salary.belongsTo(WalletCard, { foreignKey: 'walletCardId', as: 'walletCard' });
ExpenseCategory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
WalletCard.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  Expense,
  Budget,
  SavingsGoal,
  Salary,
  ExpenseCategory,
  WalletCard
};
