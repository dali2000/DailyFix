import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WellnessService } from '../../services/wellness.service';
import { JournalEntry, PersonalGoal, StressManagement } from '../../models/wellness.model';

@Component({
  selector: 'app-wellness',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  loadData(): void {
    this.journalEntries = this.wellnessService.getJournalEntries();
    this.personalGoals = this.wellnessService.getPersonalGoals();
    this.stressRecords = this.wellnessService.getStressRecords();
    this.averageStressLevel = this.wellnessService.getAverageStressLevel(7);
    this.stressTips = this.wellnessService.getStressManagementTips();
  }

  // Journal methods
  addJournalEntry(): void {
    if (!this.newEntry.content) return;
    this.wellnessService.addJournalEntry({
      title: this.newEntry.title,
      content: this.newEntry.content!,
      mood: this.newEntry.mood,
      tags: this.newEntry.tags
    });
    this.showJournalForm = false;
    this.newEntry = {};
    this.loadData();
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
    this.wellnessService.updateJournalEntry(this.selectedEntry.id, this.newEntry);
    this.showJournalForm = false;
    this.selectedEntry = null;
    this.newEntry = {};
    this.loadData();
  }

  deleteJournalEntry(id: string): void {
    if (confirm('Supprimer cette entrée ?')) {
      this.wellnessService.deleteJournalEntry(id);
      this.loadData();
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
    });
    this.showGoalForm = false;
    this.newGoal = { category: 'personal' };
    this.loadData();
  }

  updateGoalProgress(goal: PersonalGoal, progress: number): void {
    this.wellnessService.updatePersonalGoal(goal.id, { progress });
    this.loadData();
  }

  deletePersonalGoal(id: string): void {
    if (confirm('Supprimer cet objectif ?')) {
      this.wellnessService.deletePersonalGoal(id);
      this.loadData();
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
    });
    this.showStressForm = false;
    this.newStress = { stressLevel: 5 };
    this.loadData();
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


