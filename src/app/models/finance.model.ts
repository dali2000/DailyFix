export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod?: string;
  walletCardId?: number | string | null;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
}

export interface Salary {
  id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  date: Date;
  description?: string;
  walletCardId?: number | string | null;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  userId?: number;
  createdAt?: string;
}

export interface WalletCard {
  id: string | number;
  name?: string | null;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  rib?: string | null;
  isDefault: boolean;
  createdAt?: string;
}