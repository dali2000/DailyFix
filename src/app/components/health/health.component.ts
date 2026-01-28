import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService } from '../../services/health.service';
import { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } from '../../models/health.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './health.component.html',
  styleUrl: './health.component.css'
})
export class HealthComponent implements OnInit, OnDestroy {
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
  private dataSubscription?: Subscription;

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  loadData(): void {
    // Charger toutes les données depuis l'API
    this.healthService.getMealsObservable().subscribe({
      next: (meals) => {
        this.meals = meals.map((m: any) => ({ ...m, id: m.id.toString(), date: new Date(m.date) }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading meals:', error)
    });

    this.healthService.getActivitiesObservable().subscribe({
      next: (activities) => {
        this.activities = activities.map((a: any) => ({ ...a, id: a.id.toString(), date: new Date(a.date) }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading activities:', error)
    });

    this.healthService.getSleepRecordsObservable().subscribe({
      next: (records) => {
        this.sleepRecords = records.map((s: any) => ({
          ...s,
          id: s.id.toString(),
          date: new Date(s.date),
          sleepTime: new Date(s.sleepTime),
          wakeTime: new Date(s.wakeTime)
        }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading sleep records:', error)
    });

    this.healthService.getMeditationSessionsObservable().subscribe({
      next: (sessions) => {
        this.meditationSessions = sessions.map((m: any) => ({ ...m, id: m.id.toString(), date: new Date(m.date) }));
        this.updateOverview();
      },
      error: (error) => console.error('Error loading meditation sessions:', error)
    });
  }

  updateOverview(): void {
    this.todayCalories = this.healthService.getTodayCalories();
    this.todayActivityMinutes = this.healthService.getTodayActivityMinutes();
    this.todayWaterIntake = this.healthService.getTodayWaterIntake();
    const lastSleep = this.healthService.getLastSleepRecord();
    this.lastSleepHours = lastSleep?.hours || 0;
  }

  // Meal methods
  closeMealModal(): void {
    this.showMealForm = false;
    this.newMeal = { type: 'breakfast' };
  }

  closeActivityModal(): void {
    this.showActivityForm = false;
    this.newActivity = {};
  }

  closeSleepModal(): void {
    this.showSleepForm = false;
    this.newSleep = { quality: 'good' };
  }

  closeMeditationModal(): void {
    this.showMeditationForm = false;
    this.newMeditation = { duration: 10, type: 'guided' };
  }

  closeWaterModal(): void {
    this.showWaterForm = false;
    this.waterAmount = 0.5;
  }

  addMeal(): void {
    if (!this.newMeal.name) return;
    this.healthService.addMeal({
      name: this.newMeal.name!,
      type: this.newMeal.type || 'breakfast',
      calories: this.newMeal.calories,
      date: new Date(),
      notes: this.newMeal.notes
    }).subscribe({
      next: () => {
        this.showMealForm = false;
        this.newMeal = { type: 'breakfast' };
        this.loadData();
      }
    });
  }

  deleteMeal(id: string): void {
    this.healthService.deleteMeal(id).subscribe({
      next: () => {
        this.loadData();
      }
    });
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
    }).subscribe({
      next: () => {
        this.showActivityForm = false;
        this.newActivity = {};
        this.loadData();
      }
    });
  }

  deleteActivity(id: string): void {
    this.healthService.deleteActivity(id).subscribe({
      next: () => {
        this.loadData();
      }
    });
  }

  // Sleep methods
  addSleepRecord(): void {
    if (!this.newSleep.sleepTime || !this.newSleep.wakeTime) return;
    this.healthService.addSleepRecord({
      date: new Date(),
      sleepTime: new Date(this.newSleep.sleepTime!),
      wakeTime: new Date(this.newSleep.wakeTime!),
      quality: this.newSleep.quality || 'good'
    }).subscribe({
      next: () => {
        this.showSleepForm = false;
        this.newSleep = { quality: 'good' };
        this.loadData();
      }
    });
  }

  // Water methods
  addWaterIntake(): void {
    this.healthService.addWaterIntake({
      date: new Date(),
      amount: this.waterAmount
    }).subscribe({
      next: () => {
        this.showWaterForm = false;
        this.waterAmount = 0.5;
        this.loadData();
      }
    });
  }

  // Meditation methods
  addMeditationSession(): void {
    this.healthService.addMeditationSession({
      date: new Date(),
      duration: this.newMeditation.duration || 10,
      type: this.newMeditation.type || 'guided',
      notes: this.newMeditation.notes
    }).subscribe({
      next: () => {
        this.showMeditationForm = false;
        this.newMeditation = { duration: 10, type: 'guided' };
        this.loadData();
      }
    });
  }

  deleteMeditationSession(id: string): void {
    this.healthService.deleteMeditationSession(id).subscribe({
      next: () => {
        this.loadData();
      }
    });
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


