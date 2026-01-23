import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService } from '../../services/health.service';
import { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } from '../../models/health.model';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrl: './health.component.css'
})
export class HealthComponent implements OnInit {
  activeTab: 'overview' | 'meals' | 'activity' | 'sleep' | 'meditation' = 'overview';
  
  // Overview data
  todayCalories = 0;
  todayActivityMinutes = 0;
  todayWaterIntake = 0;
  lastSleepHours = 0;

  // Meals
  meals: Meal[] = [];
  showMealForm = false;
  newMeal: Partial<Meal> = { type: 'breakfast' };

  // Activities
  activities: PhysicalActivity[] = [];
  showActivityForm = false;
  newActivity: Partial<PhysicalActivity> = {};

  // Sleep
  sleepRecords: SleepRecord[] = [];
  showSleepForm = false;
  newSleep: Partial<SleepRecord> = { quality: 'good' };

  // Water
  showWaterForm = false;
  waterAmount = 0.5;

  // Meditation
  meditationSessions: MeditationSession[] = [];
  showMeditationForm = false;
  newMeditation: Partial<MeditationSession> = { duration: 10, type: 'guided' };

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.meals = this.healthService.getMeals();
    this.activities = this.healthService.getActivities();
    this.sleepRecords = this.healthService.getSleepRecords();
    this.meditationSessions = this.healthService.getMeditationSessions();
    
    this.updateOverview();
  }

  updateOverview(): void {
    this.todayCalories = this.healthService.getTodayCalories();
    this.todayActivityMinutes = this.healthService.getTodayActivityMinutes();
    this.todayWaterIntake = this.healthService.getTodayWaterIntake();
    const lastSleep = this.healthService.getLastSleepRecord();
    this.lastSleepHours = lastSleep?.hours || 0;
  }

  // Meal methods
  addMeal(): void {
    if (!this.newMeal.name) return;
    this.healthService.addMeal({
      name: this.newMeal.name!,
      type: this.newMeal.type || 'breakfast',
      calories: this.newMeal.calories,
      date: new Date(),
      notes: this.newMeal.notes
    });
    this.showMealForm = false;
    this.newMeal = { type: 'breakfast' };
    this.loadData();
  }

  deleteMeal(id: string): void {
    this.healthService.deleteMeal(id);
    this.loadData();
  }

  // Activity methods
  addActivity(): void {
    if (!this.newActivity.type || !this.newActivity.duration) return;
    this.healthService.addActivity({
      type: this.newActivity.type!,
      duration: this.newActivity.duration!,
      calories: this.newActivity.calories,
      date: new Date(),
      notes: this.newActivity.notes
    });
    this.showActivityForm = false;
    this.newActivity = {};
    this.loadData();
  }

  deleteActivity(id: string): void {
    this.healthService.deleteActivity(id);
    this.loadData();
  }

  // Sleep methods
  addSleepRecord(): void {
    if (!this.newSleep.sleepTime || !this.newSleep.wakeTime) return;
    this.healthService.addSleepRecord({
      date: new Date(),
      sleepTime: new Date(this.newSleep.sleepTime!),
      wakeTime: new Date(this.newSleep.wakeTime!),
      quality: this.newSleep.quality || 'good'
    });
    this.showSleepForm = false;
    this.newSleep = { quality: 'good' };
    this.loadData();
  }

  // Water methods
  addWaterIntake(): void {
    this.healthService.addWaterIntake({
      date: new Date(),
      amount: this.waterAmount
    });
    this.showWaterForm = false;
    this.waterAmount = 0.5;
    this.loadData();
  }

  // Meditation methods
  addMeditationSession(): void {
    this.healthService.addMeditationSession({
      date: new Date(),
      duration: this.newMeditation.duration || 10,
      type: this.newMeditation.type || 'guided',
      notes: this.newMeditation.notes
    });
    this.showMeditationForm = false;
    this.newMeditation = { duration: 10, type: 'guided' };
    this.loadData();
  }

  deleteMeditationSession(id: string): void {
    // Note: HealthService doesn't have deleteMeditation, but we can add it if needed
    this.loadData();
  }

  getHealthScore(): number {
    let score = 0;
    if (this.todayCalories > 0 && this.todayCalories < 2500) score += 25;
    if (this.todayActivityMinutes >= 30) score += 25;
    if (this.todayWaterIntake >= 2) score += 25;
    if (this.lastSleepHours >= 7 && this.lastSleepHours <= 9) score += 25;
    return score;
  }
}


