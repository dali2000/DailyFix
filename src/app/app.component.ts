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
    
    // Rediriger vers login si non authentifié et pas déjà sur login
    // Attendre un peu pour que validateToken() se termine
    setTimeout(() => {
      if (!this.authService.isAuthenticated() && currentUrl !== '/login' && currentUrl !== '/') {
        this.router.navigate(['/login']);
      }
    }, 100);
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
    // Vérifier si c'est la page de login
    const isLoginPage = url === '/login' || url === '/' || url.startsWith('/#/login');
    
    // Vérifier si c'est la page admin (enlever le hash si présent)
    const cleanUrl = url.replace(/^\/#/, '');
    const isAdminPage = cleanUrl.startsWith('/admin');
    
    // Vérifier si l'utilisateur est authentifié (doit avoir un token ET un utilisateur)
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();
    
    // Vérification stricte : l'utilisateur doit être admin
    const isAdmin = !!(currentUser && currentUser.role === 'admin');
    
    // Afficher navbar seulement si l'utilisateur est authentifié ET pas sur la page de login
    this.showNavbar = isAuthenticated && !isLoginPage;
    
    // Afficher la sidebar admin UNIQUEMENT si :
    // 1. L'utilisateur est authentifié
    // 2. Ce n'est pas la page de login
    // 3. C'est la page admin (/admin)
    // 4. L'utilisateur est admin
    this.showAdminSidebar = !!(isAuthenticated && !isLoginPage && isAdminPage && isAdmin);
    
    // Afficher la sidebar normale si :
    // 1. L'utilisateur est authentifié
    // 2. Ce n'est pas la page de login
    // 3. Ce n'est PAS la page admin (ou l'utilisateur n'est pas admin)
    this.showSidebar = !!(isAuthenticated && !isLoginPage && !isAdminPage);
  }
}
