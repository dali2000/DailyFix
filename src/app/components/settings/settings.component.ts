import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentUser: any = null;
  selectedCurrencyCode = 'EUR';
  private themeSubscription?: Subscription;
  private userSubscription?: Subscription;
  private currencySubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private currencyService: CurrencyService,
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
    });

    this.selectedCurrencyCode = this.currencyService.getSelectedCurrencyCode();
    this.currencySubscription = this.currencyService.selectedCurrency$.subscribe(code => {
      this.selectedCurrencyCode = code;
    });
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
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

