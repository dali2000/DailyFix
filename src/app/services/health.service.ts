import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged } from 'rxjs';
import { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } from '../models/health.model';
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
export class HealthService {
  private meals: Meal[] = [];
  private activities: PhysicalActivity[] = [];
  private sleepRecords: SleepRecord[] = [];
  private waterIntakes: WaterIntake[] = [];
  private meditationSessions: MeditationSession[] = [];

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
        this.meals = [];
        this.activities = [];
        this.sleepRecords = [];
        this.waterIntakes = [];
        this.meditationSessions = [];
      }
    });
  }

  // Meal methods
  getMeals(): Meal[] {
    return [...this.meals];
  }

  getMealsObservable(): Observable<Meal[]> {
    return this.apiService.get<ApiResponse<Meal[]>>('/health/meals').pipe(
      map(response => response.data || []),
      tap(meals => this.meals = meals.map(m => ({ ...m, id: m.id.toString(), date: new Date(m.date) })))
    );
  }

  addMeal(meal: Omit<Meal, 'id'>): Observable<Meal> {
    return this.apiService.post<ApiResponse<Meal>>('/health/meals', meal).pipe(
      map(response => response.data!),
      tap(newMeal => {
        this.meals.push({ ...newMeal, id: newMeal.id.toString(), date: new Date(newMeal.date) });
      })
    );
  }

  updateMeal(id: string, updates: Partial<Meal>): Observable<Meal> {
    return this.apiService.put<ApiResponse<Meal>>(`/health/meals/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedMeal => {
        const index = this.meals.findIndex(m => m.id === id);
        if (index !== -1) {
          this.meals[index] = { ...updatedMeal, id: updatedMeal.id.toString(), date: new Date(updatedMeal.date) };
        }
      })
    );
  }

  deleteMeal(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/health/meals/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.meals.findIndex(m => m.id === id);
        if (index !== -1) {
          this.meals.splice(index, 1);
        }
      })
    );
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

  getActivitiesObservable(): Observable<PhysicalActivity[]> {
    return this.apiService.get<ApiResponse<PhysicalActivity[]>>('/health/activities').pipe(
      map(response => response.data || []),
      tap(activities => this.activities = activities.map(a => ({ ...a, id: a.id.toString(), date: new Date(a.date) })))
    );
  }

  addActivity(activity: Omit<PhysicalActivity, 'id'>): Observable<PhysicalActivity> {
    return this.apiService.post<ApiResponse<PhysicalActivity>>('/health/activities', activity).pipe(
      map(response => response.data!),
      tap(newActivity => {
        this.activities.push({ ...newActivity, id: newActivity.id.toString(), date: new Date(newActivity.date) });
      })
    );
  }

  updateActivity(id: string, updates: Partial<PhysicalActivity>): Observable<PhysicalActivity> {
    return this.apiService.put<ApiResponse<PhysicalActivity>>(`/health/activities/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedActivity => {
        const index = this.activities.findIndex(a => a.id === id);
        if (index !== -1) {
          this.activities[index] = { ...updatedActivity, id: updatedActivity.id.toString(), date: new Date(updatedActivity.date) };
        }
      })
    );
  }

  deleteActivity(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/health/activities/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.activities.findIndex(a => a.id === id);
        if (index !== -1) {
          this.activities.splice(index, 1);
        }
      })
    );
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

  getSleepRecordsObservable(): Observable<SleepRecord[]> {
    return this.apiService.get<ApiResponse<SleepRecord[]>>('/health/sleep').pipe(
      map(response => response.data || []),
      tap(records => this.sleepRecords = records.map(s => ({
        ...s,
        id: s.id.toString(),
        date: new Date(s.date),
        sleepTime: new Date(s.sleepTime),
        wakeTime: new Date(s.wakeTime)
      })))
    );
  }

  addSleepRecord(record: Omit<SleepRecord, 'id' | 'hours'>): Observable<SleepRecord> {
    const hours = (new Date(record.wakeTime).getTime() - new Date(record.sleepTime).getTime()) / (1000 * 60 * 60);
    const recordWithHours = { ...record, hours: Math.round(hours * 10) / 10 };
    
    return this.apiService.post<ApiResponse<SleepRecord>>('/health/sleep', recordWithHours).pipe(
      map(response => response.data!),
      tap(newRecord => {
        this.sleepRecords.push({
          ...newRecord,
          id: newRecord.id.toString(),
          date: new Date(newRecord.date),
          sleepTime: new Date(newRecord.sleepTime),
          wakeTime: new Date(newRecord.wakeTime)
        });
      })
    );
  }

  updateSleepRecord(id: string, updates: Partial<SleepRecord>): Observable<SleepRecord> {
    return this.apiService.put<ApiResponse<SleepRecord>>(`/health/sleep/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedRecord => {
        const index = this.sleepRecords.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sleepRecords[index] = {
            ...updatedRecord,
            id: updatedRecord.id.toString(),
            date: new Date(updatedRecord.date),
            sleepTime: new Date(updatedRecord.sleepTime),
            wakeTime: new Date(updatedRecord.wakeTime)
          };
        }
      })
    );
  }

  deleteSleepRecord(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/health/sleep/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.sleepRecords.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sleepRecords.splice(index, 1);
        }
      })
    );
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

  getWaterIntakesObservable(): Observable<WaterIntake[]> {
    return this.apiService.get<ApiResponse<WaterIntake[]>>('/health/water').pipe(
      map(response => response.data || []),
      tap(intakes => this.waterIntakes = intakes.map(w => ({ ...w, id: w.id.toString(), date: new Date(w.date) })))
    );
  }

  addWaterIntake(intake: Omit<WaterIntake, 'id'>): Observable<WaterIntake> {
    return this.apiService.post<ApiResponse<WaterIntake>>('/health/water', intake).pipe(
      map(response => response.data!),
      tap(newIntake => {
        this.waterIntakes.push({ ...newIntake, id: newIntake.id.toString(), date: new Date(newIntake.date) });
      })
    );
  }

  updateWaterIntake(id: string, updates: Partial<WaterIntake>): Observable<WaterIntake> {
    return this.apiService.put<ApiResponse<WaterIntake>>(`/health/water/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedIntake => {
        const index = this.waterIntakes.findIndex(w => w.id === id);
        if (index !== -1) {
          this.waterIntakes[index] = { ...updatedIntake, id: updatedIntake.id.toString(), date: new Date(updatedIntake.date) };
        }
      })
    );
  }

  deleteWaterIntake(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/health/water/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.waterIntakes.findIndex(w => w.id === id);
        if (index !== -1) {
          this.waterIntakes.splice(index, 1);
        }
      })
    );
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

  getMeditationSessionsObservable(): Observable<MeditationSession[]> {
    return this.apiService.get<ApiResponse<MeditationSession[]>>('/health/meditation').pipe(
      map(response => response.data || []),
      tap(sessions => this.meditationSessions = sessions.map(m => ({ ...m, id: m.id.toString(), date: new Date(m.date) })))
    );
  }

  addMeditationSession(session: Omit<MeditationSession, 'id'>): Observable<MeditationSession> {
    return this.apiService.post<ApiResponse<MeditationSession>>('/health/meditation', session).pipe(
      map(response => response.data!),
      tap(newSession => {
        this.meditationSessions.push({ ...newSession, id: newSession.id.toString(), date: new Date(newSession.date) });
      })
    );
  }

  updateMeditationSession(id: string, updates: Partial<MeditationSession>): Observable<MeditationSession> {
    return this.apiService.put<ApiResponse<MeditationSession>>(`/health/meditation/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedSession => {
        const index = this.meditationSessions.findIndex(m => m.id === id);
        if (index !== -1) {
          this.meditationSessions[index] = { ...updatedSession, id: updatedSession.id.toString(), date: new Date(updatedSession.date) };
        }
      })
    );
  }

  deleteMeditationSession(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/health/meditation/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.meditationSessions.findIndex(m => m.id === id);
        if (index !== -1) {
          this.meditationSessions.splice(index, 1);
        }
      })
    );
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      this.getMealsObservable().subscribe({
        error: (error) => console.error('Error loading meals:', error)
      });
      this.getActivitiesObservable().subscribe({
        error: (error) => console.error('Error loading activities:', error)
      });
      this.getSleepRecordsObservable().subscribe({
        error: (error) => console.error('Error loading sleep records:', error)
      });
      this.getWaterIntakesObservable().subscribe({
        error: (error) => console.error('Error loading water intakes:', error)
      });
      this.getMeditationSessionsObservable().subscribe({
        error: (error) => console.error('Error loading meditation sessions:', error)
      });
    } else {
      this.meals = [];
      this.activities = [];
      this.sleepRecords = [];
      this.waterIntakes = [];
      this.meditationSessions = [];
    }
  }
}
