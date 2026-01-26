import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si un token existe (refresh), essayer de restaurer l'utilisateur avant de décider
  if (authService.hasToken()) {
    return authService.ensureAuthenticated$().pipe(
      tap((ok) => {
        if (!ok) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }
      }),
      map((ok) => ok)
    );
  }

  // Aucun token: redirection immédiate vers login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });

  return of(false);
};
