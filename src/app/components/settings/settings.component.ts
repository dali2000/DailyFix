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
  profileFullName = '';
  profileSaving = false;
  profilePhotoSaving = false;
  profilePhotoError: string | null = null;
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

  get userInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const parts = String(this.currentUser.fullName).trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (this.currentUser.fullName as string).slice(0, 2).toUpperCase();
  }

  /** Compresse l'image (max 400px, JPEG 0.85) pour réduire la taille envoyée au serveur. */
  private compressImageAsDataUrl(dataUrl: string, maxSize = 400, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = Math.min(1, maxSize / Math.max(w, h));
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        try {
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = dataUrl;
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.profilePhotoError = null;
    this.profilePhotoSaving = true;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.compressImageAsDataUrl(dataUrl)
        .then((compressed) => {
          this.authService.updateProfile({ profilePhoto: compressed }).subscribe({
            next: () => {
              input.value = '';
              this.profilePhotoSaving = false;
            },
            error: (err) => {
              console.error('Erreur lors de la mise à jour de la photo', err);
              this.profilePhotoError = err?.error?.message || 'Erreur lors de l\'envoi de la photo.';
              this.profilePhotoSaving = false;
            }
          });
        })
        .catch(() => {
          this.profilePhotoError = 'Image invalide.';
          this.profilePhotoSaving = false;
        });
    };
    reader.onerror = () => {
      this.profilePhotoError = 'Impossible de lire le fichier.';
      this.profilePhotoSaving = false;
    };
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    const name = (this.profileFullName || '').trim();
    if (name.length < 2) return;
    this.profileSaving = true;
    this.authService.updateProfile({ fullName: name }).subscribe({
      next: () => {
        this.profileSaving = false;
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde du profil', err);
        this.profileSaving = false;
      }
    });
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileFullName = user.fullName || '';
        if (user.locale) this.selectedLocale = user.locale;
      }
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

