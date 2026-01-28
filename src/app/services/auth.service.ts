import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CurrencyService } from './currency.service';
import { environment } from '../../environments/environment';

export interface User {
  id: number | string;
  fullName: string;
  email: string;
  provider?: 'local' | 'google';
  role?: 'user' | 'admin';
  currency?: string;
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

export interface UpdateProfileResponse {
  success: boolean;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'dailyfix_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private ensureAuthInFlight$?: Observable<boolean>;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient,
    private currencyService: CurrencyService
  ) {
    // Vérifier si le token est valide au démarrage
    this.ensureAuthenticated$().subscribe();
  }

  private setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(this.TOKEN_KEY);
    } else if (user.currency) {
      this.currencyService.setSelectedCurrency(user.currency);
    }
    this.currentUserSubject.next(user);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
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

  /**
   * S'assure que l'utilisateur est restauré à partir du token (appel /auth/me).
   * - Renvoie `true` si on peut considérer l'accès comme authentifié.
   * - En cas de 401, purge le token et renvoie `false`.
   * - En cas d'erreur réseau/serveur, garde le token et renvoie `true` pour éviter une redirection login au refresh.
   */
  ensureAuthenticated$(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      this.setCurrentUser(null);
      return of(false);
    }

    // Déjà chargé
    if (this.getCurrentUser()) {
      return of(true);
    }

    // Partager l'appel en cours (guards multiples, refresh, etc.)
    if (this.ensureAuthInFlight$) {
      return this.ensureAuthInFlight$;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.ensureAuthInFlight$ = this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`, { headers }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          this.setCurrentUser(response.user);
          return true;
        }
        // Réponse invalide: on déconnecte (comportement strict)
        console.warn('Token validation failed: invalid response', response);
        this.setCurrentUser(null);
        return false;
      }),
      catchError((error: any) => {
        const status = error?.status || 0;
        if (status === 401) {
          console.warn('Token validation failed: unauthorized (401)', error);
          this.setCurrentUser(null);
          return of(false);
        }
        // Erreur réseau/serveur: ne pas forcer la redirection login au refresh
        console.warn('Token validation error (keeping token, status:', status, ')', error);
        return of(true);
      }),
      finalize(() => {
        this.ensureAuthInFlight$ = undefined;
      }),
      shareReplay(1)
    );

    return this.ensureAuthInFlight$;
  }

  // Méthode pour mettre à jour le profil utilisateur (local uniquement)
  updateUser(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    this.setCurrentUser({ ...currentUser, ...userData });
  }

  /**
   * Met à jour le profil sur le serveur (ex. devise) et synchronise l'état local.
   */
  updateProfile(patch: { currency?: string }): Observable<UpdateProfileResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<UpdateProfileResponse>(`${environment.apiUrl}/auth/me`, patch, { headers }).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  // Méthode pour obtenir l'ID de l'utilisateur actuel
  getCurrentUserId(): number | string | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.id : null;
  }
}
