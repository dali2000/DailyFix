import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

export interface User {
  id: number | string;
  fullName: string;
  email: string;
  provider?: 'local' | 'google';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'dailyfix_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient
  ) {
    // Vérifier si le token est valide au démarrage
    this.validateToken();
  }

  private setCurrentUser(user: User | null): void {
    if (!user) {
      // Supprimer le token quand l'utilisateur est null
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.currentUserSubject.next(user);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  signup(signupData: SignupData): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', signupData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  signupWithGoogle(googleUser: { name: string; email: string; sub: string }): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/google', googleUser).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  logout(): void {
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getCurrentUser() !== null;
  }

  // Valider le token avec le backend
  validateToken(): void {
    const token = this.getToken();
    if (!token) {
      this.setCurrentUser(null);
      return;
    }

    // Utiliser HttpClient directement pour avoir accès au status de l'erreur HTTP
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`, { headers })
      .subscribe({
        next: (response: AuthResponse) => {
          if (response.success && response.user) {
            this.setCurrentUser(response.user);
          } else {
            console.warn('Token validation failed: invalid response', response);
            this.setCurrentUser(null);
          }
        },
        error: (error: any) => {
          // Ne supprimer le token que si c'est une erreur 401 (Unauthorized)
          // Pour les autres erreurs (connexion, serveur, etc.), garder le token
          const status = error?.status || 0;
          const isUnauthorized = status === 401;
          
          if (isUnauthorized) {
            console.warn('Token validation failed: unauthorized (401)', error);
            // Token invalide ou expiré - supprimer le token
            this.setCurrentUser(null);
          } else {
            // Erreur de connexion (status 0) ou serveur (500, etc.) - garder le token
            console.warn('Token validation error (keeping token, status:', status, ')', error);
            // Ne pas définir l'utilisateur mais garder le token
            // L'utilisateur restera null jusqu'à ce que la connexion soit rétablie
            // Le token reste dans localStorage pour une nouvelle tentative
          }
        }
      });
  }

  // Méthode pour mettre à jour le profil utilisateur
  updateUser(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      ...userData
    };

    this.setCurrentUser(updatedUser);
  }

  // Méthode pour obtenir l'ID de l'utilisateur actuel
  getCurrentUserId(): number | string | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.id : null;
  }
}
