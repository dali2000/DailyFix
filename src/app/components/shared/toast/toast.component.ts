import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" 
           class="toast" 
           [class]="'toast-' + toast.type"
           [@slideIn]>
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="close(toast.id)" aria-label="Close">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 70px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--notion-bg);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      border-left-color: var(--notion-green);
      background: var(--notion-green-bg);
    }

    .toast-error {
      border-left-color: var(--notion-red);
      background: var(--notion-red-bg);
    }

    .toast-warning {
      border-left-color: var(--notion-orange);
      background: var(--notion-orange-bg);
    }

    .toast-info {
      border-left-color: var(--notion-blue);
      background: var(--notion-blue-bg);
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      color: var(--notion-text-primary);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 24px;
      color: var(--notion-text-secondary);
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 768px) {
      .toast-container {
        right: 16px;
        left: 16px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastComponent {
  toasts$ = this.toastService.toasts$;

  constructor(private toastService: ToastService) {}

  getIcon(type: string): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type as keyof typeof icons] || 'ℹ';
  }

  close(id: string): void {
    this.toastService.remove(id);
  }
}
