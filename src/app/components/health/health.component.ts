import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService } from '../../services/health.service';
import { GeminiService, ChatMessage } from '../../services/gemini.service';
import { Meal, PhysicalActivity, SleepRecord, WaterIntake, MeditationSession } from '../../models/health.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
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

  // Water (input in cups, stored in liters: 1 cup = 0.25 L)
  showWaterForm = false;
  waterCups = 2;
  private readonly LITERS_PER_CUP = 0.25;

  get waterCupsToLiters(): number {
    return this.waterCups * this.LITERS_PER_CUP;
  }

  /** Play a short water drip/splash sound using Web Audio API */
  private playWaterSound(): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) { /* ignore */ }
  }

  // Meditation
  meditationSessions: MeditationSession[] = [];
  showMeditationForm = false;
  newMeditation: Partial<MeditationSession> = { duration: 10, type: 'guided' };
  private dataSubscription?: Subscription;

  // Discussion IA (Gemini) : cercle cliquable → ouvre le chat
  chatOpen = false;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  chatLoading = false;
  chatError: string | null = null;

  constructor(
    private healthService: HealthService,
    private geminiService: GeminiService
  ) {}

  get geminiAvailable(): boolean {
    return this.geminiService.isAvailable();
  }

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
    this.waterCups = 2;
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

  // Water methods (input in cups, convert to liters for storage)
  /** Add 1 cup (0.25 L) immediately when clicking the main button */
  addOneCup(): void {
    this.playWaterSound();
    this.healthService.addWaterIntake({
      date: new Date(),
      amount: this.LITERS_PER_CUP
    }).subscribe({
      next: () => this.loadData()
    });
  }

  addWaterIntake(): void {
    this.playWaterSound();
    const amountLiters = this.waterCups * this.LITERS_PER_CUP;
    this.healthService.addWaterIntake({
      date: new Date(),
      amount: amountLiters
    }).subscribe({
      next: () => {
        this.showWaterForm = false;
        this.waterCups = 2;
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

  async sendChatMessage(): Promise<void> {
    const text = (this.chatInput || '').trim();
    if (!text || this.chatLoading || !this.geminiAvailable) return;
    this.chatError = null;
    this.chatMessages.push({ role: 'user', text });
    this.chatInput = '';
    this.chatLoading = true;
    try {
      const response = await this.geminiService.sendMessage(text, this.chatMessages.slice(0, -1));
      this.chatMessages.push({ role: 'model', text: response });
    } catch (err) {
      this.chatError = err instanceof Error ? err.message : 'common.error';
    } finally {
      this.chatLoading = false;
    }
  }
}


