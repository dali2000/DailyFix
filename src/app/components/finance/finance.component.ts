import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { Expense, Budget, SavingsGoal, Salary, ExpenseCategory, WalletCard } from '../../models/finance.model';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';
import { ToastService } from '../../services/toast.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { CountUpComponent } from '../shared/count-up/count-up.component';
import { RouterLink } from '@angular/router';

/** Preset gradient backgrounds for wallet cards (key = stored value in DB). */
const CARD_COLORS: Record<string, string> = {
  violet: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  orange: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
  red: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
  teal: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
  indigo: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
  pink: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
  black: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
};

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe, EmptyStateComponent, ConfirmDialogComponent, CountUpComponent, RouterLink],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit, OnDestroy, AfterViewInit {
  activeTab: 'overview' | 'salary' | 'expenses' | 'budget' | 'savings' = 'overview';

  /** Déclenche l’animation des barres de progression (0 → valeur) après affichage. */
  progressReady = false;

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

  /** Catégories par défaut (clés i18n). */
  private static readonly DEFAULT_EXPENSE_CATEGORIES = ['food', 'shopping', 'health', 'leisure', 'transport', 'bills', 'other'];
  /** Valeur spéciale du select pour "Ajouter une catégorie". */
  readonly addCategoryValue = '__add__';
  /** Catégories personnalisées (depuis l'API / base de données). */
  customCategoryList: ExpenseCategory[] = [];
  /** Nom saisi pour une nouvelle catégorie (dans le formulaire dépense). */
  newCategoryName = '';
  /** Nom saisi pour ajouter une catégorie (dans la section "Mes catégories"). */
  categoryToAdd = '';

  get customCategories(): string[] {
    return this.customCategoryList.map(c => c.name);
  }

  get expenseCategories(): string[] {
    return [...FinanceComponent.DEFAULT_EXPENSE_CATEGORIES, ...this.customCategories];
  }

  /** Catégories à afficher dans "Dépenses par catégorie" : défaut + custom + celles présentes dans les dépenses du mois. */
  get expenseCategoriesForOverview(): string[] {
    const fromExpenses = this.expensesForMonth.map(e => e.category).filter(Boolean);
    const known = new Set([...FinanceComponent.DEFAULT_EXPENSE_CATEGORIES, ...this.customCategories, ...fromExpenses]);
    return Array.from(known);
  }

  /** Catégories avec un montant > 0 uniquement (pour l’affichage). */
  get expenseCategoriesForOverviewNonZero(): string[] {
    return this.expenseCategoriesForOverview.filter(cat => this.getExpensesByCategory(cat) > 0);
  }

  expensesByCategoryExpanded = false;

  /** Catégories repliées dans l’onglet Dépenses (liste déroulante par catégorie). */
  expandedExpenseCategories = new Set<string>();

  /** Dépenses du mois regroupées par catégorie (pour l’onglet Dépenses). */
  getExpensesGroupedByCategory(): { category: string; categoryName: string; expenses: Expense[]; total: number }[] {
    const byCategory = new Map<string, Expense[]>();
    for (const e of this.expensesForMonth) {
      const list = byCategory.get(e.category) || [];
      list.push(e);
      byCategory.set(e.category, list);
    }
    return Array.from(byCategory.entries())
      .map(([category, expenses]) => ({
        category,
        categoryName: this.getCategoryName(category),
        expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total: expenses.reduce((sum, ex) => sum + this.parseAmount(ex.amount), 0)
      }))
      .sort((a, b) => b.total - a.total);
  }

  isExpenseCategoryExpanded(category: string): boolean {
    return this.expandedExpenseCategories.has(category);
  }

  toggleExpenseCategory(category: string): void {
    if (this.expandedExpenseCategories.has(category)) {
      this.expandedExpenseCategories.delete(category);
    } else {
      this.expandedExpenseCategories.add(category);
    }
    this.expandedExpenseCategories = new Set(this.expandedExpenseCategories);
  }

  // Confirm dialogs
  showDeleteExpenseConfirm = false;
  showDeleteSalaryConfirm = false;
  showDeleteBudgetConfirm = false;
  showDeleteSavingsConfirm = false;
  itemToDelete: string | null = null;

  // User info for bank card (fallback when no wallet cards)
  userName = '';
  rib = 'FR76 1234 5678 9012 3456 7890 123';
  cardNumber = '4532 1234 5678 9010';
  expiryDate = '12/28';
  cvv = '123';
  walletCards: WalletCard[] = [];
  selectedCard: WalletCard | null = null;
  private userSubscription?: Subscription;
  private walletCardsSubscription?: Subscription;

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

  isLoading = false;

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    public currencyService: CurrencyService,
    private i18n: I18nService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => (this.progressReady = true), 80);
  }

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
    
    this.loadWalletCardsAndData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.walletCardsSubscription) {
      this.walletCardsSubscription.unsubscribe();
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

  /** Load data. When cardId is set, expenses and salaries are filtered for that card (per-card stats). */
  loadData(cardId?: string | number | null): void {
    const cid = cardId ?? this.selectedCard?.id ?? null;
    const idStr = cid != null ? String(cid) : null;

    this.financeService.getExpensesForCard(idStr).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.updateOverview();
      },
      error: (err) => console.error('Error loading expenses:', err)
    });

    this.financeService.getSalariesForCard(idStr).subscribe({
      next: (salaries) => {
        this.salaries = salaries;
        this.updateOverview();
      },
      error: (err) => console.error('Error loading salaries:', err)
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

    this.financeService.getCustomCategoriesObservable().subscribe({
      next: (list) => {
        this.customCategoryList = list.map(c => ({ ...c, id: typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10) }));
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  /** Load wallet cards then load expenses/salaries for the selected card. */
  private loadWalletCardsAndData(): void {
    this.walletCardsSubscription = this.financeService.getWalletCardsObservable().subscribe({
      next: (list) => {
        this.walletCards = list;
        const defaultCard = this.financeService.getDefaultWalletCard();
        this.selectedCard = defaultCard ?? null;
        this.loadData(this.selectedCard?.id ?? null);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading wallet cards:', err)
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

  /** True si le mois sélectionné est avant ou égal au mois courant (on peut aller au mois suivant). */
  get canGoToNextMonth(): boolean {
    const now = new Date();
    if (this.currentYear < now.getFullYear()) return true;
    if (this.currentYear > now.getFullYear()) return false;
    return this.currentMonth < now.getMonth();
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
    this.newCategoryName = '';
  }

  openExpenseForm(): void {
    this.newExpense = { category: 'other', date: this.firstDayOfSelectedMonth as unknown as Date };
    this.newCategoryName = '';
    this.showExpenseForm = true;
  }

  /** Ajoute une catégorie personnalisée (depuis le formulaire dépense ou la section "Mes catégories"). Persistée en base. */
  addCustomCategory(nameFromForm?: string): void {
    const name = (nameFromForm !== undefined ? nameFromForm : this.newCategoryName)?.trim() || '';
    if (!name) return;
    const lower = name.toLowerCase();
    const exists = this.expenseCategories.some(c => c.toLowerCase() === lower);
    if (exists) {
      this.toastService.warning(this.i18n.instant('finance.categoryExists') || 'Cette catégorie existe déjà.');
      return;
    }
    this.financeService.addCustomCategory(name).subscribe({
      next: (result) => {
        this.customCategoryList = this.financeService.getCustomCategories();
        if (nameFromForm !== undefined) {
          this.categoryToAdd = '';
        } else {
          // Use the exact name from API so it matches the new option in the select
          const categoryName = result?.data?.name ?? name;
          this.newCategoryName = '';
          // Defer so the select options (expenseCategories) are updated first, then set the value
          setTimeout(() => {
            this.newExpense = { ...this.newExpense, category: categoryName };
          }, 0);
        }
        this.toastService.success(this.i18n.instant('finance.categoryAdded') || 'Catégorie ajoutée.');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Erreur';
        this.toastService.error(msg);
      }
    });
  }

  /** Supprime une catégorie personnalisée en base (les dépenses existantes gardent leur catégorie). */
  removeCustomCategory(id: string | number): void {
    this.financeService.removeCustomCategory(id).subscribe({
      next: () => {
        this.customCategoryList = this.financeService.getCustomCategories();
        this.toastService.success(this.i18n.instant('finance.categoryRemoved') || 'Catégorie retirée.');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Erreur');
      }
    });
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
    const code = this.selectedCard?.currency ?? this.currencyService.getSelectedCurrencyCode() ?? undefined;
    if (code === 'TND') return this.i18n.instant('finance.currencySymbolTND') || 'د.ت';
    return this.currencyService.getSymbolForCode(code);
  }

  /** Clé i18n pour le libellé de la devise affichée sur la carte (ex. finance.currencyTND). */
  get displayCardCurrencyLabel(): string {
    const code = this.displayCardCurrency || 'EUR';
    const known = ['EUR', 'USD', 'GBP', 'CAD', 'TND'];
    return known.includes(code) ? `finance.currency${code}` : code;
  }

  convertAmount(amount: number | null | undefined): number {
    return this.currencyService.convertAmount(amount);
  }

  addExpense(): void {
    if (!this.newExpense.amount || !this.newExpense.description) return;
    if (this.newExpense.category === this.addCategoryValue || !this.newExpense.category) {
      this.toastService.warning(this.i18n.instant('finance.selectOrAddCategory') || 'Choisissez ou ajoutez une catégorie.');
      return;
    }
    const date = this.newExpense.date ? new Date(this.newExpense.date) : new Date(this.currentYear, this.currentMonth, 1);
    const cardId = this.selectedCard?.id != null ? String(this.selectedCard.id) : null;
    this.financeService.addExpense({
      amount: this.newExpense.amount!,
      category: this.newExpense.category || 'other',
      description: this.newExpense.description!,
      date,
      paymentMethod: this.newExpense.paymentMethod,
      walletCardId: cardId
    }).subscribe({
      next: () => {
        this.showExpenseForm = false;
        this.newExpense = { category: 'other' };
        this.loadData(this.selectedCard?.id ?? null);
        this.playMoneySound();
        this.toastService.success(this.i18n.instant('finance.expenseAdded') || 'Dépense ajoutée avec succès');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Erreur lors de l\'ajout de la dépense';
        this.toastService.error(msg);
      }
    });
  }

  deleteExpense(id: string): void {
    this.itemToDelete = id;
    this.showDeleteExpenseConfirm = true;
  }

  confirmDeleteExpense(): void {
    if (!this.itemToDelete) return;
    this.financeService.deleteExpense(this.itemToDelete).subscribe({
      next: () => {
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Dépense supprimée');
        this.showDeleteExpenseConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur lors de la suppression');
        this.showDeleteExpenseConfirm = false;
      }
    });
  }

  cancelDeleteExpense(): void {
    this.showDeleteExpenseConfirm = false;
    this.itemToDelete = null;
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
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Budget créé');
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur');
      }
    });
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
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Objectif d\'épargne créé');
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur');
      }
    });
  }

  updateSavingsGoal(id: string, amount: number): void {
    const goal = this.savingsGoals.find(g => g.id === id);
    if (goal) {
      this.financeService.updateSavingsGoal(id, { currentAmount: amount }).subscribe({
        next: () => {
          this.loadData(this.selectedCard?.id ?? null);
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
        this.loadData(this.selectedCard?.id ?? null);
      }
    });
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

  /** Pourcentage des dépenses d'une catégorie par rapport au total du mois (0–100). */
  getExpenseCategoryPercent(category: string): number {
    if (this.monthlyExpenses <= 0) return 0;
    const amount = this.getExpensesByCategory(category);
    return Math.min(100, (amount / this.monthlyExpenses) * 100);
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
    const cardId = this.selectedCard?.id != null ? String(this.selectedCard.id) : null;
    this.financeService.addSalary({
      amount: this.newSalary.amount!,
      period: this.newSalary.period || 'monthly',
      date,
      description: this.newSalary.description,
      walletCardId: cardId
    }).subscribe({
      next: () => {
        this.playMoneySound();
        this.showSalaryForm = false;
        this.newSalary = { period: 'monthly' };
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Salaire ajouté avec succès');
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur lors de l\'ajout du salaire');
      }
    });
  }

  deleteSalary(id: string): void {
    this.itemToDelete = id;
    this.showDeleteSalaryConfirm = true;
  }

  confirmDeleteSalary(): void {
    if (!this.itemToDelete) return;
    this.financeService.deleteSalary(this.itemToDelete).subscribe({
      next: () => {
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Salaire supprimé');
        this.showDeleteSalaryConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur lors de la suppression');
        this.showDeleteSalaryConfirm = false;
      }
    });
  }

  cancelDeleteSalary(): void {
    this.showDeleteSalaryConfirm = false;
    this.itemToDelete = null;
  }

  deleteBudget(id: string): void {
    this.itemToDelete = id;
    this.showDeleteBudgetConfirm = true;
  }

  confirmDeleteBudget(): void {
    if (!this.itemToDelete) return;
    this.financeService.deleteBudget(this.itemToDelete).subscribe({
      next: () => {
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Budget supprimé');
        this.showDeleteBudgetConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur');
        this.showDeleteBudgetConfirm = false;
      }
    });
  }

  cancelDeleteBudget(): void {
    this.showDeleteBudgetConfirm = false;
    this.itemToDelete = null;
  }

  deleteSavingsGoal(id: string): void {
    this.itemToDelete = id;
    this.showDeleteSavingsConfirm = true;
  }

  confirmDeleteSavingsGoal(): void {
    if (!this.itemToDelete) return;
    this.financeService.deleteSavingsGoal(this.itemToDelete).subscribe({
      next: () => {
        this.loadData(this.selectedCard?.id ?? null);
        this.toastService.success('Objectif supprimé');
        this.showDeleteSavingsConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erreur');
        this.showDeleteSavingsConfirm = false;
      }
    });
  }

  cancelDeleteSavingsGoal(): void {
    this.showDeleteSavingsConfirm = false;
    this.itemToDelete = null;
  }

  /** Card name shown on the card (replaces DailyFix). */
  get displayCardName(): string {
    if (this.selectedCard?.name) return this.selectedCard.name;
    if (this.selectedCard?.holderName) return this.selectedCard.holderName;
    return 'DailyFix';
  }

  /** Gradient background for the bank card from selected card color. */
  get cardGradient(): string {
    if (this.remainingBalance < 0) return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)';
    const key = this.selectedCard?.color ?? 'violet';
    return (CARD_COLORS as Record<string, string>)[key] ?? CARD_COLORS['violet'];
  }

  /** Gradient for the front card – always uses selected card color (for correct update on switch). */
  getFrontCardGradient(): string {
    if (this.remainingBalance < 0) return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)';
    return this.getCardGradient(this.selectedCard ?? undefined);
  }

  /** Gradient for a given wallet card (for switcher strips and front card). */
  getCardGradient(card: WalletCard | null | undefined): string {
    const raw = card?.color != null ? String(card.color).trim() : '';
    const key = raw || 'violet';
    return (CARD_COLORS as Record<string, string>)[key] ?? CARD_COLORS['violet'];
  }

  /** Displayed bank card: selected wallet card or fallback (user name + default values). */
  get displayCardHolder(): string {
    return this.selectedCard?.holderName ?? this.userName;
  }

  get displayCardNumber(): string {
    return this.selectedCard?.cardNumber ?? this.cardNumber;
  }

  get displayExpiry(): string {
    return this.selectedCard?.expiryDate ?? this.expiryDate;
  }

  get displayRib(): string {
    return this.selectedCard?.rib ?? this.rib;
  }

  /** Currency code displayed on the card (e.g. EUR, USD) – code only, not symbol. */
  get displayCardCurrency(): string {
    const code = this.selectedCard?.currency ?? this.currencyService.getSelectedCurrencyCode() ?? 'EUR';
    return code || 'EUR';
  }

  /** Active pendant l'animation de transition entre cartes */
  cardTransitioning = false;

  /** true = liste des cartes affichée (style Wallet iPhone, clic sur la carte devant) */
  showCardList = false;

  /** Ouvre un peu les bandeaux pour afficher les autres cartes. */
  openCardList(): void {
    this.showCardList = true;
  }

  /** Ferme l’ouverture des bandeaux. */
  closeCardList(): void {
    this.showCardList = false;
  }

  /** Clic sur la carte devant : ouvre un peu les bandeaux ou les referme. */
  toggleCardList(): void {
    this.showCardList = !this.showCardList;
  }

  selectCard(card: WalletCard): void {
    if (this.selectedCard?.id === card.id) {
      this.showCardList = false;
      return;
    }
    this.selectedCard = card;
    this.showCardList = false;
    this.loadData(card.id);
    this.cardTransitioning = false;
    setTimeout(() => {
      this.cardTransitioning = true;
      setTimeout(() => (this.cardTransitioning = false), 350);
    }, 0);
  }
}

