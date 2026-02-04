import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { HealthService } from '../../services/health.service';
import { FinanceService } from '../../services/finance.service';
import { HomeService } from '../../services/home.service';
import { SocialService } from '../../services/social.service';
import { WellnessService } from '../../services/wellness.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { I18nService } from '../../services/i18n.service';
import { GeminiService } from '../../services/gemini.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  tasksCompleted = 0;
  tasksCompletedToday = 0;
  totalTasks = 0;
  healthScore = 0;
  monthlyBudget = 0;
  monthlyExpenses = 0;
  remainingBudget = 0;
  remainingBalance = 0;
  monthlySalary = 0;
  upcomingEventsCount = 0;
  todayHouseholdTasksCount = 0;
  shoppingListsCount = 0;
  userName: string = '';
  dailyAdvice: string | null = null;
  dailyAdviceLoading = false;
  dailyAdviceError: string | null = null;
  showDailyAdviceCard = false;
  private userSubscription?: Subscription;

  upcomingHouseTasks: Array<{ name: string; date: string }> = [];
  upcomingEvents: Array<{ name: string; date: string }> = [];
  personalGoals: Array<{ name: string; done: boolean }> = [];

  // Chart data for tasks
  taskStatusData: Array<{ status: string; count: number; percentage: number }> = [];
  taskProgressPercentage = 0;

  // Chart data for finances
  expenseCategoryData: Array<{ category: string; amount: number; percentage: number }> = [];
  monthlyExpenseHistory: Array<{ month: string; amount: number }> = [];

  // Mois sélectionné pour "Dépenses par Catégorie" sur la home
  expenseChartMonth = new Date().getMonth();
  expenseChartYear = new Date().getFullYear();

  // App statistics
  totalExpenses = 0;
  totalSavingsGoals = 0;
  activeSavingsGoals = 0;
  totalHealthRecords = 0;
  totalSocialEvents = 0;

  // Résumé santé du jour (pour la carte Suivi Santé)
  todayCalories = 0;
  todayWaterLiters = 0;
  lastSleepHours: number | null = null;
  todayActivityMinutes = 0;
  todayMealsCount = 0;

  constructor(
    private taskService: TaskService,
    private healthService: HealthService,
    private financeService: FinanceService,
    private homeService: HomeService,
    private socialService: SocialService,
    private wellnessService: WellnessService,
    private authService: AuthService,
    private router: Router,
    private i18n: I18nService,
    public currencyService: CurrencyService,
    private geminiService: GeminiService
  ) {}

  get currencySymbol(): string {
    return this.currencyService.getSymbol();
  }

  ngOnInit(): void {
    // Charger le nom de l'utilisateur et les conseils du jour (si profil santé renseigné)
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user && user.fullName) {
        const firstName = user.fullName.split(' ')[0];
        this.userName = firstName;
      } else {
        this.userName = '';
      }
      const hasProfile = user && (user.height != null || user.weight != null || user.gender);
      // Show "Today's advice" for every logged-in user so they see the hint to fill profile in Settings
      this.showDailyAdviceCard = !!user;
      if (hasProfile && this.geminiService.isAvailable()) {
        this.loadDailyAdvice(user!);
      } else {
        this.dailyAdvice = null;
        this.dailyAdviceError = null;
        this.dailyAdviceLoading = false;
      }
    });

    this.loadDashboardData();
  }

  private loadDailyAdvice(user: { height?: number | null; weight?: number | null; gender?: string | null; locale?: string }): void {
    this.dailyAdviceLoading = true;
    this.dailyAdviceError = null;
    this.dailyAdvice = null;
    const locale = user.locale || this.i18n.currentLang || 'fr';
    this.geminiService.getDailyAdvice(
      { height: user.height, weight: user.weight, gender: user.gender },
      locale
    ).then((text) => {
      this.dailyAdvice = text;
      this.dailyAdviceLoading = false;
    }).catch((err) => {
      this.dailyAdviceError = err instanceof Error ? err.message : 'common.error';
      this.dailyAdviceLoading = false;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadDashboardData(): void {
    // S'assurer que toutes les données sont chargées depuis l'API
    // Les services chargent automatiquement, on utilise les données en cache
    
    // Tasks - les données sont déjà chargées par le service
    this.taskService.getTasksObservable().subscribe({
      next: () => {
        this.tasksCompleted = this.taskService.getCompletedTasksCount();
        this.tasksCompletedToday = this.taskService.getTasksCompletedTodayCount();
        this.totalTasks = this.taskService.getTotalTasksCount();
        this.loadTaskChartData();
        this.loadAppStatistics();
      }
    });

    // Health - mettre à jour le résumé quand une des données santé change
    const updateHealthSummary = () => {
      this.todayCalories = this.healthService.getTodayCalories();
      this.todayActivityMinutes = this.healthService.getTodayActivityMinutes();
      this.todayWaterLiters = this.healthService.getTodayWaterIntake();
      const lastSleep = this.healthService.getLastSleepRecord();
      this.lastSleepHours = lastSleep ? lastSleep.hours : null;
      this.todayMealsCount = this.healthService.getMealsForDate(new Date()).length;
      let score = 0;
      if (this.todayCalories > 0 && this.todayCalories < 2500) score += 25;
      if (this.todayActivityMinutes >= 30) score += 25;
      if (this.todayWaterLiters >= 2) score += 25;
      if (lastSleep && lastSleep.hours >= 7 && lastSleep.hours <= 9) score += 25;
      this.healthScore = score;
    };
    this.healthService.getMealsObservable().subscribe({ next: updateHealthSummary });
    this.healthService.getActivitiesObservable().subscribe({ next: updateHealthSummary });
    this.healthService.getSleepRecordsObservable().subscribe({ next: updateHealthSummary });
    this.healthService.getWaterIntakesObservable().subscribe({ next: updateHealthSummary });

    // Finance – charger les données de la carte par défaut (éviter de charger tout et écraser le filtre par carte)
    const updateHomeFinance = () => {
      const now = new Date();
      this.monthlyBudget = this.financeService.getMonthlyBudget();
      this.monthlyExpenses = this.financeService.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
      this.remainingBudget = this.financeService.getRemainingBudget();
      this.monthlySalary = this.financeService.getMonthlySalary();
      this.remainingBalance = this.financeService.getRemainingBalance();
      this.loadFinanceChartData();
      this.loadAppStatistics();
    };
    this.financeService.getWalletCardsObservable().subscribe({
      next: () => {
        const defaultCard = this.financeService.getDefaultWalletCard();
        const cardId = defaultCard?.id != null ? String(defaultCard.id) : null;
        if (cardId) {
          this.financeService.getExpensesForCard(cardId).subscribe({
            next: () => {
              this.financeService.getSalariesForCard(cardId).subscribe({
                next: () => updateHomeFinance(),
                error: () => updateHomeFinance()
              });
            },
            error: () => updateHomeFinance()
          });
        } else {
          this.financeService.getExpensesForCard(null).subscribe({
            next: () => {
              this.financeService.getSalariesForCard(null).subscribe({
                next: () => updateHomeFinance(),
                error: () => updateHomeFinance()
              });
            },
            error: () => updateHomeFinance()
          });
        }
      },
      error: () => updateHomeFinance()
    });

    // Home tasks - les données sont déjà chargées par le service
    this.homeService.getHouseholdTasksObservable().subscribe({
      next: () => {
        const upcomingTasks = this.homeService.getUpcomingHouseholdTasks();
      }
    });
    
    // Shopping lists - les données sont déjà chargées par le service
    this.homeService.getShoppingListsObservable().subscribe({
      next: () => {
        const allLists = this.homeService.getShoppingLists();
        this.shoppingListsCount = allLists.length;
      }
    });
    
    // Calculer le nombre de tâches ménagères non complétées
    this.homeService.getHouseholdTasksObservable().subscribe({
      next: () => {
        const allTasks = this.homeService.getHouseholdTasks();
        const incompleteTasks = allTasks.filter(task => !task.completed);
        this.todayHouseholdTasksCount = incompleteTasks.length;
        
        // Mettre à jour aussi les tâches à venir pour la section dashboard
        const upcomingTasks = this.homeService.getUpcomingHouseholdTasks();
        this.upcomingHouseTasks = upcomingTasks.slice(0, 3).map(task => ({
          name: task.name,
          date: task.nextDueDate ? this.formatDate(task.nextDueDate) : ''
        }));
      }
    });

    // Calendar events - les données sont déjà chargées par le service
    this.taskService.getEventsObservable().subscribe({
      next: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allCalendarEvents = this.taskService.getEvents();
        const upcomingCalendarEvents = allCalendarEvents.filter(e => {
          if (e.type !== 'event' && e.type !== 'reminder') return false;
          const eventDate = new Date(e.startDate);
          eventDate.setHours(0, 0, 0, 0);
          const endDate = e.endDate ? new Date(e.endDate) : eventDate;
          endDate.setHours(23, 59, 59, 999);
          return endDate >= today;
        });

        // Social events
        this.socialService.getEventsObservable().subscribe({
          next: () => {
            const upcomingSocialEvents = this.socialService.getUpcomingEvents();
            
            // Combine all events
            const allUpcomingEvents = [
              ...upcomingCalendarEvents.map(e => ({
                name: e.title,
                date: e.startDate,
                type: 'calendar'
              })),
              ...upcomingSocialEvents.map(e => ({
                name: e.title,
                date: e.date,
                type: 'social'
              }))
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            this.upcomingEventsCount = allUpcomingEvents.length;
            this.upcomingEvents = allUpcomingEvents.slice(0, 3).map(event => ({
              name: event.name,
              date: this.formatDate(event.date)
            }));
          }
        });
      }
    });

    // Personal goals - les données sont déjà chargées par le service
    this.wellnessService.getPersonalGoalsObservable().subscribe({
      next: () => {
        const activeGoals = this.wellnessService.getActiveGoals();
        this.personalGoals = activeGoals.slice(0, 3).map(goal => ({
          name: goal.title,
          done: goal.completed
        }));
      }
    });
  }

  loadTaskChartData(): void {
    // Les tâches sont déjà chargées par le service
    const allTasks = this.taskService.getTasks();
    const statusCounts: { [key: string]: number } = {
      'todo': 0,
      'in-progress': 0,
      'in-review': 0,
      'done': 0
    };

    allTasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const total = allTasks.length;
    this.taskStatusData = [
      { status: this.i18n.instant('tasks.todo'), count: statusCounts['todo'], percentage: total > 0 ? (statusCounts['todo'] / total) * 100 : 0 },
      { status: this.i18n.instant('tasks.inProgress'), count: statusCounts['in-progress'], percentage: total > 0 ? (statusCounts['in-progress'] / total) * 100 : 0 },
      { status: this.i18n.instant('tasks.inReview'), count: statusCounts['in-review'], percentage: total > 0 ? (statusCounts['in-review'] / total) * 100 : 0 },
      { status: this.i18n.instant('tasks.done'), count: statusCounts['done'], percentage: total > 0 ? (statusCounts['done'] / total) * 100 : 0 }
    ];

    this.taskProgressPercentage = total > 0 ? (statusCounts['done'] / total) * 100 : 0;
  }

  loadFinanceChartData(): void {
    const now = new Date();
    this.loadExpenseCategoryDataForMonth(this.expenseChartYear, this.expenseChartMonth);

    // Monthly expense history (last 6 months)
    this.monthlyExpenseHistory = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthExpenses = this.financeService.getTotalExpensesForMonth(date.getFullYear(), date.getMonth());
      this.monthlyExpenseHistory.push({
        month: date.toLocaleDateString(this.i18n.currentLang === 'ar' ? 'ar-EG' : this.i18n.currentLang === 'en' ? 'en-US' : 'fr-FR', { month: 'short', year: 'numeric' }),
        amount: monthExpenses
      });
    }
  }

  /** Dépenses par catégorie pour le mois sélectionné (home). */
  loadExpenseCategoryDataForMonth(year: number, month: number): void {
    const expenses = this.financeService.getExpenses();
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const categoryCounts: { [key: string]: number } = {};
    const defaultCategories = ['food', 'shopping', 'health', 'leisure', 'transport', 'bills', 'other'];
    const categoryNames: { [key: string]: string } = {
      'food': this.i18n.instant('finance.food'),
      'shopping': this.i18n.instant('finance.shopping'),
      'health': this.i18n.instant('finance.health'),
      'leisure': this.i18n.instant('finance.leisure'),
      'transport': this.i18n.instant('finance.transport'),
      'bills': this.i18n.instant('finance.bills'),
      'other': this.i18n.instant('finance.other')
    };
    monthExpenses.forEach(expense => {
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount)) || 0;
      categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + amount;
    });
    const totalForMonth = monthExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(String(e.amount)) || 0), 0);
    const categoryKeys = [...defaultCategories, ...Object.keys(categoryCounts).filter(c => !defaultCategories.includes(c))];
    this.expenseCategoryData = categoryKeys
      .filter(cat => (categoryCounts[cat] || 0) > 0)
      .map(cat => ({
        category: categoryNames[cat] || cat,
        amount: categoryCounts[cat] || 0,
        percentage: totalForMonth > 0 ? ((categoryCounts[cat] || 0) / totalForMonth) * 100 : 0
      }));
  }

  get expenseChartMonthLabel(): string {
    const date = new Date(this.expenseChartYear, this.expenseChartMonth, 1);
    const localeMap: { [key: string]: string } = { fr: 'fr-FR', en: 'en-US', ar: 'ar-EG' };
    const locale = localeMap[this.i18n.currentLang] || 'fr-FR';
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  get canGoToNextExpenseChartMonth(): boolean {
    const now = new Date();
    if (this.expenseChartYear < now.getFullYear()) return true;
    if (this.expenseChartYear > now.getFullYear()) return false;
    return this.expenseChartMonth < now.getMonth();
  }

  goToPrevExpenseChartMonth(): void {
    if (this.expenseChartMonth === 0) {
      this.expenseChartMonth = 11;
      this.expenseChartYear--;
    } else {
      this.expenseChartMonth--;
    }
    this.loadExpenseCategoryDataForMonth(this.expenseChartYear, this.expenseChartMonth);
  }

  goToNextExpenseChartMonth(): void {
    if (!this.canGoToNextExpenseChartMonth) return;
    if (this.expenseChartMonth === 11) {
      this.expenseChartMonth = 0;
      this.expenseChartYear++;
    } else {
      this.expenseChartMonth++;
    }
    this.loadExpenseCategoryDataForMonth(this.expenseChartYear, this.expenseChartMonth);
  }

  goToCurrentExpenseChartMonth(): void {
    const now = new Date();
    this.expenseChartYear = now.getFullYear();
    this.expenseChartMonth = now.getMonth();
    this.loadExpenseCategoryDataForMonth(this.expenseChartYear, this.expenseChartMonth);
  }

  loadAppStatistics(): void {
    const expenses = this.financeService.getExpenses();
    this.totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const savingsGoals = this.financeService.getSavingsGoals();
    this.totalSavingsGoals = savingsGoals.length;
    this.activeSavingsGoals = savingsGoals.filter(g => !g.deadline || new Date(g.deadline) >= new Date()).length;

    const meals = this.healthService.getMeals();
    const activities = this.healthService.getActivities();
    const sleepRecords = this.healthService.getSleepRecords();
    this.totalHealthRecords = meals.length + activities.length + sleepRecords.length;

    const socialEvents = this.socialService.getEvents();
    this.totalSocialEvents = socialEvents.length;
  }

  formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = new Date(date).toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    if (dateStr === todayStr) return '(' + this.i18n.instant('common.today') + ')';
    if (dateStr === tomorrowStr) return '(' + this.i18n.instant('common.tomorrow') + ')';
    return new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getMaxExpense(): number {
    if (this.monthlyExpenseHistory.length === 0) return 0;
    return Math.max(...this.monthlyExpenseHistory.map(item => item.amount));
  }
}
