import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Expense, Budget, SavingsGoal, Salary } from '../../models/finance.model';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit {
  activeTab: 'overview' | 'salary' | 'expenses' | 'budget' | 'savings' = 'overview';
  
  expenses: Expense[] = [];
  budgets: Budget[] = [];
  savingsGoals: SavingsGoal[] = [];
  salaries: Salary[] = [];
  
  showExpenseForm = false;
  showBudgetForm = false;
  showSavingsForm = false;
  showSalaryForm = false;
  
  newExpense: Partial<Expense> = { category: 'other' };
  newBudget: Partial<Budget> = { period: 'monthly' };
  newSavingsGoal: Partial<SavingsGoal> = {};
  newSalary: Partial<Salary> = { period: 'monthly' };
  
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  monthlyExpenses = 0;
  monthlySalary = 0;
  remainingBalance = 0;
  monthlyBudget = 0;
  remainingBudget = 0;
  savingsSuggestions: string[] = [];

  expenseCategories = ['food', 'shopping', 'health', 'leisure', 'transport', 'bills', 'other'];
  
  // User info for bank card
  userName = 'Alex Martin';
  rib = 'FR76 1234 5678 9012 3456 7890 123';
  cardNumber = '4532 1234 5678 9010';
  expiryDate = '12/28';
  cvv = '123';

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.expenses = this.financeService.getExpenses();
    this.budgets = this.financeService.getBudgets();
    this.savingsGoals = this.financeService.getSavingsGoals();
    this.salaries = this.financeService.getSalaries();
    this.updateOverview();
  }

  updateOverview(): void {
    this.monthlyExpenses = this.financeService.getTotalExpensesForMonth(this.currentYear, this.currentMonth);
    this.monthlySalary = this.financeService.getMonthlySalary();
    this.remainingBalance = this.financeService.getRemainingBalance();
    this.monthlyBudget = this.financeService.getMonthlyBudget();
    this.remainingBudget = this.financeService.getRemainingBudget();
    this.savingsSuggestions = this.financeService.getSavingsSuggestions();
  }

  addExpense(): void {
    if (!this.newExpense.amount || !this.newExpense.description) return;
    this.financeService.addExpense({
      amount: this.newExpense.amount!,
      category: this.newExpense.category || 'other',
      description: this.newExpense.description!,
      date: new Date(),
      paymentMethod: this.newExpense.paymentMethod
    });
    this.showExpenseForm = false;
    this.newExpense = { category: 'other' };
    this.loadData();
  }

  deleteExpense(id: string): void {
    if (confirm('Supprimer cette dépense ?')) {
      this.financeService.deleteExpense(id);
      this.loadData();
    }
  }

  addBudget(): void {
    if (!this.newBudget.category || !this.newBudget.limit) return;
    this.financeService.addBudget({
      category: this.newBudget.category!,
      limit: this.newBudget.limit!,
      period: this.newBudget.period || 'monthly'
    });
    this.showBudgetForm = false;
    this.newBudget = { period: 'monthly' };
    this.loadData();
  }

  deleteBudget(id: string): void {
    if (confirm('Supprimer ce budget ?')) {
      this.financeService.deleteBudget(id);
      this.loadData();
    }
  }

  addSavingsGoal(): void {
    if (!this.newSavingsGoal.name || !this.newSavingsGoal.targetAmount) return;
    this.financeService.addSavingsGoal({
      name: this.newSavingsGoal.name!,
      targetAmount: this.newSavingsGoal.targetAmount!,
      currentAmount: this.newSavingsGoal.currentAmount || 0,
      deadline: this.newSavingsGoal.deadline ? new Date(this.newSavingsGoal.deadline) : undefined
    });
    this.showSavingsForm = false;
    this.newSavingsGoal = {};
    this.loadData();
  }

  updateSavingsGoal(id: string, amount: number): void {
    const goal = this.savingsGoals.find(g => g.id === id);
    if (goal) {
      this.financeService.updateSavingsGoal(id, { currentAmount: amount });
      this.loadData();
    }
  }

  deleteSavingsGoal(id: string): void {
    if (confirm('Supprimer cet objectif d\'épargne ?')) {
      this.financeService.deleteSavingsGoal(id);
      this.loadData();
    }
  }

  getExpensesByCategory(category: string): number {
    return this.expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      food: 'Alimentation',
      shopping: 'Shopping',
      health: 'Santé',
      leisure: 'Loisirs',
      transport: 'Transport',
      bills: 'Factures',
      other: 'Autre'
    };
    return names[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      food: '🍔',
      shopping: '🛍️',
      health: '🏥',
      leisure: '🎮',
      transport: '🚗',
      bills: '📄',
      other: '📦'
    };
    return icons[category] || '📦';
  }

  getBudgetProgress(budget: Budget): number {
    return Math.min((budget.spent / budget.limit) * 100, 100);
  }

  getSavingsProgress(goal: SavingsGoal): number {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  addSalary(): void {
    if (!this.newSalary.amount) return;
    this.financeService.addSalary({
      amount: this.newSalary.amount!,
      period: this.newSalary.period || 'monthly',
      date: this.newSalary.date ? new Date(this.newSalary.date) : new Date(),
      description: this.newSalary.description
    });
    this.showSalaryForm = false;
    this.newSalary = { period: 'monthly' };
    this.loadData();
  }

  deleteSalary(id: string): void {
    if (confirm('Supprimer ce salaire ?')) {
      this.financeService.deleteSalary(id);
      this.loadData();
    }
  }
}

