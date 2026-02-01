import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-count-up',
  standalone: true,
  imports: [CommonModule],
  template: `<span [class]="className"><ng-container *ngIf="prefix">{{ prefix }}</ng-container>{{ displayValue | number:format }}<ng-container *ngIf="suffix">{{ suffix }}</ng-container></span>`,
  styles: [],
})
export class CountUpComponent implements OnInit, OnChanges, OnDestroy {
  @Input() value: number = 0;
  @Input() duration = 800;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() className = '';
  /** Format for Angular number pipe, e.g. '1.0-0' or '1.1-2'. */
  @Input() format = '1.0-0';

  displayValue = 0;
  private startValue = 0;
  private targetValue = 0;
  private startTime = 0;
  private rafId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.targetValue = this.value;
    this.startAnimation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      this.startValue = this.displayValue;
      this.targetValue = this.value;
      this.startAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private startAnimation(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }
    this.startValue = this.displayValue;
    this.startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - this.startTime;
      const t = Math.min(elapsed / this.duration, 1);
      const eased = this.easeOutQuart(t);
      this.displayValue = this.startValue + (this.targetValue - this.startValue) * eased;
      this.cdr.markForCheck();

      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.displayValue = this.targetValue;
        this.cdr.markForCheck();
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }
}
