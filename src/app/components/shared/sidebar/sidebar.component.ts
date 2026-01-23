import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  
  navigationItems = [
    { icon: '🏠', label: 'Accueil', route: '/home' },
    { icon: '✓', label: 'Tâches', route: '/tasks' },
    { icon: '📅', label: 'Calendrier', route: '/calendar' },
    { icon: '❤️', label: 'Santé', route: '/health' },
    { icon: '💰', label: 'Finances', route: '/finance' },
    { icon: '🏡', label: 'Maison', route: '/home-org' },
    { icon: '👥', label: 'Social', route: '/social' },
    { icon: '🧘', label: 'Bien-être', route: '/wellness' }
  ];

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
    setTimeout(() => {
      this.updateMainContentMargin();
    }, 0);
  }

  private updateMainContentMargin(): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.marginLeft = this.isCollapsed ? '48px' : '240px';
    }
    // La navbar reste toujours à la même position, elle ne bouge pas
  }

  ngOnInit(): void {
    // Initialiser la marge au chargement
    this.updateMainContentMargin();
  }
}

