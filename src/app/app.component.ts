import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dailyFix';
  isLoginRoute = false;

  constructor(private router: Router) {
    this.isLoginRoute = this.router.url.startsWith('/login');

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoginRoute = this.router.url === '/login' || this.router.url.startsWith('/login');
      });
  }
}
