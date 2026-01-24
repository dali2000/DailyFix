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
  loading = false;
  error: string | null = null;
  
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
    this.loading = true;
    this.error = null;
    this.adminService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
          this.error = null;
        } else {
          this.error = response.message || 'Erreur lors du chargement des statistiques';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // Afficher le message d'erreur détaillé pour le débogage
        const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Erreur lors du chargement des statistiques';
        this.error = errorMessage;
        this.loading = false;
      }
    });
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers(this.currentPage, this.limit, this.searchTerm).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data.users;
          this.totalPages = response.data.pagination.totalPages;
          this.totalUsers = response.data.pagination.total;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
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

    this.loading = true;
    this.adminService.createUser(this.userForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeModal();
          this.loadUsers();
          this.loadStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.error = error.message || 'Erreur lors de la création de l\'utilisateur';
        this.loading = false;
      }
    });
  }

  updateUser() {
    if (!this.selectedUser) return;

    this.loading = true;
    const updateData: any = {
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
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.error = error.message || 'Erreur lors de la mise à jour de l\'utilisateur';
        this.loading = false;
      }
    });
  }

  deleteUser(user: User) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.fullName} ?`)) {
      return;
    }

    this.loading = true;
    this.adminService.deleteUser(user.id as number).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.loadStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.error = error.message || 'Erreur lors de la suppression de l\'utilisateur';
        this.loading = false;
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'badge-admin' : 'badge-user';
  }
}

