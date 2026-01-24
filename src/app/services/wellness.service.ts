import { Injectable } from '@angular/core';
import { JournalEntry, PersonalGoal, StressManagement } from '../models/wellness.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WellnessService {
  private journalEntries: JournalEntry[] = [];
  private personalGoals: PersonalGoal[] = [];
  private stressRecords: StressManagement[] = [];

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur pour recharger les données
    this.authService.currentUser$.subscribe(() => {
      this.loadFromStorage();
    });
    this.loadFromStorage();
  }

  // Journal methods
  getJournalEntries(): JournalEntry[] {
    return [...this.journalEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getJournalEntryById(id: string): JournalEntry | undefined {
    return this.journalEntries.find(e => e.id === id);
  }

  addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: this.generateId(),
      date: new Date()
    };
    this.journalEntries.push(newEntry);
    this.saveToStorage();
    return newEntry;
  }

  updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const index = this.journalEntries.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.journalEntries[index] = { ...this.journalEntries[index], ...updates };
    this.saveToStorage();
    return this.journalEntries[index];
  }

  deleteJournalEntry(id: string): boolean {
    const index = this.journalEntries.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.journalEntries.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Personal Goal methods
  getPersonalGoals(): PersonalGoal[] {
    return [...this.personalGoals];
  }

  getPersonalGoalById(id: string): PersonalGoal | undefined {
    return this.personalGoals.find(g => g.id === id);
  }

  addPersonalGoal(goal: Omit<PersonalGoal, 'id' | 'progress' | 'completed'>): PersonalGoal {
    const newGoal: PersonalGoal = {
      ...goal,
      id: this.generateId(),
      progress: 0,
      completed: false
    };
    this.personalGoals.push(newGoal);
    this.saveToStorage();
    return newGoal;
  }

  updatePersonalGoal(id: string, updates: Partial<PersonalGoal>): PersonalGoal | null {
    const index = this.personalGoals.findIndex(g => g.id === id);
    if (index === -1) return null;
    this.personalGoals[index] = { ...this.personalGoals[index], ...updates };
    if (updates.progress !== undefined && updates.progress >= 100) {
      this.personalGoals[index].completed = true;
    }
    this.saveToStorage();
    return this.personalGoals[index];
  }

  deletePersonalGoal(id: string): boolean {
    const index = this.personalGoals.findIndex(g => g.id === id);
    if (index === -1) return false;
    this.personalGoals.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getActiveGoals(): PersonalGoal[] {
    return this.personalGoals.filter(g => !g.completed);
  }

  getCompletedGoals(): PersonalGoal[] {
    return this.personalGoals.filter(g => g.completed);
  }

  // Stress Management methods
  getStressRecords(): StressManagement[] {
    return [...this.stressRecords].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  addStressRecord(record: Omit<StressManagement, 'id' | 'date'>): StressManagement {
    const newRecord: StressManagement = {
      ...record,
      id: this.generateId(),
      date: new Date()
    };
    this.stressRecords.push(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  getAverageStressLevel(days: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const recentRecords = this.stressRecords.filter(r => new Date(r.date) >= cutoffDate);
    if (recentRecords.length === 0) return 0;
    const sum = recentRecords.reduce((acc, r) => acc + r.stressLevel, 0);
    return Math.round((sum / recentRecords.length) * 10) / 10;
  }

  getStressManagementTips(): string[] {
    return [
      'Pratiquez la respiration profonde pendant 5 minutes',
      'Faites une promenade de 10 minutes',
      'Écoutez de la musique apaisante',
      'Essayez la méditation guidée',
      'Notez trois choses pour lesquelles vous êtes reconnaissant',
      'Faites des étirements légers',
      'Buvez un verre d\'eau et prenez une pause',
      'Appelez un ami ou un proche'
    ];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    const journalKey = this.authService.getUserStorageKey('journal');
    const goalsKey = this.authService.getUserStorageKey('goals');
    const stressKey = this.authService.getUserStorageKey('stress');
    localStorage.setItem(journalKey, JSON.stringify(this.journalEntries));
    localStorage.setItem(goalsKey, JSON.stringify(this.personalGoals));
    localStorage.setItem(stressKey, JSON.stringify(this.stressRecords));
  }

  private loadFromStorage(): void {
    const journalKey = this.authService.getUserStorageKey('journal');
    const goalsKey = this.authService.getUserStorageKey('goals');
    const stressKey = this.authService.getUserStorageKey('stress');
    const journalStr = localStorage.getItem(journalKey);
    const goalsStr = localStorage.getItem(goalsKey);
    const stressStr = localStorage.getItem(stressKey);

    if (journalStr) {
      this.journalEntries = JSON.parse(journalStr).map((e: any) => ({ ...e, date: new Date(e.date) }));
    }
    if (goalsStr) {
      this.personalGoals = JSON.parse(goalsStr).map((g: any) => ({
        ...g,
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        milestones: g.milestones?.map((m: any) => ({
          ...m,
          targetDate: m.targetDate ? new Date(m.targetDate) : undefined
        }))
      }));
    }
    if (stressStr) {
      this.stressRecords = JSON.parse(stressStr).map((r: any) => ({ ...r, date: new Date(r.date) }));
    }
  }
}


