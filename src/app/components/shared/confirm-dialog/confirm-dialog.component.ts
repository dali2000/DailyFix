import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="confirm-overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-header">
          <h3>{{ title || ('common.confirm' | translate) }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            {{ cancelText || ('common.cancel' | translate) }}
          </button>
          <button type="button" class="btn" [class.btn-danger]="type === 'danger'" [class.btn-primary]="type !== 'danger'" (click)="onConfirm()">
            {{ confirmText || ('common.confirm' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirm-dialog {
      background: var(--notion-bg);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      max-width: 480px;
      width: 90%;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .confirm-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--notion-border);
    }

    .confirm-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--notion-text-primary);
    }

    .confirm-body {
      padding: 24px;
    }

    .confirm-body p {
      margin: 0;
      color: var(--notion-text-primary);
      line-height: 1.6;
    }

    .confirm-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--notion-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = '';
  @Input() cancelText = '';
  @Input() type: 'danger' | 'primary' = 'danger';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
