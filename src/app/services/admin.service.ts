import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface AdminStats {
  users: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    active: number;
    recent: User[];
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
  };
  events: {
    total: number;
    upcoming: number;
  };
  health: {
    meals: number;
    activities: number;
    sleepRecords: number;
  };
  finance: {
    expenses: number;
    budgets: number;
    savingsGoals: number;
  };
  wellness: {
    journalEntries: number;
    personalGoals: number;
  };
  social: {
    events: number;
  };
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  provider: 'local' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private apiService: ApiService) {}

  // Statistics
  getStats(): Observable<{ success: boolean; data: AdminStats; message?: string }> {
    return this.apiService.get<{ success: boolean; data: AdminStats; message?: string }>('/admin/stats');
  }

  // User Management
  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<UsersResponse> {
    const params: any = { page, limit };
    if (search) {
      params.search = search;
    }
    return this.apiService.get<UsersResponse>('/admin/users', params);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/admin/users/${id}`);
  }

  createUser(userData: { fullName: string; email: string; password?: string; role?: 'user' | 'admin' }): Observable<UserResponse> {
    return this.apiService.post<UserResponse>('/admin/users', userData);
  }

  updateUser(id: number, userData: { fullName?: string; email?: string; role?: 'user' | 'admin' }): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/admin/users/${id}`, userData);
  }

  deleteUser(id: number): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/admin/users/${id}`);
  }
}

