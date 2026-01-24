import { Injectable } from '@angular/core';
import { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } from '../models/health.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private meals: Meal[] = [];
  private activities: PhysicalActivity[] = [];
  private sleepRecords: SleepRecord[] = [];
  private waterIntakes: WaterIntake[] = [];
  private meditationSessions: MeditationSession[] = [];

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur pour recharger les données
    this.authService.currentUser$.subscribe(() => {
      this.loadFromStorage();
    });
    this.loadFromStorage();
  }

  // Meal methods
  getMeals(): Meal[] {
    return [...this.meals];
  }

  addMeal(meal: Omit<Meal, 'id'>): Meal {
    const newMeal: Meal = {
      ...meal,
      id: this.generateId()
    };
    this.meals.push(newMeal);
    this.saveToStorage();
    return newMeal;
  }

  deleteMeal(id: string): boolean {
    const index = this.meals.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.meals.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getMealsForDate(date: Date): Meal[] {
    const dateStr = date.toDateString();
    return this.meals.filter(m => new Date(m.date).toDateString() === dateStr);
  }

  getTodayCalories(): number {
    const today = new Date();
    return this.getMealsForDate(today).reduce((sum, m) => sum + (m.calories || 0), 0);
  }

  // Physical Activity methods
  getActivities(): PhysicalActivity[] {
    return [...this.activities];
  }

  addActivity(activity: Omit<PhysicalActivity, 'id'>): PhysicalActivity {
    const newActivity: PhysicalActivity = {
      ...activity,
      id: this.generateId()
    };
    this.activities.push(newActivity);
    this.saveToStorage();
    return newActivity;
  }

  deleteActivity(id: string): boolean {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.activities.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getActivitiesForDate(date: Date): PhysicalActivity[] {
    const dateStr = date.toDateString();
    return this.activities.filter(a => new Date(a.date).toDateString() === dateStr);
  }

  getTodayActivityMinutes(): number {
    const today = new Date();
    return this.getActivitiesForDate(today).reduce((sum, a) => sum + a.duration, 0);
  }

  // Sleep methods
  getSleepRecords(): SleepRecord[] {
    return [...this.sleepRecords];
  }

  addSleepRecord(record: Omit<SleepRecord, 'id' | 'hours'>): SleepRecord {
    const hours = (new Date(record.wakeTime).getTime() - new Date(record.sleepTime).getTime()) / (1000 * 60 * 60);
    const newRecord: SleepRecord = {
      ...record,
      id: this.generateId(),
      hours: Math.round(hours * 10) / 10
    };
    this.sleepRecords.push(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  getLastSleepRecord(): SleepRecord | undefined {
    return this.sleepRecords.length > 0 
      ? this.sleepRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : undefined;
  }

  // Water Intake methods
  getWaterIntakes(): WaterIntake[] {
    return [...this.waterIntakes];
  }

  addWaterIntake(intake: Omit<WaterIntake, 'id'>): WaterIntake {
    const newIntake: WaterIntake = {
      ...intake,
      id: this.generateId()
    };
    this.waterIntakes.push(newIntake);
    this.saveToStorage();
    return newIntake;
  }

  getTodayWaterIntake(): number {
    const today = new Date();
    const dateStr = today.toDateString();
    return this.waterIntakes
      .filter(w => new Date(w.date).toDateString() === dateStr)
      .reduce((sum, w) => sum + w.amount, 0);
  }

  // Meditation methods
  getMeditationSessions(): MeditationSession[] {
    return [...this.meditationSessions];
  }

  addMeditationSession(session: Omit<MeditationSession, 'id'>): MeditationSession {
    const newSession: MeditationSession = {
      ...session,
      id: this.generateId()
    };
    this.meditationSessions.push(newSession);
    this.saveToStorage();
    return newSession;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    const mealsKey = this.authService.getUserStorageKey('meals');
    const activitiesKey = this.authService.getUserStorageKey('activities');
    const sleepKey = this.authService.getUserStorageKey('sleep');
    const waterKey = this.authService.getUserStorageKey('water');
    const meditationKey = this.authService.getUserStorageKey('meditation');
    localStorage.setItem(mealsKey, JSON.stringify(this.meals));
    localStorage.setItem(activitiesKey, JSON.stringify(this.activities));
    localStorage.setItem(sleepKey, JSON.stringify(this.sleepRecords));
    localStorage.setItem(waterKey, JSON.stringify(this.waterIntakes));
    localStorage.setItem(meditationKey, JSON.stringify(this.meditationSessions));
  }

  private loadFromStorage(): void {
    const mealsKey = this.authService.getUserStorageKey('meals');
    const activitiesKey = this.authService.getUserStorageKey('activities');
    const sleepKey = this.authService.getUserStorageKey('sleep');
    const waterKey = this.authService.getUserStorageKey('water');
    const meditationKey = this.authService.getUserStorageKey('meditation');
    const mealsStr = localStorage.getItem(mealsKey);
    const activitiesStr = localStorage.getItem(activitiesKey);
    const sleepStr = localStorage.getItem(sleepKey);
    const waterStr = localStorage.getItem(waterKey);
    const meditationStr = localStorage.getItem(meditationKey);

    if (mealsStr) {
      this.meals = JSON.parse(mealsStr).map((m: any) => ({ ...m, date: new Date(m.date) }));
    }
    if (activitiesStr) {
      this.activities = JSON.parse(activitiesStr).map((a: any) => ({ ...a, date: new Date(a.date) }));
    }
    if (sleepStr) {
      this.sleepRecords = JSON.parse(sleepStr).map((s: any) => ({
        ...s,
        date: new Date(s.date),
        sleepTime: new Date(s.sleepTime),
        wakeTime: new Date(s.wakeTime)
      }));
    }
    if (waterStr) {
      this.waterIntakes = JSON.parse(waterStr).map((w: any) => ({ ...w, date: new Date(w.date) }));
    }
    if (meditationStr) {
      this.meditationSessions = JSON.parse(meditationStr).map((m: any) => ({ ...m, date: new Date(m.date) }));
    }
  }
}


