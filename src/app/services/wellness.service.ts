import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged } from 'rxjs';
import { JournalEntry, PersonalGoal, StressManagement } from '../models/wellness.model';
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
export class WellnessService {
  private journalEntries: JournalEntry[] = [];
  private personalGoals: PersonalGoal[] = [];
  private stressRecords: StressManagement[] = [];

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
        this.journalEntries = [];
        this.personalGoals = [];
        this.stressRecords = [];
      }
    });
  }

  // Journal methods
  getJournalEntries(): JournalEntry[] {
    return [...this.journalEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getJournalEntriesObservable(): Observable<JournalEntry[]> {
    return this.apiService.get<ApiResponse<JournalEntry[]>>('/wellness/journal').pipe(
      map(response => response.data || []),
      tap(entries => this.journalEntries = entries.map(e => ({
        ...e,
        id: e.id.toString(),
        date: new Date(e.date)
      })))
    );
  }

  getJournalEntryById(id: string): JournalEntry | undefined {
    return this.journalEntries.find(e => e.id === id);
  }

  getJournalEntryByIdObservable(id: string): Observable<JournalEntry> {
    return this.apiService.get<ApiResponse<JournalEntry>>(`/wellness/journal/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): Observable<JournalEntry> {
    return this.apiService.post<ApiResponse<JournalEntry>>('/wellness/journal', entry).pipe(
      map(response => response.data!),
      tap(newEntry => {
        this.journalEntries.push({
          ...newEntry,
          id: newEntry.id.toString(),
          date: new Date(newEntry.date)
        });
      })
    );
  }

  updateJournalEntry(id: string, updates: Partial<JournalEntry>): Observable<JournalEntry> {
    return this.apiService.put<ApiResponse<JournalEntry>>(`/wellness/journal/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedEntry => {
        const index = this.journalEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.journalEntries[index] = {
            ...updatedEntry,
            id: updatedEntry.id.toString(),
            date: new Date(updatedEntry.date)
          };
        }
      })
    );
  }

  deleteJournalEntry(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/wellness/journal/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.journalEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.journalEntries.splice(index, 1);
        }
      })
    );
  }

  // Personal Goal methods
  getPersonalGoals(): PersonalGoal[] {
    return [...this.personalGoals];
  }

  getPersonalGoalsObservable(): Observable<PersonalGoal[]> {
    return this.apiService.get<ApiResponse<PersonalGoal[]>>('/wellness/goals').pipe(
      map(response => response.data || []),
      tap(goals => this.personalGoals = goals.map(g => ({
        ...g,
        id: g.id.toString(),
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined
      })))
    );
  }

  getPersonalGoalById(id: string): PersonalGoal | undefined {
    return this.personalGoals.find(g => g.id === id);
  }

  getPersonalGoalByIdObservable(id: string): Observable<PersonalGoal> {
    return this.apiService.get<ApiResponse<PersonalGoal>>(`/wellness/goals/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addPersonalGoal(goal: Omit<PersonalGoal, 'id' | 'progress' | 'completed'>): Observable<PersonalGoal> {
    return this.apiService.post<ApiResponse<PersonalGoal>>('/wellness/goals', goal).pipe(
      map(response => response.data!),
      tap(newGoal => {
        this.personalGoals.push({
          ...newGoal,
          id: newGoal.id.toString(),
          targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined
        });
      })
    );
  }

  updatePersonalGoal(id: string, updates: Partial<PersonalGoal>): Observable<PersonalGoal> {
    return this.apiService.put<ApiResponse<PersonalGoal>>(`/wellness/goals/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedGoal => {
        const index = this.personalGoals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.personalGoals[index] = {
            ...updatedGoal,
            id: updatedGoal.id.toString(),
            targetDate: updatedGoal.targetDate ? new Date(updatedGoal.targetDate) : undefined
          };
        }
      })
    );
  }

  deletePersonalGoal(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/wellness/goals/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.personalGoals.findIndex(g => g.id === id);
        if (index !== -1) {
          this.personalGoals.splice(index, 1);
        }
      })
    );
  }

  // Stress Management methods
  getStressRecords(): StressManagement[] {
    return [...this.stressRecords];
  }

  getStressRecordsObservable(): Observable<StressManagement[]> {
    return this.apiService.get<ApiResponse<StressManagement[]>>('/wellness/stress').pipe(
      map(response => response.data || []),
      tap(records => this.stressRecords = records.map(r => ({
        ...r,
        id: r.id.toString(),
        date: new Date(r.date)
      })))
    );
  }

  getStressRecordById(id: string): StressManagement | undefined {
    return this.stressRecords.find(r => r.id === id);
  }

  getStressRecordByIdObservable(id: string): Observable<StressManagement> {
    return this.apiService.get<ApiResponse<StressManagement>>(`/wellness/stress/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addStressRecord(record: Omit<StressManagement, 'id' | 'date'>): Observable<StressManagement> {
    return this.apiService.post<ApiResponse<StressManagement>>('/wellness/stress', record).pipe(
      map(response => response.data!),
      tap(newRecord => {
        this.stressRecords.push({
          ...newRecord,
          id: newRecord.id.toString(),
          date: new Date(newRecord.date)
        });
      })
    );
  }

  updateStressRecord(id: string, updates: Partial<StressManagement>): Observable<StressManagement> {
    return this.apiService.put<ApiResponse<StressManagement>>(`/wellness/stress/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedRecord => {
        const index = this.stressRecords.findIndex(r => r.id === id);
        if (index !== -1) {
          this.stressRecords[index] = {
            ...updatedRecord,
            id: updatedRecord.id.toString(),
            date: new Date(updatedRecord.date)
          };
        }
      })
    );
  }

  deleteStressRecord(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/wellness/stress/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.stressRecords.findIndex(r => r.id === id);
        if (index !== -1) {
          this.stressRecords.splice(index, 1);
        }
      })
    );
  }

  getActiveGoals(): PersonalGoal[] {
    return this.personalGoals.filter(g => !g.completed);
  }

  getCompletedGoals(): PersonalGoal[] {
    return this.personalGoals.filter(g => g.completed);
  }

  getAverageStressLevel(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentRecords = this.stressRecords.filter(r => {
      const recordDate = r.date instanceof Date ? r.date : new Date(r.date);
      return recordDate >= cutoffDate;
    });
    
    if (recentRecords.length === 0) return 0;
    
    const sum = recentRecords.reduce((acc, r) => acc + r.stressLevel, 0);
    return Math.round((sum / recentRecords.length) * 10) / 10;
  }

  getStressManagementTips(): string[] {
    const tips: string[] = [
      'Pratiquez la respiration profonde pendant 5 minutes',
      'Faites une promenade de 10 minutes',
      'Écoutez de la musique apaisante',
      'Essayez la méditation guidée',
      'Prenez une pause et buvez un verre d\'eau',
      'Faites quelques étirements',
      'Parlez à un ami ou un proche',
      'Notez vos pensées dans un journal'
    ];
    return tips;
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      this.getJournalEntriesObservable().subscribe({
        error: (error) => console.error('Error loading journal entries:', error)
      });
      this.getPersonalGoalsObservable().subscribe({
        error: (error) => console.error('Error loading personal goals:', error)
      });
      this.getStressRecordsObservable().subscribe({
        error: (error) => console.error('Error loading stress records:', error)
      });
    } else {
      this.journalEntries = [];
      this.personalGoals = [];
      this.stressRecords = [];
    }
  }
}
