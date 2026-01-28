import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WellnessService } from '../../services/wellness.service';
import { JournalEntry, PersonalGoal, StressManagement } from '../../models/wellness.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-wellness',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  templateUrl: './wellness.component.html',
  styleUrl: './wellness.component.css'
})
export class WellnessComponent implements OnInit {
  activeTab: 'journal' | 'goals' | 'stress' = 'journal';
  
  journalEntries: JournalEntry[] = [];
  personalGoals: PersonalGoal[] = [];
  stressRecords: StressManagement[] = [];
  
  showJournalForm = false;
  showGoalForm = false;
  showStressForm = false;
  
  newEntry: Partial<JournalEntry> = {};
  newGoal: Partial<PersonalGoal> = { category: 'personal' };
  newStress: Partial<StressManagement> = { stressLevel: 5 };
  
  selectedEntry: JournalEntry | null = null;
  
  averageStressLevel = 0;
  stressTips: string[] = [];

  goalCategories = ['health', 'career', 'personal', 'financial', 'other'];
  moods = ['very-happy', 'happy', 'neutral', 'sad', 'very-sad'];

  constructor(private wellnessService: WellnessService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    // Les subscriptions sont gérées dans les méthodes loadData
  }

  loadData(): void {
    // Charger toutes les données depuis l'API
    this.wellnessService.getJournalEntriesObservable().subscribe({
      next: (entries) => {
        this.journalEntries = entries.map((e: any) => ({
          ...e,
          id: e.id.toString(),
          date: new Date(e.date)
        }));
      },
      error: (error) => console.error('Error loading journal entries:', error)
    });

    this.wellnessService.getPersonalGoalsObservable().subscribe({
      next: (goals) => {
        this.personalGoals = goals.map((g: any) => ({
          ...g,
          id: g.id.toString(),
          targetDate: g.targetDate ? new Date(g.targetDate) : undefined
        }));
      },
      error: (error) => console.error('Error loading personal goals:', error)
    });

    this.wellnessService.getStressRecordsObservable().subscribe({
      next: (records) => {
        this.stressRecords = records.map((r: any) => ({
          ...r,
          id: r.id.toString(),
          date: new Date(r.date)
        }));
        this.averageStressLevel = this.wellnessService.getAverageStressLevel(7);
        this.stressTips = this.wellnessService.getStressManagementTips();
      },
      error: (error) => console.error('Error loading stress records:', error)
    });
  }

  // Journal methods
  addJournalEntry(): void {
    if (!this.newEntry.content) return;
    this.wellnessService.addJournalEntry({
      title: this.newEntry.title,
      content: this.newEntry.content!,
      mood: this.newEntry.mood,
      tags: this.newEntry.tags
    }).subscribe({
      next: () => {
        this.showJournalForm = false;
        this.newEntry = {};
        this.loadData();
      }
    });
  }

  closeJournalModal(): void {
    this.showJournalForm = false;
    this.selectedEntry = null;
    this.newEntry = {};
  }

  closeGoalModal(): void {
    this.showGoalForm = false;
    this.newGoal = { category: 'personal' };
  }

  closeStressModal(): void {
    this.showStressForm = false;
    this.newStress = { stressLevel: 5 };
  }

  editJournalEntry(entry: JournalEntry): void {
    this.selectedEntry = entry;
    this.newEntry = {
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags
    };
    this.showJournalForm = true;
  }

  updateJournalEntry(): void {
    if (!this.selectedEntry || !this.newEntry.content) return;
    this.wellnessService.updateJournalEntry(this.selectedEntry.id, this.newEntry).subscribe({
      next: () => {
        this.showJournalForm = false;
        this.selectedEntry = null;
        this.newEntry = {};
        this.loadData();
      }
    });
  }

  deleteJournalEntry(id: string): void {
    if (confirm('Supprimer cette entrée ?')) {
      this.wellnessService.deleteJournalEntry(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  // Goal methods
  addPersonalGoal(): void {
    if (!this.newGoal.title) return;
    this.wellnessService.addPersonalGoal({
      title: this.newGoal.title!,
      description: this.newGoal.description,
      category: this.newGoal.category || 'personal',
      targetDate: this.newGoal.targetDate ? new Date(this.newGoal.targetDate) : undefined
    }).subscribe({
      next: () => {
        this.showGoalForm = false;
        this.newGoal = { category: 'personal' };
        this.loadData();
      }
    });
  }

  updateGoalProgress(goal: PersonalGoal, progress: number): void {
    this.wellnessService.updatePersonalGoal(goal.id, { progress }).subscribe({
      next: () => {
        this.loadData();
      }
    });
  }

  deletePersonalGoal(id: string): void {
    if (confirm('Supprimer cet objectif ?')) {
      this.wellnessService.deletePersonalGoal(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  getActiveGoals(): PersonalGoal[] {
    return this.wellnessService.getActiveGoals();
  }

  getCompletedGoals(): PersonalGoal[] {
    return this.wellnessService.getCompletedGoals();
  }

  getGoalProgress(goal: PersonalGoal): number {
    return goal.progress;
  }

  // Stress methods
  addStressRecord(): void {
    if (!this.newStress.stressLevel) return;
    this.wellnessService.addStressRecord({
      stressLevel: this.newStress.stressLevel!,
      triggers: this.newStress.triggers,
      copingStrategies: this.newStress.copingStrategies,
      notes: this.newStress.notes
    }).subscribe({
      next: () => {
        this.showStressForm = false;
        this.newStress = { stressLevel: 5 };
        this.loadData();
      }
    });
  }

  getMoodEmoji(mood?: string): string {
    const emojis: { [key: string]: string } = {
      'very-happy': '😄',
      'happy': '😊',
      'neutral': '😐',
      'sad': '😔',
      'very-sad': '😢'
    };
    return emojis[mood || 'neutral'] || '😐';
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      health: 'Santé',
      career: 'Carrière',
      personal: 'Personnel',
      financial: 'Financier',
      other: 'Autre'
    };
    return names[category] || category;
  }

  getStressLevelColor(level: number): string {
    if (level <= 3) return '#4caf50';
    if (level <= 6) return '#ff9800';
    return '#f44336';
  }
}


