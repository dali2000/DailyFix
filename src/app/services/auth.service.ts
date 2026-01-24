import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string; // Optionnel pour les utilisateurs Google
  provider?: 'local' | 'google'; // Source d'authentification
  createdAt: string;
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'dailyfix_users';
  private readonly CURRENT_USER_KEY = 'dailyfix_current_user';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    // Initialiser avec un utilisateur par défaut si aucun utilisateur n'existe
    this.initializeDefaultUser();
  }

  private initializeDefaultUser(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      // Créer un utilisateur par défaut pour les tests
      const defaultUser: User = {
        id: this.generateId(),
        fullName: 'Alex Martin',
        email: 'alex@example.com',
        password: 'password123',
        provider: 'local',
        createdAt: new Date().toISOString()
      };
      this.saveUser(defaultUser);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getUsers(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private saveUser(user: User): void {
    const users = this.getUsers();
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = user;
    } else {
      users.push(user);
    }
    
    this.saveUsers(users);
  }

  private getCurrentUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
    this.currentUserSubject.next(user);
  }

  signup(signupData: SignupData): { success: boolean; error?: string } {
    const users = this.getUsers();
    
    // Vérifier si l'email existe déjà
    const existingUser = users.find(u => u.email.toLowerCase() === signupData.email.toLowerCase());
    if (existingUser) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: this.generateId(),
      fullName: signupData.fullName,
      email: signupData.email,
      password: signupData.password, // En production, hasher le mot de passe
      provider: 'local',
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.setCurrentUser(newUser);
    
    return { success: true };
  }

  login(credentials: LoginCredentials): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === credentials.email.toLowerCase() &&
           u.password === credentials.password
    );

    if (!user) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    // Vérifier que l'utilisateur n'est pas un utilisateur Google (qui n'a pas de mot de passe)
    if (user.provider === 'google') {
      return { success: false, error: 'Veuillez vous connecter avec Google' };
    }

    this.setCurrentUser(user);
    return { success: true };
  }

  // Inscription avec Google
  signupWithGoogle(googleUser: { name: string; email: string; sub: string }): { success: boolean; error?: string } {
    const users = this.getUsers();
    
    // Vérifier si l'utilisateur existe déjà
    let existingUser = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
    
    if (existingUser) {
      // Si l'utilisateur existe, se connecter directement
      this.setCurrentUser(existingUser);
      return { success: true };
    }

    // Créer un nouvel utilisateur Google
    const newUser: User = {
      id: googleUser.sub || this.generateId(),
      fullName: googleUser.name,
      email: googleUser.email,
      provider: 'google',
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.setCurrentUser(newUser);
    
    return { success: true };
  }

  logout(): void {
    this.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
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

    this.saveUser(updatedUser);
    this.setCurrentUser(updatedUser);
  }

  // Méthode pour obtenir la clé de stockage basée sur l'ID utilisateur
  getUserStorageKey(key: string): string {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      // Si aucun utilisateur n'est connecté, utiliser une clé par défaut (ne devrait pas arriver)
      return `dailyFix_${key}`;
    }
    return `dailyFix_${currentUser.id}_${key}`;
  }

  // Méthode pour obtenir l'ID de l'utilisateur actuel
  getCurrentUserId(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.id : null;
  }
}

