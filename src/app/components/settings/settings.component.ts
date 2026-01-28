import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { Subscription } from 'rxjs';

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية (تونس)' }
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentUser: any = null;
  selectedCurrencyCode = 'EUR';
  selectedLocale = 'fr';
  readonly languages = LANGUAGES;
  private themeSubscription?: Subscription;
  private userSubscription?: Subscription;
  private currencySubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private currencyService: CurrencyService,
    private i18n: I18nService,
    private router: Router
  ) {}

  get currencies() {
    return this.currencyService.currencies;
  }

  ngOnInit(): void {
    // S'abonner au thème actuel
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // S'abonner à l'utilisateur actuel
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.locale) this.selectedLocale = user.locale;
    });

    this.selectedCurrencyCode = this.currencyService.getSelectedCurrencyCode();
    this.currencySubscription = this.currencyService.selectedCurrency$.subscribe(code => {
      this.selectedCurrencyCode = code;
    });
    this.selectedLocale = this.authService.getCurrentUser()?.locale || localStorage.getItem('dailyfix_locale') || 'fr';
  }

  onLocaleChange(code: string): void {
    this.selectedLocale = code;
    this.i18n.use(code).subscribe();
    try {
      localStorage.setItem('dailyfix_locale', code);
    } catch {}
    if (this.authService.getCurrentUser()) {
      this.authService.updateProfile({ locale: code }).subscribe({
        error: (err) => console.error('Erreur lors de la sauvegarde de la langue', err)
      });
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();
  }

  onCurrencyChange(code: string): void {
    if (this.authService.getCurrentUser()) {
      this.authService.updateProfile({ currency: code }).subscribe({
        error: (err) => console.error('Erreur lors de la sauvegarde de la devise', err)
      });
    } else {
      this.currencyService.setSelectedCurrency(code);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    if (this.authService.getCurrentUser()) {
      this.authService.updateProfile({ theme }).subscribe({
        error: (err) => console.error('Erreur lors de la sauvegarde du thème', err)
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

