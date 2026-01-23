import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from "./components/shared/navbar/navbar.component";
import { SidebarComponent } from "./components/shared/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dailyFix';
  showNavbar = true;
  showSidebar = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.showNavbar = url !== '/login' && url !== '/';
        this.showSidebar = url !== '/login' && url !== '/';
      });
    
    // Vérifier la route initiale
    const currentUrl = this.router.url;
    this.showNavbar = currentUrl !== '/login' && currentUrl !== '/';
    this.showSidebar = currentUrl !== '/login' && currentUrl !== '/';
  }
}
