import { Injectable, OnDestroy } from '@angular/core';
import { TaskService } from './task.service';
import { FinanceService } from './finance.service';
import { HealthService } from './health.service';
import { HomeService } from './home.service';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';
import { Subscription, interval, BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { HouseholdTask } from '../models/home.model';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'expense' | 'water' | 'household';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private checkInterval = 60 * 1000; // 1 minute en millisecondes
  private intervalSubscription?: Subscription;
  private authSubscription?: Subscription;
  private lastNotificationTime: { [key: string]: number } = {};
  private notificationCooldown = 60 * 1000; // 1 minute entre les mêmes notifications
  
  // Subject pour les notifications dans l'interface
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();
  
  private notifications: Notification[] = [];

  constructor(
    private taskService: TaskService,
    private financeService: FinanceService,
    private healthService: HealthService,
    private homeService: HomeService,
    private authService: AuthService,
    private i18n: I18nService
  ) {
    this.initializeNotifications();
  }

  ngOnDestroy(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private initializeNotifications(): void {
    // Demander la permission de notification
    this.requestPermission();

    // Écouter les changements d'authentification
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Démarrer les notifications si l'utilisateur est connecté
        this.startNotifications();
      } else {
        // Arrêter les notifications si l'utilisateur se déconnecte
        this.stopNotifications();
      }
    });
  }

  private async requestPermission(): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  private startNotifications(): void {
    // Vérifier immédiatement
    this.checkAndNotify();

    // Puis vérifier toutes les 5 minutes
    this.intervalSubscription = interval(this.checkInterval).subscribe(() => {
      this.checkAndNotify();
    });
  }

  private stopNotifications(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = undefined;
    }
  }

  private checkAndNotify(): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Vérifier les tâches non complétées
    this.checkIncompleteTasks();

    // Vérifier les dépenses (rappeler d'ajouter des dépenses si aucune aujourd'hui)
    this.checkExpenses();

    // Vérifier l'eau (rappeler de boire de l'eau)
    this.checkWaterIntake();

    // Vérifier les tâches ménagères
    this.checkHouseholdTasks();
  }

  private checkIncompleteTasks(): void {
    const tasks = this.taskService.getTasks();
    const incompleteTasks = tasks.filter(task => 
      !task.completed && 
      task.status !== 'done' &&
      (!task.dueDate || new Date(task.dueDate) >= new Date())
    );
    
    if (incompleteTasks.length > 0) {
      const notificationKey = 'incomplete_tasks';
      if (this.canSendNotification(notificationKey)) {
        const taskTitles = incompleteTasks.slice(0, 3).map(t => t.title).join(', ');
        const moreCount = incompleteTasks.length > 3
          ? this.i18n.instant('notifications.taskReminderMore').replace('{{count}}', String(incompleteTasks.length - 3))
          : '';
        const title = this.i18n.instant('notifications.taskReminderTitle');
        const message = this.i18n.instant('notifications.taskReminderMessage')
          .replace('{{count}}', String(incompleteTasks.length))
          .replace('{{titles}}', taskTitles)
          .replace('{{more}}', moreCount);
        this.sendNotification(`📋 ${title}`, message, notificationKey, 'task');
      }
    }
  }

  private checkExpenses(): void {
    const today = new Date();
    const expenses = this.financeService.getExpenses();
    const todayExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.toDateString() === today.toDateString();
    });

    // Si aucune dépense aujourd'hui et qu'il est après 14h, rappeler
    // Mais seulement une fois par jour
    if (todayExpenses.length === 0 && today.getHours() >= 14 && today.getHours() < 20) {
      const notificationKey = 'add_expenses_' + today.toDateString();
      if (this.canSendNotification(notificationKey)) {
        const title = this.i18n.instant('notifications.expenseReminderTitle');
        const message = this.i18n.instant('notifications.expenseReminderMessage');
        this.sendNotification(`💰 ${title}`, message, notificationKey, 'expense');
      }
    }
  }

  private checkWaterIntake(): void {
    const today = this.healthService.getTodayWaterIntake();
    const recommended = 2000; // 2 litres par jour
    const now = new Date();
    const hour = now.getHours();

    // Rappeler toutes les 2-3 heures entre 8h et 20h si l'apport est faible
    if (today < recommended * 0.5 && hour >= 8 && hour < 20) {
      // Vérifier si c'est une heure "pair" (8h, 10h, 12h, 14h, 16h, 18h)
      const shouldRemind = hour % 2 === 0;
      
      if (shouldRemind) {
        const notificationKey = 'drink_water_' + hour;
        if (this.canSendNotification(notificationKey)) {
          const title = this.i18n.instant('notifications.waterReminderTitle');
          const message = this.i18n.instant('notifications.waterReminderMessage').replace('{{amount}}', String(today));
          this.sendNotification(`💧 ${title}`, message, notificationKey, 'water');
        }
      }
    }
  }

  private checkHouseholdTasks(): void {
    const tasks = this.homeService.getHouseholdTasks();
    const incompleteTasks = tasks.filter(task => {
      if (task.completed) return false;
      
      // Vérifier si la tâche est due
      if (task.nextDueDate) {
        const dueDate = new Date(task.nextDueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      }
      
      return true;
    });
    
    if (incompleteTasks.length > 0) {
      const notificationKey = 'household_tasks';
      if (this.canSendNotification(notificationKey)) {
        const taskNames = incompleteTasks.slice(0, 2).map(t => t.name).join(', ');
        const moreCount = incompleteTasks.length > 2
          ? ' ' + this.i18n.instant('notifications.householdReminderMore').replace('{{count}}', String(incompleteTasks.length - 2))
          : '';
        const title = this.i18n.instant('notifications.householdReminderTitle');
        const message = this.i18n.instant('notifications.householdReminderMessage')
          .replace('{{count}}', String(incompleteTasks.length))
          .replace('{{names}}', taskNames)
          .replace('{{more}}', moreCount);
        this.sendNotification(`🏠 ${title}`, message, notificationKey, 'household');
      }
    }
  }

  private canSendNotification(key: string): boolean {
    const now = Date.now();
    const lastTime = this.lastNotificationTime[key] || 0;
    
    if (now - lastTime >= this.notificationCooldown) {
      this.lastNotificationTime[key] = now;
      return true;
    }
    
    return false;
  }

  private sendNotification(title: string, body: string, tag: string, type: 'task' | 'expense' | 'water' | 'household' = 'task'): void {
    // Ajouter la notification à l'interface
    const notification: Notification = {
      id: `${tag}_${Date.now()}`,
      title: title,
      message: body,
      type: type,
      timestamp: new Date(),
      read: false
    };
    
    this.notifications.unshift(notification); // Ajouter au début
    // Garder seulement les 50 dernières notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.notificationsSubject.next([...this.notifications]);

    // Envoyer aussi une notification système si autorisée
    if ('Notification' in window && Notification.permission === 'granted') {
      const systemNotification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: tag, // Évite les doublons
        requireInteraction: false,
        silent: false
      });

      // Fermer automatiquement après 5 secondes
      setTimeout(() => {
        systemNotification.close();
      }, 5000);

      // Gérer le clic sur la notification
      systemNotification.onclick = () => {
        window.focus();
        systemNotification.close();
      };
    }
  }

  // Méthode publique pour tester les notifications
  testNotification(): void {
    const title = this.i18n.instant('notifications.testTitle');
    const message = this.i18n.instant('notifications.testMessage');
    this.sendNotification(title, message, 'test', 'task');
  }

  // Marquer une notification comme lue
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationsSubject.next([...this.notifications]);
  }

  // Supprimer une notification
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next([...this.notifications]);
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Obtenir toutes les notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }
}

