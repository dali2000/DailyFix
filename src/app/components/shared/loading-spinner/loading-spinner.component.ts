import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.inline]="inline">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <span *ngIf="message" class="spinner-message">{{ message }}</span>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
    }

    .spinner-container.inline {
      display: inline-flex;
      flex-direction: row;
      padding: 0;
      gap: 8px;
    }

    .spinner {
      border: 3px solid var(--notion-border);
      border-top-color: var(--notion-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner-message {
      font-size: 14px;
      color: var(--notion-text-secondary);
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size = 32;
  @Input() message = '';
  @Input() inline = false;
}
