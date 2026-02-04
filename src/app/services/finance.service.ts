import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged, shareReplay, forkJoin, of } from 'rxjs';
import { Expense, Budget, SavingsGoal, Salary, ExpenseCategory, WalletCard } from '../models/finance.model';
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
  private customCategories: ExpenseCategory[] = [];
  private walletCards: WalletCard[] = [];
  private expensesCache$: Observable<Expense[]> | null = null;
  private budgetsCache$: Observable<Budget[]> | null = null;
  private savingsGoalsCache$: Observable<SavingsGoal[]> | null = null;
  private salariesCache$: Observable<Salary[]> | null = null;
  private categoriesCache$: Observable<ExpenseCategory[]> | null = null;
  private walletCardsCache$: Observable<WalletCard[]> | null = null;

  /** Parse API amount (string or number) to number for calculations. */
  private parseAmount(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const s = String(value).trim().replace(',', '.');
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  }

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Charger les données seulement quand l'utilisateur est authentifié
    this.authService.currentUser$.pipe(
      distinctUntilChanged()
    ).subscribe((user) => {
      if (user !== null) {
        this.loadAll();
      } else {
        this.expenses = [];
        this.budgets = [];
        this.savingsGoals = [];
        this.salaries = [];
        this.customCategories = [];
        this.walletCards = [];
        this.expensesCache$ = null;
        this.budgetsCache$ = null;
        this.savingsGoalsCache$ = null;
        this.salariesCache$ = null;
        this.categoriesCache$ = null;
        this.walletCardsCache$ = null;
      }
    });
  }

  // Custom expense categories (from API)
  getCustomCategories(): ExpenseCategory[] {
    return [...this.customCategories];
  }

  getCustomCategoriesObservable(): Observable<ExpenseCategory[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.apiService.get<ApiResponse<ExpenseCategory[]>>('/finance/categories').pipe(
        map(response => response.data || []),
        tap(cats => {
          this.customCategories = cats.map(c => ({ ...c, id: typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10) }));
        }),
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  addCustomCategory(name: string): Observable<{ data: ExpenseCategory; created: boolean }> {
    const trimmed = name?.trim() || '';
    if (!trimmed) return of({ data: {} as ExpenseCategory, created: false });
    return this.apiService.post<ApiResponse<ExpenseCategory> & { created?: boolean }>('/finance/categories', { name: trimmed }).pipe(
      map(response => ({
        data: response.data!,
        created: (response as { created?: boolean }).created !== false
      })),
      tap(({ data }) => {
        const newCat = { ...data, id: typeof data.id === 'number' ? data.id : parseInt(String(data.id), 10) };
        if (!this.customCategories.some(c => c.id === newCat.id)) {
          this.customCategories.push(newCat);
        }
        this.categoriesCache$ = null;
      })
    );
  }

  removeCustomCategory(id: string | number): Observable<boolean> {
    const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.apiService.delete<ApiResponse<unknown>>(`/finance/categories/${idNum}`).pipe(
      map(response => response.success),
      tap(success => {
        if (success) {
          this.customCategories = this.customCategories.filter(c => c.id !== idNum);
          this.categoriesCache$ = null;
        }
      })
    );
  }

  // Expense methods
  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  getExpensesObservable(): Observable<Expense[]> {
    if (!this.expensesCache$) {
      this.expensesCache$ = this.apiService.get<ApiResponse<Expense[]>>('/finance/expenses').pipe(
        map(response => response.data || []),
        tap(expenses => this.expenses = expenses.map(e => ({
          ...e,
          id: e.id.toString(),
          date: new Date(e.date),
          amount: this.parseAmount((e as any).amount)
        }))),
        shareReplay(1)
      );
    }
    return this.expensesCache$;
  }

  /** Load expenses for a given card (or all if cardId is null). Updates service state for getTotalExpensesForMonth etc. */
  getExpensesForCard(cardId: string | null): Observable<Expense[]> {
    const params = cardId != null ? { walletCardId: cardId } : undefined;
    return this.apiService.get<ApiResponse<Expense[]>>('/finance/expenses', params).pipe(
      map(response => (response.data || []).map(e => ({
        ...e,
        id: e.id.toString(),
        date: new Date(e.date),
        amount: this.parseAmount((e as any).amount)
      }))),
      tap(expenses => {
        this.expenses = expenses;
        this.expensesCache$ = null;
      })
    );
  }

  addExpense(expense: Omit<Expense, 'id'> & { walletCardId?: string | number | null }): Observable<Expense> {
    const body = { ...expense };
    if (expense.walletCardId != null) {
      (body as any).walletCardId = typeof expense.walletCardId === 'string' ? parseInt(expense.walletCardId, 10) : expense.walletCardId;
    }
    return this.apiService.post<ApiResponse<Expense>>('/finance/expenses', body).pipe(
      map(response => response.data!),
      tap(newExpense => {
        this.expenses.push({ ...newExpense, id: newExpense.id.toString(), date: new Date(newExpense.date) });
        this.expensesCache$ = null;
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
        this.expensesCache$ = null;
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
        this.expensesCache$ = null;
      })
    );
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
  }

  getExpensesByCategory(category: Expense['category']): Expense[] {
    return this.expenses.filter(e => e.category === category);
  }

  // Budget methods
  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getBudgetsObservable(): Observable<Budget[]> {
    if (!this.budgetsCache$) {
      this.budgetsCache$ = this.apiService.get<ApiResponse<Budget[]>>('/finance/budgets').pipe(
        map(response => response.data || []),
        tap(budgets => this.budgets = budgets.map(b => ({
          ...b,
          id: b.id.toString(),
          limit: this.parseAmount((b as any).limit),
          spent: this.parseAmount((b as any).spent)
        }))),
        shareReplay(1)
      );
    }
    return this.budgetsCache$;
  }

  addBudget(budget: Omit<Budget, 'id' | 'spent'>): Observable<Budget> {
    return this.apiService.post<ApiResponse<Budget>>('/finance/budgets', budget).pipe(
      map(response => response.data!),
      tap(newBudget => {
        this.budgets.push({ ...newBudget, id: newBudget.id.toString() });
        this.budgetsCache$ = null;
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
        this.budgetsCache$ = null;
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
        this.budgetsCache$ = null;
      })
    );
  }

  // Savings Goal methods
  getSavingsGoals(): SavingsGoal[] {
    return [...this.savingsGoals];
  }

  getSavingsGoalsObservable(): Observable<SavingsGoal[]> {
    if (!this.savingsGoalsCache$) {
      this.savingsGoalsCache$ = this.apiService.get<ApiResponse<SavingsGoal[]>>('/finance/savings-goals').pipe(
        map(response => response.data || []),
        tap(goals => this.savingsGoals = goals.map(g => ({
          ...g,
          id: g.id.toString(),
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          targetAmount: this.parseAmount((g as any).targetAmount),
          currentAmount: this.parseAmount((g as any).currentAmount)
        }))),
        shareReplay(1)
      );
    }
    return this.savingsGoalsCache$;
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
        this.savingsGoalsCache$ = null;
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
        this.savingsGoalsCache$ = null;
      })
    );
  }

  // Salary methods
  getSalaries(): Salary[] {
    return [...this.salaries];
  }

  getSalariesObservable(): Observable<Salary[]> {
    if (!this.salariesCache$) {
      this.salariesCache$ = this.apiService.get<ApiResponse<Salary[]>>('/finance/salaries').pipe(
        map(response => response.data || []),
        tap(salaries => this.salaries = salaries.map(s => ({
          ...s,
          id: s.id.toString(),
          date: new Date(s.date),
          amount: this.parseAmount((s as any).amount)
        }))),
        shareReplay(1)
      );
    }
    return this.salariesCache$;
  }

  /** Load salaries for a given card (or all if cardId is null). Updates service state for getSalaryForMonth etc. */
  getSalariesForCard(cardId: string | null): Observable<Salary[]> {
    const params = cardId != null ? { walletCardId: cardId } : undefined;
    return this.apiService.get<ApiResponse<Salary[]>>('/finance/salaries', params).pipe(
      map(response => (response.data || []).map(s => ({
        ...s,
        id: s.id.toString(),
        date: new Date(s.date),
        amount: this.parseAmount((s as any).amount)
      }))),
      tap(salaries => {
        this.salaries = salaries;
        this.salariesCache$ = null;
      })
    );
  }

  addSalary(salary: Omit<Salary, 'id'> & { walletCardId?: string | number | null }): Observable<Salary> {
    const body = { ...salary };
    if (salary.walletCardId != null) {
      (body as any).walletCardId = typeof salary.walletCardId === 'string' ? parseInt(salary.walletCardId, 10) : salary.walletCardId;
    }
    return this.apiService.post<ApiResponse<Salary>>('/finance/salaries', body).pipe(
      map(response => response.data!),
      tap(newSalary => {
        this.salaries.push({ ...newSalary, id: newSalary.id.toString(), date: new Date(newSalary.date) });
        this.salariesCache$ = null;
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
        this.salariesCache$ = null;
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
        this.salariesCache$ = null;
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
      .reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
  }

  getMonthlySalary(): number {
    const now = new Date();
    return this.getSalaryForMonth(now.getFullYear(), now.getMonth());
  }

  /** Salaire total pour un mois donné : salaires mensuels du mois + 1/12 des salaires annuels de l'année. */
  getSalaryForMonth(year: number, month: number): number {
    const monthlySalaries = this.salaries.filter(s => {
      const salaryDate = new Date(s.date);
      return s.period === 'monthly' &&
             salaryDate.getFullYear() === year &&
             salaryDate.getMonth() === month;
    });
    const totalMonthly = monthlySalaries.reduce((sum, s) => sum + this.parseAmount(s.amount), 0);

    const yearlySalaries = this.salaries.filter(s => {
      const salaryDate = new Date(s.date);
      return s.period === 'yearly' && salaryDate.getFullYear() === year;
    });
    const totalYearly = yearlySalaries.reduce((sum, s) => sum + (this.parseAmount(s.amount) / 12), 0);

    return totalMonthly + totalYearly;
  }

  /** Salaires affichés pour un mois : mensuels du mois + annuels de l'année (pour la liste). */
  getSalariesForMonth(year: number, month: number): Salary[] {
    return this.salaries.filter(s => {
      const salaryDate = new Date(s.date);
      const isMonthly = s.period === 'monthly' && salaryDate.getFullYear() === year && salaryDate.getMonth() === month;
      const isYearly = s.period === 'yearly' && salaryDate.getFullYear() === year;
      return isMonthly || isYearly;
    });
  }

  getMonthlyBudget(): number {
    const monthlyBudgets = this.budgets.filter(b => b.period === 'monthly');
    return monthlyBudgets.reduce((sum, b) => sum + this.parseAmount(b.limit), 0);
  }

  getRemainingBudget(year?: number, month?: number): number {
    const d = year !== undefined && month !== undefined ? { year, month } : { year: new Date().getFullYear(), month: new Date().getMonth() };
    const monthlyExpenses = this.getTotalExpensesForMonth(d.year, d.month);
    return this.getMonthlyBudget() - monthlyExpenses;
  }

  /**
   * Solde cumulé à la fin du mois précédent (tous les mois avant year/month).
   * Utilisé pour reporter le "reste" d'un mois sur le suivant.
   */
  getCumulativeBalanceBeforeMonth(year: number, month: number): number {
    let balance = 0;
    // Parcourir tous les salaires et dépenses pour calculer le solde jusqu'à (year, month) exclu
    const allMonths = new Set<string>();
    this.salaries.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() < month)) {
        allMonths.add(key);
      }
    });
    this.expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() < month)) {
        allMonths.add(key);
      }
    });
    const sortedMonths = Array.from(allMonths).sort();
    for (const key of sortedMonths) {
      const [y, m] = key.split('-').map(Number);
      const sal = this.getSalaryForMonth(y, m);
      const exp = this.getTotalExpensesForMonth(y, m);
      balance += sal - exp;
    }
    return balance;
  }

  /**
   * Reste / solde disponible pour un mois : report du mois précédent + revenus du mois - dépenses du mois.
   * Le reste de janvier est bien pris en charge en février (et suivants).
   */
  getRemainingBalance(year?: number, month?: number): number {
    const d = year !== undefined && month !== undefined ? { year, month } : { year: new Date().getFullYear(), month: new Date().getMonth() };
    const previousBalance = this.getCumulativeBalanceBeforeMonth(d.year, d.month);
    const monthlySalary = this.getSalaryForMonth(d.year, d.month);
    const monthlyExpenses = this.getTotalExpensesForMonth(d.year, d.month);
    return previousBalance + monthlySalary - monthlyExpenses;
  }

  getSavingsSuggestions(year?: number, month?: number): string[] {
    const suggestions: string[] = [];
    const d = year !== undefined && month !== undefined ? { year, month } : { year: new Date().getFullYear(), month: new Date().getMonth() };
    const monthlyExpenses = this.getTotalExpensesForMonth(d.year, d.month);
    const expensesThisMonth = this.expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === d.year && ed.getMonth() === d.month;
    });

    if (monthlyExpenses > 0) {
      const foodExpenses = expensesThisMonth.filter(e => e.category === 'food').reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
      if (foodExpenses > monthlyExpenses * 0.3) {
        suggestions.push('Considérez réduire les dépenses alimentaires en cuisinant plus à la maison');
      }

      const leisureExpenses = expensesThisMonth.filter(e => e.category === 'leisure').reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
      if (leisureExpenses > monthlyExpenses * 0.2) {
        suggestions.push('Réduisez les dépenses de loisirs en cherchant des activités gratuites');
      }
    }

    return suggestions;
  }

  /** Dépenses d'un mois donné (pour affichage). */
  getExpensesForMonth(year: number, month: number): Expense[] {
    return this.expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === year && ed.getMonth() === month;
    });
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
        this.savingsGoalsCache$ = null;
      })
    );
  }

  /** Normalize API wallet card to WalletCard (id, isDefault, color, currency from raw or dataValues). */
  private normalizeWalletCard(c: WalletCard): WalletCard {
    const raw = c as unknown as Record<string, unknown>;
    const data = (raw && typeof raw['dataValues'] === 'object' ? raw['dataValues'] : raw) as Record<string, unknown>;
    const id = typeof c.id === 'number' ? c.id.toString() : String(c.id ?? '');
    const isDefault = Boolean(data['isDefault'] ?? raw['isDefault']);
    const colorVal = data['color'] ?? raw['color'];
    const color = colorVal == null ? null : (String(colorVal).trim() || null);
    const currencyVal = data['currency'] ?? raw['currency'];
    const currency = currencyVal == null ? null : (String(currencyVal).trim() || null);
    return { ...c, id, isDefault, color, currency };
  }

  // Wallet cards
  getWalletCards(): WalletCard[] {
    return this.walletCards.map(c => ({ ...c, id: typeof c.id === 'number' ? c.id.toString() : c.id }));
  }

  getWalletCardsObservable(): Observable<WalletCard[]> {
    if (!this.walletCardsCache$) {
      this.walletCardsCache$ = this.apiService.get<ApiResponse<WalletCard[]>>('/finance/wallet-cards').pipe(
        map(response => (response.data || []).map(c => this.normalizeWalletCard(c))),
        tap(cards => { this.walletCards = cards; }),
        shareReplay(1)
      );
    }
    return this.walletCardsCache$;
  }

  getDefaultWalletCard(): WalletCard | null {
    const def = this.walletCards.find(c => c.isDefault);
    return def ?? this.walletCards[0] ?? null;
  }

  addWalletCard(card: Omit<WalletCard, 'id' | 'isDefault'> & { isDefault?: boolean }): Observable<WalletCard> {
    return this.apiService.post<ApiResponse<WalletCard>>('/finance/wallet-cards', {
      name: card.name ?? undefined,
      holderName: card.holderName,
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      rib: card.rib ?? undefined,
      currency: card.currency ?? undefined,
      color: card.color ?? undefined,
      isDefault: card.isDefault
    }).pipe(
      map(response => response.data!),
      tap(newCard => {
        const normalized = this.normalizeWalletCard(newCard);
        if (!this.walletCards.some(c => String(c.id) === String(normalized.id))) {
          this.walletCards = [...this.walletCards, normalized];
        } else {
          this.walletCards = this.walletCards.map(c => String(c.id) === String(normalized.id) ? normalized : c);
        }
        this.walletCardsCache$ = null;
      })
    );
  }

  updateWalletCard(id: string, updates: Partial<Pick<WalletCard, 'name' | 'holderName' | 'cardNumber' | 'expiryDate' | 'rib' | 'currency' | 'color' | 'isDefault'>>): Observable<WalletCard> {
    return this.apiService.put<ApiResponse<WalletCard>>(`/finance/wallet-cards/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updated => {
        const normalized = this.normalizeWalletCard(updated);
        this.walletCards = this.walletCards.map(c => String(c.id) === String(id) ? normalized : c);
        if (updates.isDefault === true) {
          this.walletCards = this.walletCards.map(c => ({
            ...c,
            isDefault: String(c.id) === String(id)
          }));
        }
        this.walletCardsCache$ = null;
      })
    );
  }

  deleteWalletCard(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<unknown>>(`/finance/wallet-cards/${id}`).pipe(
      map(response => response.success),
      tap(success => {
        if (success) {
          this.walletCards = this.walletCards.filter(c => String(c.id) !== id);
          this.walletCardsCache$ = null;
        }
      })
    );
  }

  invalidateWalletCardsCache(): void {
    this.walletCardsCache$ = null;
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      // Do NOT load expenses/salaries here without card filter – they would overwrite per-card data.
      // Expenses and salaries are loaded per card in Finance (loadData) and for default card in Home.
      forkJoin({
        budgets: this.getBudgetsObservable(),
        savingsGoals: this.getSavingsGoalsObservable(),
        categories: this.getCustomCategoriesObservable(),
        walletCards: this.getWalletCardsObservable()
      }).subscribe({
        next: () => {
          // Load default card's data so Home and other consumers see a balance (per-card)
          const defaultCard = this.getDefaultWalletCard();
          const cardId = defaultCard?.id != null ? String(defaultCard.id) : null;
          if (cardId) {
            this.getExpensesForCard(cardId).subscribe({ error: () => {} });
            this.getSalariesForCard(cardId).subscribe({ error: () => {} });
          }
        },
        error: (err) => console.error('Error loading finance data:', err)
      });
    } else {
      this.expenses = [];
      this.budgets = [];
      this.savingsGoals = [];
      this.salaries = [];
      this.customCategories = [];
      this.walletCards = [];
    }
  }
}
