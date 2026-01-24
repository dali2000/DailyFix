import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from "./components/shared/navbar/navbar.component";
import { SidebarComponent } from "./components/shared/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'dailyFix';
  showNavbar = true;
  showSidebar = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.updateVisibility(url);
      });
  }

  ngOnInit(): void {
    // Vérifier la route initiale et l'authentification
    const currentUrl = this.router.url;
    this.updateVisibility(currentUrl);
    
    // Rediriger vers login si non authentifié et pas déjà sur login
    if (!this.authService.isAuthenticated() && currentUrl !== '/login' && currentUrl !== '/') {
      this.router.navigate(['/login']);
    }
  }

  private updateVisibility(url: string): void {
    const isLoginPage = url === '/login' || url === '/login' || url === '/';
    const isAuthenticated = this.authService.isAuthenticated();
    
    this.showNavbar = !isLoginPage && isAuthenticated;
    this.showSidebar = !isLoginPage && isAuthenticated;
  }
}
