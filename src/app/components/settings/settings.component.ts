import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';
import { FinanceService } from '../../services/finance.service';
import { ToastService } from '../../services/toast.service';
import { ExpenseCategory, WalletCard } from '../../models/finance.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية (تونس)' }
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, ModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentUser: any = null;
  profileFullName = '';
  profileHeight: number | null = null;
  profileWeight: number | null = null;
  profileGender: string = '';
  profileSaving = false;
  profilePhotoSaving = false;
  profilePhotoError: string | null = null;
  selectedCurrencyCode = 'EUR';
  selectedLocale = 'fr';
  readonly languages = LANGUAGES;
  customCategoryList: ExpenseCategory[] = [];
  categoryToAdd = '';
  walletCards: WalletCard[] = [];
  showAddCardModal = false;
  showEditCardModal = false;
  newCard: Partial<WalletCard> = { name: '', holderName: '', cardNumber: '', expiryDate: '', rib: '', currency: '' };
  editCard: WalletCard | null = null;
  editCardForm: Partial<WalletCard> = {};
  private themeSubscription?: Subscription;
  private userSubscription?: Subscription;
  private currencySubscription?: Subscription;
  private categoriesSubscription?: Subscription;
  private walletCardsSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private currencyService: CurrencyService,
    private i18n: I18nService,
    private router: Router,
    private financeService: FinanceService,
    private toastService: ToastService
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
    const patch: { fullName: string; height?: number | null; weight?: number | null; gender?: string | null } = { fullName: name };
    patch.height = this.profileHeight != null && this.profileHeight > 0 ? this.profileHeight : null;
    patch.weight = this.profileWeight != null && this.profileWeight > 0 ? this.profileWeight : null;
    patch.gender = this.profileGender && ['male', 'female'].includes(this.profileGender) ? this.profileGender : null;
    this.authService.updateProfile(patch).subscribe({
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
        this.profileHeight = user.height != null ? Number(user.height) : null;
        this.profileWeight = user.weight != null ? Number(user.weight) : null;
        this.profileGender = user.gender || '';
        if (user.locale) this.selectedLocale = user.locale;
      }
    });

    // Recharger le profil depuis le serveur pour remplir height, weight, gender
    if (this.authService.getToken()) {
      this.authService.refreshCurrentUser().subscribe();
    }

    this.selectedCurrencyCode = this.currencyService.getSelectedCurrencyCode();
    this.currencySubscription = this.currencyService.selectedCurrency$.subscribe(code => {
      this.selectedCurrencyCode = code;
    });
    this.selectedLocale = this.authService.getCurrentUser()?.locale || localStorage.getItem('dailyfix_locale') || 'fr';

    this.categoriesSubscription = this.financeService.getCustomCategoriesObservable().subscribe({
      next: list => {
        this.customCategoryList = list.map(c => ({ ...c, id: typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10) }));
      },
      error: err => console.error('Error loading categories:', err)
    });

    this.walletCardsSubscription = this.financeService.getWalletCardsObservable().subscribe({
      next: list => { this.walletCards = list; },
      error: err => console.error('Error loading wallet cards:', err)
    });
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      food: '🍔',
      shopping: '🛍️',
      health: '🏥',
      leisure: '🎮',
      transport: '🚗',
      bills: '📄',
      other: '📦'
    };
    return icons[category] || '📦';
  }

  addCustomCategory(): void {
    const name = this.categoryToAdd?.trim() || '';
    if (!name) return;
    this.financeService.addCustomCategory(name).subscribe({
      next: () => {
        this.customCategoryList = this.financeService.getCustomCategories();
        this.categoryToAdd = '';
      },
      error: err => {
        console.error('Error adding category:', err);
        this.toastService.error(this.i18n.instant('common.error') || 'Erreur');
      }
    });
  }

  removeCustomCategory(id: string | number): void {
    this.financeService.removeCustomCategory(id).subscribe({
      next: () => {
        this.customCategoryList = this.financeService.getCustomCategories();
        this.toastService.success(this.i18n.instant('finance.categoryRemoved') || 'Catégorie retirée.');
      },
      error: err => {
        console.error('Error removing category:', err);
        this.toastService.error(this.i18n.instant('common.error') || 'Erreur');
      }
    });
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
    this.categoriesSubscription?.unsubscribe();
    this.walletCardsSubscription?.unsubscribe();
  }

  openAddCardModal(): void {
    this.newCard = {
      name: '',
      holderName: '',
      cardNumber: '',
      expiryDate: '',
      rib: '',
      currency: this.selectedCurrencyCode || 'EUR'
    };
    this.showAddCardModal = true;
  }

  closeAddCardModal(): void {
    this.showAddCardModal = false;
    this.newCard = {};
  }

  openEditCardModal(card: WalletCard): void {
    this.editCard = card;
    this.editCardForm = {
      name: card.name ?? '',
      holderName: card.holderName,
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      rib: card.rib ?? '',
      currency: card.currency ?? ''
    };
    this.showEditCardModal = true;
  }

  closeEditCardModal(): void {
    this.showEditCardModal = false;
    this.editCard = null;
    this.editCardForm = {};
  }

  saveEditCard(): void {
    if (!this.editCard?.id) return;
    const holder = (this.editCardForm.holderName || '').trim();
    const number = (this.editCardForm.cardNumber || '').trim();
    const expiry = (this.editCardForm.expiryDate || '').trim();
    if (!holder || !number || !expiry) {
      this.toastService.warning(this.i18n.instant('settings.walletCardRequired') || 'Holder, card number and expiry are required.');
      return;
    }
    this.financeService.updateWalletCard(String(this.editCard.id), {
      name: (this.editCardForm.name || '').trim() || undefined,
      holderName: holder,
      cardNumber: number,
      expiryDate: expiry,
      rib: (this.editCardForm.rib || '').trim() || undefined,
      currency: (this.editCardForm.currency || '').trim() || undefined
    }).subscribe({
      next: () => {
        this.closeEditCardModal();
        this.walletCards = this.financeService.getWalletCards();
        this.toastService.success(this.i18n.instant('settings.walletCardUpdated') || 'Card updated.');
      },
      error: err => this.toastService.error(err?.error?.message || 'Error')
    });
  }

  addWalletCard(): void {
    const holder = (this.newCard.holderName || '').trim();
    const number = (this.newCard.cardNumber || '').trim();
    const expiry = (this.newCard.expiryDate || '').trim();
    if (!holder || !number || !expiry) {
      this.toastService.warning(this.i18n.instant('settings.walletCardRequired') || 'Holder, card number and expiry are required.');
      return;
    }
    this.financeService.addWalletCard({
      name: (this.newCard.name || '').trim() || undefined,
      holderName: holder,
      cardNumber: number,
      expiryDate: expiry,
      rib: (this.newCard.rib || '').trim() || undefined,
      currency: (this.newCard.currency || '').trim() || undefined,
      isDefault: this.walletCards.length === 0
    }).subscribe({
      next: () => {
        this.closeAddCardModal();
        this.toastService.success(this.i18n.instant('settings.walletCardAdded') || 'Card added.');
      },
      error: err => {
        this.toastService.error(err?.error?.message || err?.message || this.i18n.instant('common.error') || 'Error');
      }
    });
  }

  setDefaultCard(card: WalletCard): void {
    this.financeService.updateWalletCard(String(card.id), { isDefault: true }).subscribe({
      next: () => {
        this.walletCards = this.financeService.getWalletCards();
        this.toastService.success(this.i18n.instant('settings.walletCardSetDefault') || 'Default card updated.');
      },
      error: err => this.toastService.error(err?.error?.message || 'Error')
    });
  }

  deleteWalletCard(card: WalletCard): void {
    if (!confirm(this.i18n.instant('settings.walletCardDeleteConfirm') || 'Remove this card?')) return;
    this.financeService.deleteWalletCard(String(card.id)).subscribe({
      next: () => {
        this.walletCards = this.financeService.getWalletCards();
        this.toastService.success(this.i18n.instant('settings.walletCardDeleted') || 'Card removed.');
      },
      error: err => this.toastService.error(err?.error?.message || 'Error')
    });
  }

  maskCardNumber(number: string): string {
    if (!number || number.length < 8) return '****';
    const s = number.replace(/\s/g, '');
    return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
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

