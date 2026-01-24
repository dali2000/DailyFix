import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string; // En production, ne jamais stocker le mot de passe en clair
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

    this.setCurrentUser(user);
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
}

