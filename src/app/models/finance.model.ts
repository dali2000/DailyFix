export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod?: string;
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
}

export interface ExpenseCategory {
  id: number;
  name: string;
  userId?: number;
  createdAt?: string;
}