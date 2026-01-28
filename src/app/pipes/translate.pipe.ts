import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription?: Subscription;
  private lastKey = '';
  private lastValue = '';

  constructor(
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscription = this.i18n.onLangChange.subscribe(() => {
      if (this.lastKey) {
        this.lastValue = this.i18n.instant(this.lastKey);
        this.cdr.markForCheck();
      }
    });
  }

  transform(key: string): string {
    if (!key) return '';
    this.lastKey = key;
    this.lastValue = this.i18n.instant(key);
    return this.lastValue;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
