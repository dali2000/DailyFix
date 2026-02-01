import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WellnessService } from '../../services/wellness.service';
import { ToastService } from '../../services/toast.service';
import { JournalEntry, PersonalGoal, StressManagement } from '../../models/wellness.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { CountUpComponent } from '../shared/count-up/count-up.component';

@Component({
  selector: 'app-wellness',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe, EmptyStateComponent, ConfirmDialogComponent, CountUpComponent],
  templateUrl: './wellness.component.html',
  styleUrl: './wellness.component.css'
})
export class WellnessComponent implements OnInit, AfterViewInit {
  activeTab: 'journal' | 'goals' | 'stress' = 'journal';

  progressReady = false;

  journalEntries: JournalEntry[] = [];
  personalGoals: PersonalGoal[] = [];
  stressRecords: StressManagement[] = [];

  showJournalForm = false;
  showGoalForm = false;
  showStressForm = false;
  showDeleteEntryConfirm = false;
  showDeleteGoalConfirm = false;
  itemToDelete: string | null = null;
  
  newEntry: Partial<JournalEntry> = {};
  newGoal: Partial<PersonalGoal> = { category: 'personal' };
  newStress: Partial<StressManagement> = { stressLevel: 5 };
  
  selectedEntry: JournalEntry | null = null;
  
  averageStressLevel = 0;
  stressTips: string[] = [];

  goalCategories = ['health', 'career', 'personal', 'financial', 'other'];
  moods = ['very-happy', 'happy', 'neutral', 'sad', 'very-sad'];

  constructor(
    private wellnessService: WellnessService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => (this.progressReady = true), 80);
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
        this.toastService.success('Entrée ajoutée');
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || 'Erreur')
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
        this.toastService.success('Entrée modifiée');
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || 'Erreur')
    });
  }

  deleteJournalEntry(id: string): void {
    this.itemToDelete = id;
    this.showDeleteEntryConfirm = true;
  }

  confirmDeleteEntry(): void {
    if (!this.itemToDelete) return;
    this.wellnessService.deleteJournalEntry(this.itemToDelete).subscribe({
      next: () => {
        this.loadData();
        this.toastService.success('Entrée supprimée');
        this.showDeleteEntryConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Erreur');
        this.showDeleteEntryConfirm = false;
      }
    });
  }

  cancelDeleteEntry(): void {
    this.showDeleteEntryConfirm = false;
    this.itemToDelete = null;
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
        this.toastService.success('Objectif créé');
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || 'Erreur')
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
    this.itemToDelete = id;
    this.showDeleteGoalConfirm = true;
  }

  confirmDeleteGoal(): void {
    if (!this.itemToDelete) return;
    this.wellnessService.deletePersonalGoal(this.itemToDelete).subscribe({
      next: () => {
        this.loadData();
        this.toastService.success('Objectif supprimé');
        this.showDeleteGoalConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Erreur');
        this.showDeleteGoalConfirm = false;
      }
    });
  }

  cancelDeleteGoal(): void {
    this.showDeleteGoalConfirm = false;
    this.itemToDelete = null;
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
        this.toastService.success('Enregistrement ajouté');
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || 'Erreur')
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


