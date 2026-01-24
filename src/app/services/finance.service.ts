import { Injectable } from '@angular/core';
import { Expense, Budget, SavingsGoal, Salary } from '../models/finance.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private expenses: Expense[] = [];
  private budgets: Budget[] = [];
  private savingsGoals: SavingsGoal[] = [];
  private salaries: Salary[] = [];

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur pour recharger les données
    this.authService.currentUser$.subscribe(() => {
      this.loadFromStorage();
    });
    this.loadFromStorage();
  }

  // Expense methods
  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExpense: Expense = {
      ...expense,
      id: this.generateId()
    };
    this.expenses.push(newExpense);
    this.saveToStorage();
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.expenses[index] = { ...this.expenses[index], ...updates };
    this.saveToStorage();
    return this.expenses[index];
  }

  deleteExpense(id: string): boolean {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.expenses.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getExpensesForMonth(year: number, month: number): Expense[] {
    return this.expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });
  }

  getTotalExpensesForMonth(year: number, month: number): number {
    return this.getExpensesForMonth(year, month).reduce((sum, e) => sum + e.amount, 0);
  }

  getExpensesByCategory(category: Expense['category']): Expense[] {
    return this.expenses.filter(e => e.category === category);
  }

  // Budget methods
  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  addBudget(budget: Omit<Budget, 'id' | 'spent'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: this.generateId(),
      spent: 0
    };
    this.budgets.push(newBudget);
    this.saveToStorage();
    return newBudget;
  }

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return null;
    this.budgets[index] = { ...this.budgets[index], ...updates };
    this.saveToStorage();
    return this.budgets[index];
  }

  deleteBudget(id: string): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.budgets.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getMonthlyBudget(): number {
    const monthlyBudgets = this.budgets.filter(b => b.period === 'monthly');
    return monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
  }

  getRemainingBudget(): number {
    const now = new Date();
    const monthlyExpenses = this.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    return this.getMonthlyBudget() - monthlyExpenses;
  }

  // Salary methods
  getSalaries(): Salary[] {
    return [...this.salaries];
  }

  addSalary(salary: Omit<Salary, 'id'>): Salary {
    const newSalary: Salary = {
      ...salary,
      id: this.generateId()
    };
    this.salaries.push(newSalary);
    this.saveToStorage();
    return newSalary;
  }

  updateSalary(id: string, updates: Partial<Salary>): Salary | null {
    const index = this.salaries.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.salaries[index] = { ...this.salaries[index], ...updates };
    this.saveToStorage();
    return this.salaries[index];
  }

  deleteSalary(id: string): boolean {
    const index = this.salaries.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.salaries.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getMonthlySalary(): number {
    const now = new Date();
    const monthlySalaries = this.salaries.filter(s => {
      const salaryDate = new Date(s.date);
      return s.period === 'monthly' && 
             salaryDate.getFullYear() === now.getFullYear() && 
             salaryDate.getMonth() === now.getMonth();
    });
    const totalMonthly = monthlySalaries.reduce((sum, s) => sum + s.amount, 0);
    
    // Also include yearly salaries converted to monthly
    const yearlySalaries = this.salaries.filter(s => {
      const salaryDate = new Date(s.date);
      return s.period === 'yearly' && 
             salaryDate.getFullYear() === now.getFullYear();
    });
    const totalYearly = yearlySalaries.reduce((sum, s) => sum + (s.amount / 12), 0);
    
    return totalMonthly + totalYearly;
  }

  getRemainingBalance(): number {
    const monthlySalary = this.getMonthlySalary();
    const now = new Date();
    const monthlyExpenses = this.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    return monthlySalary - monthlyExpenses;
  }

  // Savings Goal methods
  getSavingsGoals(): SavingsGoal[] {
    return [...this.savingsGoals];
  }

  addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      ...goal,
      id: this.generateId()
    };
    this.savingsGoals.push(newGoal);
    this.saveToStorage();
    return newGoal;
  }

  updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal | null {
    const index = this.savingsGoals.findIndex(g => g.id === id);
    if (index === -1) return null;
    this.savingsGoals[index] = { ...this.savingsGoals[index], ...updates };
    this.saveToStorage();
    return this.savingsGoals[index];
  }

  deleteSavingsGoal(id: string): boolean {
    const index = this.savingsGoals.findIndex(g => g.id === id);
    if (index === -1) return false;
    this.savingsGoals.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getSavingsSuggestions(): string[] {
    const suggestions: string[] = [];
    const now = new Date();
    const monthlyExpenses = this.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    
    if (monthlyExpenses > 0) {
      const foodExpenses = this.getExpensesByCategory('food').reduce((sum, e) => sum + e.amount, 0);
      if (foodExpenses > monthlyExpenses * 0.3) {
        suggestions.push('Considérez réduire les dépenses alimentaires en cuisinant plus à la maison');
      }
      
      const leisureExpenses = this.getExpensesByCategory('leisure').reduce((sum, e) => sum + e.amount, 0);
      if (leisureExpenses > monthlyExpenses * 0.2) {
        suggestions.push('Réduisez les dépenses de loisirs en cherchant des activités gratuites');
      }
    }
    
    return suggestions;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    const expensesKey = this.authService.getUserStorageKey('expenses');
    const budgetsKey = this.authService.getUserStorageKey('budgets');
    const savingsKey = this.authService.getUserStorageKey('savingsGoals');
    const salariesKey = this.authService.getUserStorageKey('salaries');
    localStorage.setItem(expensesKey, JSON.stringify(this.expenses));
    localStorage.setItem(budgetsKey, JSON.stringify(this.budgets));
    localStorage.setItem(savingsKey, JSON.stringify(this.savingsGoals));
    localStorage.setItem(salariesKey, JSON.stringify(this.salaries));
  }

  private loadFromStorage(): void {
    const expensesKey = this.authService.getUserStorageKey('expenses');
    const budgetsKey = this.authService.getUserStorageKey('budgets');
    const savingsKey = this.authService.getUserStorageKey('savingsGoals');
    const salariesKey = this.authService.getUserStorageKey('salaries');
    const expensesStr = localStorage.getItem(expensesKey);
    const budgetsStr = localStorage.getItem(budgetsKey);
    const savingsStr = localStorage.getItem(savingsKey);
    const salariesStr = localStorage.getItem(salariesKey);

    if (expensesStr) {
      this.expenses = JSON.parse(expensesStr).map((e: any) => ({ ...e, date: new Date(e.date) }));
    }
    if (budgetsStr) {
      this.budgets = JSON.parse(budgetsStr);
    }
    if (savingsStr) {
      this.savingsGoals = JSON.parse(savingsStr).map((g: any) => ({
        ...g,
        deadline: g.deadline ? new Date(g.deadline) : undefined
      }));
    }
    if (salariesStr) {
      this.salaries = JSON.parse(salariesStr).map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    }
  }
}

