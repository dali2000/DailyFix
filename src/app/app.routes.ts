import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((t) => t.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./components/tasks/tasks.component').then((m) => m.TasksComponent),
    canActivate: [authGuard],
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./components/calendar/calendar.component').then((m) => m.CalendarComponent),
    canActivate: [authGuard],
  },
  {
    path: 'health',
    loadComponent: () =>
      import('./components/health/health.component').then((m) => m.HealthComponent),
    canActivate: [authGuard],
  },
  {
    path: 'finance',
    loadComponent: () =>
      import('./components/finance/finance.component').then((m) => m.FinanceComponent),
    canActivate: [authGuard],
  },
  {
    path: 'home-org',
    loadComponent: () =>
      import('./components/home-org/home-org.component').then((m) => m.HomeOrgComponent),
    canActivate: [authGuard],
  },
  {
    path: 'social',
    loadComponent: () =>
      import('./components/social/social.component').then((m) => m.SocialComponent),
    canActivate: [authGuard],
  },
  {
    path: 'wellness',
    loadComponent: () =>
      import('./components/wellness/wellness.component').then((m) => m.WellnessComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard],
  },
];
