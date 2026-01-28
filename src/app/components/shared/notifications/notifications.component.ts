import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';
import { I18nService } from '../../../services/i18n.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  showDropdown = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private notificationsSubscription?: Subscription;
  private langSubscription?: Subscription;

  constructor(
    public notificationService: NotificationService,
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notificationsSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = this.notificationService.getUnreadCount();
    });
    this.langSubscription = this.i18n.onLangChange.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.notificationsSubscription?.unsubscribe();
    this.langSubscription?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-container')) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      // Marquer toutes comme lues quand on ouvre
      this.notificationService.markAllAsRead();
    }
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  removeNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task':
        return '📋';
      case 'expense':
        return '💰';
      case 'water':
        return '💧';
      case 'household':
        return '🏠';
      default:
        return '🔔';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return this.i18n.instant('notifications.justNow');
    if (minutes < 60) return this.i18n.instant('notifications.minutesAgo').replace('{{count}}', String(minutes));
    if (hours < 24) return this.i18n.instant('notifications.hoursAgo').replace('{{count}}', String(hours));
    if (days < 7) return this.i18n.instant('notifications.daysAgo').replace('{{count}}', String(days));
    const locale = this.i18n.currentLang === 'fr' ? 'fr-FR' : this.i18n.currentLang === 'ar' ? 'ar' : 'en-US';
    return new Date(date).toLocaleDateString(locale);
  }

  clearAll(): void {
    this.notifications.forEach(notification => {
      this.notificationService.removeNotification(notification.id);
    });
  }
}

