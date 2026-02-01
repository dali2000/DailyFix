import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from "./components/shared/navbar/navbar.component";
import { SidebarComponent } from "./components/shared/sidebar/sidebar.component";
import { AdminSidebarComponent } from "./components/shared/admin-sidebar/admin-sidebar.component";
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { ToastComponent } from './components/shared/toast/toast.component';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, AdminSidebarComponent, CommonModule, TranslatePipe, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dailyFix';
  showNavbar = false;
  showSidebar = false;
  showAdminSidebar = false;
  /** Loader global : masqué quand l’auth initiale est terminée. */
  appReady = false;
  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private initSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
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
    // Loader : attendre la fin de la vérification auth (GET /auth/me ou réponse immédiate si pas de token)
    this.initSubscription = this.authService.ensureAuthenticated$().subscribe(() => {
      this.appReady = true;
      this.cdr.detectChanges();
    });

    // Langue : appliquer la préférence sauvegardée (avant /me)
    const savedLocale = localStorage.getItem('dailyfix_locale');
    if (savedLocale === 'en' || savedLocale === 'ar') {
      this.i18n.use(savedLocale).subscribe();
    }
    // Initialiser le service de thème (charge le thème sauvegardé)
    this.themeService.watchSystemPreference();
    
    // Écouter les changements d'authentification (login/logout)
    // Utiliser setTimeout(0) pour que la mise à jour ait lieu après la navigation
    // déclenchée par le login (sinon router.url est encore /login et la navbar reste cachée)
    this.userSubscription = this.authService.currentUser$.subscribe(() => {
      setTimeout(() => {
        this.updateVisibility(this.router.url);
      }, 0);
    });

    // Vérifier la route initiale et l'authentification
    const currentUrl = this.router.url;
    this.updateVisibility(currentUrl);
    
    // La redirection vers login est maintenant gérée par le authGuard
  }

  ngOnDestroy(): void {
    this.initSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
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

    // Forcer la détection des changements pour que navbar/sidebar s'affichent immédiatement
    // (évite d'avoir à rafraîchir après le login)
    this.cdr.detectChanges();
  }
}
