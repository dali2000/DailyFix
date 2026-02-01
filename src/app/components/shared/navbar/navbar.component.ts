import { Component, OnInit, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WeatherService, WeatherData } from '../../../services/weather.service';
import { SidebarService } from '../../../services/sidebar.service';
import { AuthService, User } from '../../../services/auth.service';
import { ThemeService, Theme } from '../../../services/theme.service';
import { I18nService, Locale } from '../../../services/i18n.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  host: { '[class.navbar-rtl]': 'isRtl' }
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMenu = false;
  showProfileDropdown = false;
  weather: WeatherData | null = null;
  weatherLoading = false;
  isMobile = false;
  /** Masquer le bouton plein écran entre 375px et 412px de largeur */
  hideFullscreen = false;
  currentUser: User | null = null;
  currentTheme: Theme = 'light';
  isFullscreen = false;
  showLangDropdown = false;
  currentLang: Locale = 'fr';
  readonly langOptions: { code: Locale; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' }
  ];
  private userSubscription?: Subscription;
  private themeSubscription?: Subscription;
  private langSubscription?: Subscription;
  private fullscreenChangeHandler = () => this.updateFullscreenState();

  constructor(
    private weatherService: WeatherService,
    private sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(_event?: Event) {
    this.checkMobile();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.showProfileDropdown = false;
    }
    if (!target.closest('.lang-container')) {
      this.showLangDropdown = false;
    }
  }

  checkMobile() {
    const w = window.innerWidth;
    this.isMobile = w <= 768;
    this.hideFullscreen = w >= 375 && w <= 412;
  }

  ngOnInit(): void {
    this.checkMobile();
    this.updateFullscreenState();
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
    this.loadWeather();
    this.currentUser = this.authService.getCurrentUser();
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.currentLang = this.i18n.currentLang;
    this.langSubscription = this.i18n.onLangChange.subscribe(lang => {
      this.currentLang = lang;
      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();
  }

  /** true en arabe : inversion RTL de la navbar. */
  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  toggleLangDropdown(): void {
    this.showLangDropdown = !this.showLangDropdown;
  }

  setLanguage(code: Locale): void {
    this.i18n.use(code).subscribe();
    this.showLangDropdown = false;
    // Persister la locale sur le serveur pour qu’elle survive au rafraîchissement
    if (this.authService.isAuthenticated()) {
      this.authService.updateProfile({ locale: code }).subscribe({
        error: () => { /* locale déjà appliquée localement */ }
      });
    }
  }

  private updateFullscreenState(): void {
    const doc = document as Document & { fullscreenElement?: Element; webkitFullscreenElement?: Element };
    this.isFullscreen = !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
  }

  toggleFullscreen(): void {
    const doc = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void>; exitFullscreen?: () => Promise<void>; webkitExitFullscreen?: () => void };
    if (this.isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as Document & { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    } else {
      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      }
    }
  }

  get userInitials(): string {
    if (!this.currentUser || !this.currentUser.fullName) {
      return 'AM';
    }
    const names = this.currentUser.fullName.split(' ').filter(n => n.length > 0);
    if (names.length === 0) {
      return 'AM';
    }
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  get userName(): string {
    return this.currentUser ? this.currentUser.fullName : 'Alex Martin';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeProfileDropdown(): void {
    this.showProfileDropdown = false;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    // Fermer le dropdown
    this.showProfileDropdown = false;
    // Déconnecter l'utilisateur via le service
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getCurrentTheme();
    if (this.authService.getCurrentUser()) {
      this.authService.updateProfile({ theme: newTheme }).subscribe({
        error: (err) => console.error('Erreur sauvegarde thème', err)
      });
    }
  }

  loadWeather(): void {
    this.weatherLoading = true;
    this.weatherService.getWeatherAuto().subscribe({
      next: (data) => {
        this.weather = data;
        this.weatherLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la météo:', error);
        this.weatherLoading = false;
      }
    });
  }
}
