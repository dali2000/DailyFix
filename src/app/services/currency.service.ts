import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  rate: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  readonly currencyStorageKey = 'dailyfix_currency';

  readonly currencies: Currency[] = [
    { code: 'EUR', symbol: '€', label: 'Euro', rate: 1 },
    { code: 'USD', symbol: '$', label: 'Dollar US', rate: 1.1 },
    { code: 'GBP', symbol: '£', label: 'Livre sterling', rate: 0.9 },
    { code: 'CAD', symbol: '$', label: 'Dollar CA', rate: 1.45 },
    { code: 'TND', symbol: 'د.ت', label: 'Dinar tunisien', rate: 3.35 }
  ];

  private selectedCurrencySubject: BehaviorSubject<string>;
  selectedCurrency$: Observable<string>;

  constructor() {
    const saved = this.getSavedCurrency();
    this.selectedCurrencySubject = new BehaviorSubject<string>(saved);
    this.selectedCurrency$ = this.selectedCurrencySubject.asObservable();
  }

  private getSavedCurrency(): string {
    try {
      const code = localStorage.getItem(this.currencyStorageKey);
      if (code && this.currencies.some(c => c.code === code)) return code;
    } catch {
      // Ignorer (mode privé, etc.)
    }
    return 'EUR';
  }

  getSelectedCurrencyCode(): string {
    return this.selectedCurrencySubject.value;
  }

  setSelectedCurrency(code: string): void {
    if (!this.currencies.some(c => c.code === code)) return;
    this.selectedCurrencySubject.next(code);
    try {
      localStorage.setItem(this.currencyStorageKey, code);
    } catch {
      // Ignorer
    }
  }

  getCurrencyByCode(code: string): Currency | undefined {
    return this.currencies.find(c => c.code === code);
  }

  getSymbol(): string {
    const c = this.getCurrencyByCode(this.selectedCurrencySubject.value);
    return c?.symbol ?? '€';
  }

  /** Symbol for a given currency code (e.g. for per-card currency). */
  getSymbolForCode(code: string | null | undefined): string {
    if (!code) return this.getSymbol();
    const c = this.getCurrencyByCode(code);
    return c?.symbol ?? '€';
  }

  /** Rate to convert from base (stored) currency to selected display currency. */
  getRate(): number {
    const c = this.getCurrencyByCode(this.selectedCurrencySubject.value);
    return c?.rate ?? 1;
  }

  /** Convert amount from user's selected currency to base currency (for saving to API). */
  amountToBase(amount: number | null | undefined): number {
    if (amount == null) return 0;
    return amount / this.getRate();
  }

  convertAmount(amount: number | null | undefined): number {
    if (amount == null) return 0;
    const c = this.getCurrencyByCode(this.selectedCurrencySubject.value);
    return amount * (c?.rate ?? 1);
  }
}
