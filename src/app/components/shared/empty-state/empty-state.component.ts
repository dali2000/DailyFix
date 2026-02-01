import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      <button *ngIf="actionText" type="button" class="btn btn-primary" (click)="action.emit()">
        {{ actionText }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 300px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.6;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--notion-text-primary);
      margin-bottom: 8px;
    }

    .empty-message {
      font-size: 14px;
      color: var(--notion-text-secondary);
      margin-bottom: 24px;
      max-width: 400px;
      line-height: 1.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Aucune donnée';
  @Input() message = 'Commencez par ajouter votre premier élément';
  @Input() actionText = '';
  @Output() action = new EventEmitter<void>();
}
