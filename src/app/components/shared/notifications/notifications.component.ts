import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  showDropdown = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private notificationsSubscription?: Subscription;

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationsSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = this.notificationService.getUnreadCount();
    });
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
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

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(date).toLocaleDateString('fr-FR');
  }

  clearAll(): void {
    this.notifications.forEach(notification => {
      this.notificationService.removeNotification(notification.id);
    });
  }
}

