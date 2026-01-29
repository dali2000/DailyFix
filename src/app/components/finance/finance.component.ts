import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { Expense, Budget, SavingsGoal, Salary } from '../../models/finance.model';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit, OnDestroy {
  activeTab: 'overview' | 'salary' | 'expenses' | 'budget' | 'savings' = 'overview';

  expenses: Expense[] = [];
  budgets: Budget[] = [];
  savingsGoals: SavingsGoal[] = [];
  salaries: Salary[] = [];
  private dataSubscription?: Subscription;
  
  showExpenseForm = false;
  showBudgetForm = false;
  showSavingsForm = false;
  showSalaryForm = false;
  showSavingsAdjustModal = false;
  savingsAdjustGoal: SavingsGoal | null = null;
  savingsAdjustOperation: 'add' | 'decrease' = 'add';
  savingsAdjustAmount = 0;

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
  userName = '';
  rib = 'FR76 1234 5678 9012 3456 7890 123';
  cardNumber = '4532 1234 5678 9010';
  expiryDate = '12/28';
  cvv = '123';
  private userSubscription?: Subscription;

  /** Play a short money/cha-ching sound using Web Audio API */
  private playMoneySound(): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(880, ctx.currentTime, 0.08, 0.15);
      playTone(1320, ctx.currentTime + 0.1, 0.12, 0.12);
    } catch (_) { /* ignore */ }
  }

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    public currencyService: CurrencyService,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    // Charger le nom de l'utilisateur connecté
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.fullName;
    }
    
    // Écouter les changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.fullName;
      } else {
        this.userName = '';
      }
    });
    
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /** Parse API amount (string or number) to number for DecimalPipe and calculations. */
  private parseAmount(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const s = String(value).trim().replace(',', '.');
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  }

  loadData(): void {
    // Charger toutes les données depuis l'API (normaliser les montants en nombres)
    this.financeService.getExpensesObservable().subscribe({
      next: (expenses) => {
        this.expenses = expenses.map((e: any) => ({
          ...e,
          id: e.id.toString(),
          date: new Date(e.date),
          amount: this.parseAmount(e.amount)
        }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading expenses:', error)
    });

    this.financeService.getBudgetsObservable().subscribe({
      next: (budgets) => {
        this.budgets = budgets.map((b: any) => ({
          ...b,
          id: b.id.toString(),
          limit: this.parseAmount(b.limit),
          spent: this.parseAmount(b.spent)
        }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading budgets:', error)
    });

    this.financeService.getSavingsGoalsObservable().subscribe({
      next: (goals) => {
        this.savingsGoals = goals.map((g: any) => ({
          ...g,
          id: g.id.toString(),
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          targetAmount: this.parseAmount(g.targetAmount),
          currentAmount: this.parseAmount(g.currentAmount)
        }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading savings goals:', error)
    });

    this.financeService.getSalariesObservable().subscribe({
      next: (salaries) => {
        this.salaries = salaries.map((s: any) => ({
          ...s,
          id: s.id.toString(),
          date: new Date(s.date),
          amount: this.parseAmount(s.amount)
        }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading salaries:', error)
    });
  }

  updateOverview(): void {
    this.monthlyExpenses = this.financeService.getTotalExpensesForMonth(this.currentYear, this.currentMonth);
    this.monthlySalary = this.financeService.getSalaryForMonth(this.currentYear, this.currentMonth);
    this.remainingBalance = this.financeService.getRemainingBalance(this.currentYear, this.currentMonth);
    this.monthlyBudget = this.financeService.getMonthlyBudget();
    this.remainingBudget = this.financeService.getRemainingBudget(this.currentYear, this.currentMonth);
    this.savingsSuggestions = this.financeService.getSavingsSuggestions(this.currentYear, this.currentMonth);
  }

  /** Dépenses du mois sélectionné (pour affichage onglet Dépenses). */
  get expensesForMonth(): Expense[] {
    return this.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === this.currentYear && d.getMonth() === this.currentMonth;
    });
  }

  /** Salaires du mois sélectionné : mensuels du mois + annuels de l'année. */
  get salariesForMonth(): Salary[] {
    return this.salaries.filter(s => {
      const d = new Date(s.date);
      if (s.period === 'monthly') {
        return d.getFullYear() === this.currentYear && d.getMonth() === this.currentMonth;
      }
      return s.period === 'yearly' && d.getFullYear() === this.currentYear;
    });
  }

  /** Libellé du mois sélectionné (ex. "Janvier 2025"). */
  get selectedMonthLabel(): string {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    const localeMap: { [key: string]: string } = { fr: 'fr-FR', en: 'en-US', ar: 'ar-EG' };
    const locale = localeMap[this.i18n.currentLang] || 'fr-FR';
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  goToPrevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.updateOverview();
  }

  goToNextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.updateOverview();
  }

  /** Réinitialiser sur le mois courant. */
  goToCurrentMonth(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.updateOverview();
  }

  /** Premier jour du mois sélectionné (pour date par défaut des formulaires). */
  get firstDayOfSelectedMonth(): string {
    const y = this.currentYear;
    const m = String(this.currentMonth + 1).padStart(2, '0');
    const d = '01';
    return `${y}-${m}-${d}`;
  }

  closeSalaryModal(): void {
    this.showSalaryForm = false;
    this.newSalary = { period: 'monthly' };
  }

  openSalaryForm(): void {
    this.newSalary = { period: 'monthly', date: this.firstDayOfSelectedMonth as unknown as Date };
    this.showSalaryForm = true;
  }

  closeExpenseModal(): void {
    this.showExpenseForm = false;
    this.newExpense = { category: 'other' };
  }

  openExpenseForm(): void {
    this.newExpense = { category: 'other', date: this.firstDayOfSelectedMonth as unknown as Date };
    this.showExpenseForm = true;
  }

  closeBudgetModal(): void {
    this.showBudgetForm = false;
    this.newBudget = { period: 'monthly' };
  }

  closeSavingsModal(): void {
    this.showSavingsForm = false;
    this.newSavingsGoal = {};
  }

  get currencySymbol(): string {
    return this.currencyService.getSymbol();
  }

  convertAmount(amount: number | null | undefined): number {
    return this.currencyService.convertAmount(amount);
  }

  addExpense(): void {
    if (!this.newExpense.amount || !this.newExpense.description) return;
    const date = this.newExpense.date ? new Date(this.newExpense.date) : new Date(this.currentYear, this.currentMonth, 1);
    this.financeService.addExpense({
      amount: this.newExpense.amount!,
      category: this.newExpense.category || 'other',
      description: this.newExpense.description!,
      date,
      paymentMethod: this.newExpense.paymentMethod
    }).subscribe({
      next: () => {
        this.showExpenseForm = false;
        this.newExpense = { category: 'other' };
        this.loadData();
      }
    });
  }

  deleteExpense(id: string): void {
    if (confirm('Supprimer cette dépense ?')) {
      this.financeService.deleteExpense(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  addBudget(): void {
    if (!this.newBudget.category || !this.newBudget.limit) return;
    this.financeService.addBudget({
      category: this.newBudget.category!,
      limit: this.newBudget.limit!,
      period: this.newBudget.period || 'monthly'
    }).subscribe({
      next: () => {
        this.showBudgetForm = false;
        this.newBudget = { period: 'monthly' };
        this.loadData();
      }
    });
  }

  deleteBudget(id: string): void {
    if (confirm('Supprimer ce budget ?')) {
      this.financeService.deleteBudget(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  addSavingsGoal(): void {
    if (!this.newSavingsGoal.name || !this.newSavingsGoal.targetAmount) return;
    this.financeService.addSavingsGoal({
      name: this.newSavingsGoal.name!,
      targetAmount: this.newSavingsGoal.targetAmount!,
      currentAmount: this.newSavingsGoal.currentAmount || 0,
      deadline: this.newSavingsGoal.deadline ? new Date(this.newSavingsGoal.deadline) : undefined
    }).subscribe({
      next: () => {
        this.showSavingsForm = false;
        this.newSavingsGoal = {};
        this.loadData();
      }
    });
  }

  updateSavingsGoal(id: string, amount: number): void {
    const goal = this.savingsGoals.find(g => g.id === id);
    if (goal) {
      this.financeService.updateSavingsGoal(id, { currentAmount: amount }).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  openSavingsAdjust(goal: SavingsGoal, operation: 'add' | 'decrease'): void {
    this.savingsAdjustGoal = goal;
    this.savingsAdjustOperation = operation;
    this.savingsAdjustAmount = 0;
    this.showSavingsAdjustModal = true;
  }

  closeSavingsAdjustModal(): void {
    this.showSavingsAdjustModal = false;
    this.savingsAdjustGoal = null;
    this.savingsAdjustAmount = 0;
  }

  get savingsAdjustModalTitle(): string {
    if (!this.savingsAdjustGoal) return '';
    const op = this.savingsAdjustOperation === 'add'
      ? this.i18n.instant('finance.addAmount')
      : this.i18n.instant('finance.decreaseAmount');
    return `${op} - ${this.savingsAdjustGoal.name}`;
  }

  submitSavingsAdjust(): void {
    if (!this.savingsAdjustGoal || this.savingsAdjustAmount <= 0) return;
    const current = this.parseAmount(this.savingsAdjustGoal.currentAmount);
    const delta = this.savingsAdjustOperation === 'add' ? this.savingsAdjustAmount : -this.savingsAdjustAmount;
    const newAmount = Math.max(0, current + delta);
    this.financeService.updateSavingsGoal(this.savingsAdjustGoal.id, { currentAmount: newAmount }).subscribe({
      next: () => {
        this.closeSavingsAdjustModal();
        this.loadData();
      }
    });
  }

  deleteSavingsGoal(id: string): void {
    if (confirm('Supprimer cet objectif d\'épargne ?')) {
      this.financeService.deleteSavingsGoal(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  /** Total des dépenses par catégorie pour le mois sélectionné. */
  getExpensesByCategory(category: string): number {
    return this.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === this.currentYear && d.getMonth() === this.currentMonth && e.category === category;
      })
      .reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
  }

  getCategoryName(category: string): string {
    const keys: { [key: string]: string } = {
      food: 'finance.food',
      shopping: 'finance.shopping',
      health: 'finance.health',
      leisure: 'finance.leisure',
      transport: 'finance.transport',
      bills: 'finance.bills',
      other: 'finance.other'
    };
    const key = keys[category];
    return key ? this.i18n.instant(key) : category;
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
    const limit = this.parseAmount(budget.limit);
    if (limit <= 0) return 0;
    return Math.min((this.parseAmount(budget.spent) / limit) * 100, 100);
  }

  getSavingsProgress(goal: SavingsGoal): number {
    const target = this.parseAmount(goal.targetAmount);
    if (target <= 0) return 0;
    return Math.min((this.parseAmount(goal.currentAmount) / target) * 100, 100);
  }

  addSalary(): void {
    if (!this.newSalary.amount) return;
    const date = this.newSalary.date ? new Date(this.newSalary.date) : new Date(this.currentYear, this.currentMonth, 1);
    this.financeService.addSalary({
      amount: this.newSalary.amount!,
      period: this.newSalary.period || 'monthly',
      date,
      description: this.newSalary.description
    }).subscribe({
      next: () => {
        this.playMoneySound();
        this.showSalaryForm = false;
        this.newSalary = { period: 'monthly' };
        this.loadData();
      }
    });
  }

  deleteSalary(id: string): void {
    if (confirm('Supprimer ce salaire ?')) {
      this.financeService.deleteSalary(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }
}

