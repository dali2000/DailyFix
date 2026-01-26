import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from "./components/shared/navbar/navbar.component";
import { SidebarComponent } from "./components/shared/sidebar/sidebar.component";
import { AdminSidebarComponent } from "./components/shared/admin-sidebar/admin-sidebar.component";
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, AdminSidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dailyFix';
  showNavbar = false;
  showSidebar = false;
  showAdminSidebar = false;
  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    // Écouter les changements de route
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.updateVisibility(url);
      });
  }

  ngOnInit(): void {
    // Initialiser le service de thème (charge le thème sauvegardé)
    this.themeService.watchSystemPreference();
    
    // Écouter les changements d'authentification
    this.userSubscription = this.authService.currentUser$.subscribe(() => {
      const currentUrl = this.router.url;
      this.updateVisibility(currentUrl);
    });

    // Vérifier la route initiale et l'authentification
    const currentUrl = this.router.url;
    this.updateVisibility(currentUrl);
    
    // La redirection vers login est maintenant gérée par le authGuard
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateVisibility(url: string): void {
    // Normaliser l'URL (HashLocationStrategy + query params)
    const normalizedUrl = (url || '')
      .replace(/^\/#/, '') // "/#/home" -> "/home"
      .split('?')[0]; // "/login?returnUrl=..." -> "/login"

    // Vérifier si c'est la page de login
    const isLoginPage = normalizedUrl === '/login' || normalizedUrl === '/';

    // Vérifier si c'est la page admin
    const isAdminPage = normalizedUrl.startsWith('/admin');

    /**
     * IMPORTANT:
     * On affiche le layout dès qu'un token existe.
     * Le `currentUser` peut être temporairement null juste après login / au premier chargement,
     * ce qui forçait un refresh pour voir navbar/sidebar.
     */
    const hasToken = this.authService.hasToken();
    const currentUser = this.authService.getCurrentUser();

    // Vérification stricte : l'utilisateur doit être admin
    const isAdmin = !!(currentUser && currentUser.role === 'admin');

    // Afficher navbar seulement si un token existe ET pas sur la page de login
    this.showNavbar = hasToken && !isLoginPage;
    
    // Afficher la sidebar admin UNIQUEMENT si :
    // 1. Un token existe
    // 2. Ce n'est pas la page de login
    // 3. C'est la page admin (/admin)
    // 4. L'utilisateur est admin
    this.showAdminSidebar = !!(hasToken && !isLoginPage && isAdminPage && isAdmin);
    
    // Afficher la sidebar normale si :
    // 1. Un token existe
    // 2. Ce n'est pas la page de login
    // 3. Ce n'est PAS la page admin (ou l'utilisateur n'est pas admin)
    this.showSidebar = !!(hasToken && !isLoginPage && !isAdminPage);
  }
}
