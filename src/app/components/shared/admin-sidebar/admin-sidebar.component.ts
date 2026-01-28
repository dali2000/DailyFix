import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../../services/sidebar.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isMobile = false;
  private sidebarSubscription?: Subscription;
  
  navigationItems = [
    { icon: '📊', label: 'Dashboard', route: '/admin' },
    { icon: '👥', label: 'Gestion Utilisateurs', route: '/admin' },
    { icon: '📈', label: 'Statistiques', route: '/admin' }
  ];

  constructor(
    private sidebarService: SidebarService,
    public authService: AuthService, // Public pour l'utiliser dans le template
    private router: Router
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  checkMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (this.isMobile && !wasMobile) {
      this.isCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    
    if (this.isMobile) {
      if (!this.isCollapsed) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    setTimeout(() => {
      this.updateMainContentMargin();
    }, 0);
  }

  private updateMainContentMargin(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      if (this.isMobile) {
        mainContent.style.marginLeft = '0';
      } else {
        mainContent.style.marginLeft = this.isCollapsed ? '48px' : '240px';
      }
    }
  }

  ngOnInit(): void {
    // Vérifier que l'utilisateur est admin, sinon rediriger
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn('Accès non autorisé à la sidebar admin. Redirection vers /home');
      this.router.navigate(['/home']);
      return;
    }

    this.checkMobile();
    if (this.isMobile) {
      this.isCollapsed = true;
    }
    this.updateMainContentMargin();
    
    this.sidebarSubscription = this.sidebarService.toggleSidebar$.subscribe(() => {
      this.toggleSidebar();
    });
  }

  onNavItemClick(): void {
    if (this.isMobile) {
      this.isCollapsed = true;
      document.body.style.overflow = '';
      this.updateMainContentMargin();
    }
  }

  navigateToApp(): void {
    // Navigation vers l'application normale
    this.router.navigate(['/home']).then(() => {
      // Fermer la sidebar sur mobile après navigation
      if (this.isMobile) {
        this.isCollapsed = true;
        document.body.style.overflow = '';
        this.updateMainContentMargin();
      }
    });
  }

  logout(): void {
    if (this.isMobile) {
      this.isCollapsed = true;
      document.body.style.overflow = '';
    }
    this.authService.logout();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}

