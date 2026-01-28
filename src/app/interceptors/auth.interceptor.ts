import { HttpInterceptorFn } from '@angular/common/http';

/** Clé du token en localStorage (même valeur que AuthService) — lecture directe pour éviter NG0200 (circular DI). */
const TOKEN_KEY = 'dailyfix_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

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

