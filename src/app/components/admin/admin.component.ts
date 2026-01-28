import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, AdminStats, User } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  users: User[] = [];
  loadingStats = false;
  loadingUsers = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  limit = 10;
  searchTerm = '';

  // User management
  selectedUser: User | null = null;
  showUserModal = false;
  showCreateModal = false;
  editMode = false;
  
  userForm = {
    fullName: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  };

  readonly skeletonCount = [1, 2, 3, 4, 5, 6, 7];

  get recentUsers(): User[] {
    return this.stats?.users?.recent ?? [];
  }

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est admin
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/home']);
      return;
    }

    this.loadStats();
    this.loadUsers();
  }

  loadStats() {
    this.loadingStats = true;
    this.error = null;
    this.adminService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Erreur lors du chargement des statistiques';
        this.error = errorMessage;
        this.loadingStats = false;
      }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.error = null;
    this.adminService.getUsers(this.currentPage, this.limit, this.searchTerm).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data.users;
          this.totalPages = response.data.pagination.totalPages;
          this.totalUsers = response.data.pagination.total;
        }
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = error?.error?.message || error?.message || 'Erreur lors du chargement des utilisateurs';
        this.loadingUsers = false;
      }
    });
  }

  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = null), 4000);
  }

  dismissMessages() {
    this.error = null;
    this.successMessage = null;
  }

  searchUsers() {
    this.currentPage = 1;
    this.loadUsers();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  openCreateModal() {
    this.userForm = {
      fullName: '',
      email: '',
      password: '',
      role: 'user'
    };
    this.editMode = false;
    this.showCreateModal = true;
  }

  openEditModal(user: User) {
    this.selectedUser = user;
    this.userForm = {
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role
    };
    this.editMode = true;
    this.showUserModal = true;
  }

  closeModal() {
    this.showUserModal = false;
    this.showCreateModal = false;
    this.selectedUser = null;
  }

  createUser() {
    if (!this.userForm.fullName || !this.userForm.email) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.loadingUsers = true;
    this.adminService.createUser(this.userForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadUsers();
          this.loadStats();
          this.showSuccess('Utilisateur créé avec succès');
        }
        this.loadingUsers = false;
      },
      error: (error) => {
        this.error = error?.error?.message || error?.message || 'Erreur lors de la création de l\'utilisateur';
        this.loadingUsers = false;
      }
    });
  }

  updateUser() {
    if (!this.selectedUser) return;

    this.loadingUsers = true;
    const updateData: { fullName: string; email: string; role: 'user' | 'admin'; password?: string } = {
      fullName: this.userForm.fullName,
      email: this.userForm.email,
      role: this.userForm.role
    };
    if (this.userForm.password) {
      updateData.password = this.userForm.password;
    }

    this.adminService.updateUser(this.selectedUser.id as number, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadUsers();
          this.loadStats();
          this.showSuccess('Utilisateur mis à jour avec succès');
        }
        this.loadingUsers = false;
      },
      error: (error) => {
        this.error = error?.error?.message || error?.message || 'Erreur lors de la mise à jour de l\'utilisateur';
        this.loadingUsers = false;
      }
    });
  }

  deleteUser(user: User) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.fullName} ? Toutes ses données seront supprimées.`)) {
      return;
    }

    this.loadingUsers = true;
    this.adminService.deleteUser(user.id as number).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.loadStats();
          this.showSuccess('Utilisateur supprimé avec succès');
        }
        this.loadingUsers = false;
      },
      error: (error) => {
        this.error = error?.error?.message || error?.message || 'Erreur lors de la suppression de l\'utilisateur';
        this.loadingUsers = false;
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'badge-admin' : 'badge-user';
  }
}

