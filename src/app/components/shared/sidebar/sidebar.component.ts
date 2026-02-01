import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { SidebarService } from '../../../services/sidebar.service';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isMobile = false;
  private sidebarSubscription?: Subscription;
  private langSubscription?: Subscription;
  
  navigationItems = [
    { icon: '🏠', labelKey: 'nav.home', route: '/home' },
    { icon: '✓', labelKey: 'nav.tasks', route: '/tasks' },
    { icon: '📅', labelKey: 'nav.calendar', route: '/calendar' },
    { icon: '❤️', labelKey: 'nav.health', route: '/health' },
    { icon: '💰', labelKey: 'nav.finance', route: '/finance' },
    { icon: '🏡', labelKey: 'nav.homeOrg', route: '/home-org' },
    { icon: '👥', labelKey: 'nav.social', route: '/social' },
    { icon: '🧘', labelKey: 'nav.wellness', route: '/wellness' }
  ];

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router,
    private i18n: I18nService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  checkMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // Sur mobile, la sidebar doit être collapsed par défaut
    if (this.isMobile && !wasMobile) {
      // Si on passe en mode mobile, fermer la sidebar
      this.isCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    
    // Sur mobile, bloquer le scroll du body quand la sidebar est ouverte
    if (this.isMobile) {
      if (!this.isCollapsed) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
    setTimeout(() => {
      this.updateMainContentMargin();
    }, 0);
  }

  private updateMainContentMargin(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (!mainContent) return;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' ||
      document.querySelector('app-root')?.classList.contains('dir-rtl');
    if (this.isMobile) {
      mainContent.style.marginLeft = '';
      mainContent.style.marginRight = '';
    } else if (isRtl) {
      mainContent.style.marginLeft = '0';
      mainContent.style.marginRight = this.isCollapsed ? '48px' : '240px';
    } else {
      mainContent.style.marginRight = '';
      mainContent.style.marginLeft = this.isCollapsed ? '48px' : '240px';
    }
  }

  ngOnInit(): void {
    this.checkMobile();
    // Sur mobile, la sidebar est collapsed par défaut
    if (this.isMobile) {
      this.isCollapsed = true;
    }
    // Initialiser la marge au chargement
    this.updateMainContentMargin();
    
    // Écouter les événements de toggle depuis la navbar
    this.sidebarSubscription = this.sidebarService.toggleSidebar$.subscribe(() => {
      this.toggleSidebar();
    });
    // Recalculer la marge du contenu quand la langue change (RTL / LTR)
    this.langSubscription = this.i18n.onLangChange.subscribe(() => {
      setTimeout(() => this.updateMainContentMargin(), 0);
    });
  }

  onNavItemClick(): void {
    // Sur mobile, fermer la sidebar après avoir cliqué sur un lien
    if (this.isMobile) {
      this.isCollapsed = true;
      document.body.style.overflow = '';
      this.updateMainContentMargin();
    }
  }

  logout(): void {
    // Fermer la sidebar sur mobile avant de déconnecter
    if (this.isMobile) {
      this.isCollapsed = true;
      document.body.style.overflow = '';
    }
    // Déconnecter l'utilisateur
    this.authService.logout();
    // La navigation sera gérée par AuthService
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.sidebarSubscription?.unsubscribe();
    this.langSubscription?.unsubscribe();
  }
}

