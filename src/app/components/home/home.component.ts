import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { HealthService } from '../../services/health.service';
import { FinanceService } from '../../services/finance.service';
import { HomeService } from '../../services/home.service';
import { SocialService } from '../../services/social.service';
import { WellnessService } from '../../services/wellness.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  tasksCompleted = 0;
  totalTasks = 0;
  healthScore = 0;
  monthlyBudget = 0;
  monthlyExpenses = 0;
  remainingBudget = 0;
  remainingBalance = 0;
  monthlySalary = 0;
  upcomingEventsCount = 0;

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

  constructor(
    private taskService: TaskService,
    private healthService: HealthService,
    private financeService: FinanceService,
    private homeService: HomeService,
    private socialService: SocialService,
    private wellnessService: WellnessService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Tasks
    this.tasksCompleted = this.taskService.getCompletedTasksCount();
    this.totalTasks = this.taskService.getTotalTasksCount();

    // Health
    const todayCalories = this.healthService.getTodayCalories();
    const todayActivity = this.healthService.getTodayActivityMinutes();
    const todayWater = this.healthService.getTodayWaterIntake();
    const lastSleep = this.healthService.getLastSleepRecord();
    let score = 0;
    if (todayCalories > 0 && todayCalories < 2500) score += 25;
    if (todayActivity >= 30) score += 25;
    if (todayWater >= 2) score += 25;
    if (lastSleep && lastSleep.hours >= 7 && lastSleep.hours <= 9) score += 25;
    this.healthScore = score;

    // Finance
    const now = new Date();
    this.monthlyBudget = this.financeService.getMonthlyBudget();
    this.monthlyExpenses = this.financeService.getTotalExpensesForMonth(now.getFullYear(), now.getMonth());
    this.remainingBudget = this.financeService.getRemainingBudget();
    this.monthlySalary = this.financeService.getMonthlySalary();
    this.remainingBalance = this.financeService.getRemainingBalance();

    // Home tasks
    const upcomingTasks = this.homeService.getUpcomingHouseholdTasks();
    this.upcomingHouseTasks = upcomingTasks.slice(0, 3).map(task => ({
      name: task.name,
      date: task.nextDueDate ? this.formatDate(task.nextDueDate) : ''
    }));

    // Calendar events and reminders
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

    // Personal goals
    const activeGoals = this.wellnessService.getActiveGoals();
    this.personalGoals = activeGoals.slice(0, 3).map(goal => ({
      name: goal.title,
      done: goal.completed
    }));

    // Load chart data
    this.loadTaskChartData();
    this.loadFinanceChartData();
    this.loadAppStatistics();
  }

  loadTaskChartData(): void {
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
      { status: 'À faire', count: statusCounts['todo'], percentage: total > 0 ? (statusCounts['todo'] / total) * 100 : 0 },
      { status: 'En cours', count: statusCounts['in-progress'], percentage: total > 0 ? (statusCounts['in-progress'] / total) * 100 : 0 },
      { status: 'En révision', count: statusCounts['in-review'], percentage: total > 0 ? (statusCounts['in-review'] / total) * 100 : 0 },
      { status: 'Terminé', count: statusCounts['done'], percentage: total > 0 ? (statusCounts['done'] / total) * 100 : 0 }
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
      'food': 'Alimentation',
      'shopping': 'Shopping',
      'health': 'Santé',
      'leisure': 'Loisirs',
      'transport': 'Transport',
      'bills': 'Factures',
      'other': 'Autre'
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

    if (dateStr === todayStr) return '(aujourd\'hui)';
    if (dateStr === tomorrowStr) return '(demain)';
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getMaxExpense(): number {
    if (this.monthlyExpenseHistory.length === 0) return 0;
    return Math.max(...this.monthlyExpenseHistory.map(item => item.amount));
  }
}
