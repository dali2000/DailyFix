import { Routes } from '@angular/router';

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
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((t) => t.HomeComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./components/tasks/tasks.component').then((m) => m.TasksComponent),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./components/calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: 'health',
    loadComponent: () =>
      import('./components/health/health.component').then((m) => m.HealthComponent),
  },
  {
    path: 'finance',
    loadComponent: () =>
      import('./components/finance/finance.component').then((m) => m.FinanceComponent),
  },
  {
    path: 'home-org',
    loadComponent: () =>
      import('./components/home-org/home-org.component').then((m) => m.HomeOrgComponent),
  },
  {
    path: 'social',
    loadComponent: () =>
      import('./components/social/social.component').then((m) => m.SocialComponent),
  },
  {
    path: 'wellness',
    loadComponent: () =>
      import('./components/wellness/wellness.component').then((m) => m.WellnessComponent),
  },
];
