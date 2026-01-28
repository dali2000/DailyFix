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
import { I18nService } from '../../services/i18n.service';
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
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    // Les admins peuvent accéder à /home s'ils le souhaitent (via le lien "Application" dans la sidebar admin)
    // On ne redirige plus automatiquement les admins vers /admin
    
    // Charger le nom de l'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user && user.fullName) {
        // Extraire le prénom (premier mot du nom complet)
        const firstName = user.fullName.split(' ')[0];
        this.userName = firstName;
      } else {
        this.userName = '';
      }
    });
    
    this.loadDashboardData();
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

    // Finance - les données sont déjà chargées par le service
    this.financeService.getExpensesObservable().subscribe({
      next: () => {
        const now = new Date();
        this.monthlyBudget = this.financeService.getMonthlyBudget();
        this.monthlyExpenses = this.financeService.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
        this.remainingBudget = this.financeService.getRemainingBudget();
        this.monthlySalary = this.financeService.getMonthlySalary();
        this.remainingBalance = this.financeService.getRemainingBalance();
        this.loadFinanceChartData();
        this.loadAppStatistics();
      }
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
    const expenses = this.financeService.getExpenses();
    
    // Expenses by category
    const categoryCounts: { [key: string]: number } = {};
    const categories = ['food', 'shopping', 'health', 'leisure', 'transport', 'bills', 'other'];
    const categoryNames: { [key: string]: string } = {
      'food': this.i18n.instant('finance.food'),
      'shopping': this.i18n.instant('finance.shopping'),
      'health': this.i18n.instant('finance.health'),
      'leisure': this.i18n.instant('finance.leisure'),
      'transport': this.i18n.instant('finance.transport'),
      'bills': this.i18n.instant('finance.bills'),
      'other': this.i18n.instant('finance.other')
    };

    expenses.forEach(expense => {
      categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + expense.amount;
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    this.expenseCategoryData = categories.map(cat => ({
      category: categoryNames[cat],
      amount: categoryCounts[cat] || 0,
      percentage: totalExpenses > 0 ? ((categoryCounts[cat] || 0) / totalExpenses) * 100 : 0
    })).filter(item => item.amount > 0);

    // Monthly expense history (last 6 months)
    this.monthlyExpenseHistory = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthExpenses = this.financeService.getTotalExpensesForMonth(date.getFullYear(), date.getMonth());
      this.monthlyExpenseHistory.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        amount: monthExpenses
      });
    }
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
