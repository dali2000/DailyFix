import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { SidebarService } from '../../../services/sidebar.service';
import { AuthService } from '../../../services/auth.service';
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
    private router: Router
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
    if (mainContent) {
      if (this.isMobile) {
        // Sur mobile, ne pas ajouter de marge
        mainContent.style.marginLeft = '0';
      } else {
        mainContent.style.marginLeft = this.isCollapsed ? '48px' : '240px';
      }
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
    // Restaurer le scroll du body si nécessaire
    document.body.style.overflow = '';
    // Désabonner du service
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}

