import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Si un token existe, l'ajouter au header Authorization
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return next(cloned);
    }

    // Ajouter Content-Type même sans token
    const cloned = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
    return next(cloned);
  } catch (error) {
    console.error('Interceptor error:', error);
    return next(req);
  }
};

