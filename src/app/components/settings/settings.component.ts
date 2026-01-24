import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentUser: any = null;
  private themeSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner au thème actuel
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // S'abonner à l'utilisateur actuel
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

