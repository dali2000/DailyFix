import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [style.width]="width" [style.height]="height" [class.skeleton-circle]="circle"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--notion-bg-tertiary) 25%, var(--notion-bg-hover) 50%, var(--notion-bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-circle {
      border-radius: 50%;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '20px';
  @Input() circle = false;
}
