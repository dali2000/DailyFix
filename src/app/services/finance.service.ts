import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged } from 'rxjs';
import { Expense, Budget, SavingsGoal, Salary } from '../models/finance.model';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private expenses: Expense[] = [];
  private budgets: Budget[] = [];
  private savingsGoals: SavingsGoal[] = [];
  private salaries: Salary[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Charger les données seulement quand l'utilisateur est authentifié
    this.authService.currentUser$.pipe(
      distinctUntilChanged()
    ).subscribe((user) => {
      if (user !== null) {
        // Utilisateur connecté - charger les données
        this.loadAll();
      } else {
        // Utilisateur déconnecté - vider les données
        this.expenses = [];
        this.budgets = [];
        this.savingsGoals = [];
        this.salaries = [];
      }
    });
  }

  // Expense methods
  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  getExpensesObservable(): Observable<Expense[]> {
    return this.apiService.get<ApiResponse<Expense[]>>('/finance/expenses').pipe(
      map(response => response.data || []),
      tap(expenses => this.expenses = expenses.map(e => ({ ...e, id: e.id.toString(), date: new Date(e.date) })))
    );
  }

  addExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    return this.apiService.post<ApiResponse<Expense>>('/finance/expenses', expense).pipe(
      map(response => response.data!),
      tap(newExpense => {
        this.expenses.push({ ...newExpense, id: newExpense.id.toString(), date: new Date(newExpense.date) });
      })
    );
  }

  updateExpense(id: string, updates: Partial<Expense>): Observable<Expense> {
    return this.apiService.put<ApiResponse<Expense>>(`/finance/expenses/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedExpense => {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index !== -1) {
          this.expenses[index] = { ...updatedExpense, id: updatedExpense.id.toString(), date: new Date(updatedExpense.date) };
        }
      })
    );
  }

  deleteExpense(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/finance/expenses/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index !== -1) {
          this.expenses.splice(index, 1);
        }
      })
    );
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  getExpensesByCategory(category: Expense['category']): Expense[] {
    return this.expenses.filter(e => e.category === category);
  }

  // Budget methods
  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getBudgetsObservable(): Observable<Budget[]> {
    return this.apiService.get<ApiResponse<Budget[]>>('/finance/budgets').pipe(
      map(response => response.data || []),
      tap(budgets => this.budgets = budgets.map(b => ({ ...b, id: b.id.toString() })))
    );
  }

  addBudget(budget: Omit<Budget, 'id' | 'spent'>): Observable<Budget> {
    return this.apiService.post<ApiResponse<Budget>>('/finance/budgets', budget).pipe(
      map(response => response.data!),
      tap(newBudget => {
        this.budgets.push({ ...newBudget, id: newBudget.id.toString() });
      })
    );
  }

  updateBudget(id: string, updates: Partial<Budget>): Observable<Budget> {
    return this.apiService.put<ApiResponse<Budget>>(`/finance/budgets/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedBudget => {
        const index = this.budgets.findIndex(b => b.id === id);
        if (index !== -1) {
          this.budgets[index] = { ...updatedBudget, id: updatedBudget.id.toString() };
        }
      })
    );
  }

  deleteBudget(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/finance/budgets/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.budgets.findIndex(b => b.id === id);
        if (index !== -1) {
          this.budgets.splice(index, 1);
        }
      })
    );
  }

  // Savings Goal methods
  getSavingsGoals(): SavingsGoal[] {
    return [...this.savingsGoals];
  }

  getSavingsGoalsObservable(): Observable<SavingsGoal[]> {
    return this.apiService.get<ApiResponse<SavingsGoal[]>>('/finance/savings-goals').pipe(
      map(response => response.data || []),
      tap(goals => this.savingsGoals = goals.map(g => ({
        ...g,
        id: g.id.toString(),
        deadline: g.deadline ? new Date(g.deadline) : undefined
      })))
    );
  }

  updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Observable<SavingsGoal> {
    return this.apiService.put<ApiResponse<SavingsGoal>>(`/finance/savings-goals/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedGoal => {
        const index = this.savingsGoals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.savingsGoals[index] = {
            ...updatedGoal,
            id: updatedGoal.id.toString(),
            deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline) : undefined
          };
        }
      })
    );
  }

  deleteSavingsGoal(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/finance/savings-goals/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.savingsGoals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.savingsGoals.splice(index, 1);
        }
      })
    );
  }

  // Salary methods
  getSalaries(): Salary[] {
    return [...this.salaries];
  }

  getSalariesObservable(): Observable<Salary[]> {
    return this.apiService.get<ApiResponse<Salary[]>>('/finance/salaries').pipe(
      map(response => response.data || []),
      tap(salaries => this.salaries = salaries.map(s => ({ ...s, id: s.id.toString(), date: new Date(s.date) })))
    );
  }

  addSalary(salary: Omit<Salary, 'id'>): Observable<Salary> {
    return this.apiService.post<ApiResponse<Salary>>('/finance/salaries', salary).pipe(
      map(response => response.data!),
      tap(newSalary => {
        this.salaries.push({ ...newSalary, id: newSalary.id.toString(), date: new Date(newSalary.date) });
      })
    );
  }

  updateSalary(id: string, updates: Partial<Salary>): Observable<Salary> {
    return this.apiService.put<ApiResponse<Salary>>(`/finance/salaries/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedSalary => {
        const index = this.salaries.findIndex(s => s.id === id);
        if (index !== -1) {
          this.salaries[index] = { ...updatedSalary, id: updatedSalary.id.toString(), date: new Date(updatedSalary.date) };
        }
      })
    );
  }

  deleteSalary(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/finance/salaries/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.salaries.findIndex(s => s.id === id);
        if (index !== -1) {
          this.salaries.splice(index, 1);
        }
      })
    );
  }

  getTotalIncome(): number {
    return this.salaries.reduce((sum, s) => sum + s.amount, 0);
  }

  getTotalExpensesForMonth(year: number, month: number): number {
    return this.expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);
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

  getMonthlyBudget(): number {
    const monthlyBudgets = this.budgets.filter(b => b.period === 'monthly');
    return monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
  }

  getRemainingBudget(): number {
    const now = new Date();
    const monthlyExpenses = this.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    return this.getMonthlyBudget() - monthlyExpenses;
  }

  getRemainingBalance(): number {
    const monthlySalary = this.getMonthlySalary();
    const now = new Date();
    const monthlyExpenses = this.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    return monthlySalary - monthlyExpenses;
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

  addSavingsGoal(goal: Omit<SavingsGoal, 'id'> | Omit<SavingsGoal, 'id' | 'currentAmount'>): Observable<SavingsGoal> {
    const goalData = 'currentAmount' in goal ? { ...goal, currentAmount: goal.currentAmount || 0 } : { ...goal, currentAmount: 0 };
    return this.apiService.post<ApiResponse<SavingsGoal>>('/finance/savings-goals', goalData).pipe(
      map(response => response.data!),
      tap(newGoal => {
        this.savingsGoals.push({
          ...newGoal,
          id: newGoal.id.toString(),
          deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined
        });
      })
    );
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      this.getExpensesObservable().subscribe({
        error: (error) => console.error('Error loading expenses:', error)
      });
      this.getBudgetsObservable().subscribe({
        error: (error) => console.error('Error loading budgets:', error)
      });
      this.getSavingsGoalsObservable().subscribe({
        error: (error) => console.error('Error loading savings goals:', error)
      });
      this.getSalariesObservable().subscribe({
        error: (error) => console.error('Error loading salaries:', error)
      });
    } else {
      this.expenses = [];
      this.budgets = [];
      this.savingsGoals = [];
      this.salaries = [];
    }
  }
}
