import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WeatherService, WeatherData } from '../../../services/weather.service';
import { SidebarService } from '../../../services/sidebar.service';
import { AuthService, User } from '../../../services/auth.service';
import { ThemeService, Theme } from '../../../services/theme.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMenu = false;
  showProfileDropdown = false;
  weather: WeatherData | null = null;
  weatherLoading = false;
  isMobile = false;
  currentUser: User | null = null;
  currentTheme: Theme = 'light';
  private userSubscription?: Subscription;
  private themeSubscription?: Subscription;

  constructor(
    private weatherService: WeatherService,
    private sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.showProfileDropdown = false;
    }
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.checkMobile();
    this.loadWeather();
    this.currentUser = this.authService.getCurrentUser();
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
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
