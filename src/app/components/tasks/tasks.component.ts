import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit, OnDestroy {
  viewMode: 'kanban' | 'list' = 'kanban';
  
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  showAddForm = false;
  editingTask: Task | null = null;
  private tasksSubscription?: Subscription;
  
  newTask: {
    title?: string;
    description?: string;
    priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
    status?: 'todo' | 'in-progress' | 'in-review' | 'done';
    assignee?: string;
    labels?: string;
    storyPoints?: number;
    dueDate?: string;
  } = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo'
  };

  filter: 'all' | 'todo' | 'in-progress' | 'in-review' | 'done' = 'all';
  priorityFilter: 'all' | 'lowest' | 'low' | 'medium' | 'high' | 'highest' = 'all';
  searchQuery = '';

  statusColumns = [
    { id: 'todo', label: 'À faire', color: '#6b7280' },
    { id: 'in-progress', label: 'En cours', color: '#3b82f6' },
    { id: 'in-review', label: 'En révision', color: '#f59e0b' },
    { id: 'done', label: 'Terminé', color: '#10b981' }
  ];

  priorityOptions = [
    { value: 'lowest', label: 'Très basse', icon: '⬇️' },
    { value: 'low', label: 'Basse', icon: '🔽' },
    { value: 'medium', label: 'Moyenne', icon: '➡️' },
    { value: 'high', label: 'Haute', icon: '🔼' },
    { value: 'highest', label: 'Très haute', icon: '⬆️' }
  ];

  draggedTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  loadTasks(): void {
    this.tasksSubscription = this.taskService.getTasksObservable().subscribe({
      next: (tasks) => {
        this.tasks = tasks.map((t: any) => ({
          ...t,
          id: t.id.toString(),
          status: t.status || (t.completed ? 'done' : 'todo'),
          priority: t.priority || 'medium',
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          reminder: t.reminder ? new Date(t.reminder) : undefined,
          createdAt: new Date(t.createdAt),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt)
        }));
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    // Status filter
    if (this.filter !== 'all') {
      filtered = filtered.filter(t => t.status === this.filter);
    }

    // Priority filter
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === this.priorityFilter);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.assignee?.toLowerCase().includes(query) ||
        t.labels?.some(l => l.toLowerCase().includes(query))
      );
    }

    this.filteredTasks = filtered;
  }

  getTasksForStatus(status: string): Task[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.editingTask = null;
      this.resetForm();
    }
  }

  closeTaskModal(): void {
    this.showAddForm = false;
    this.editingTask = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo'
    };
  }

  saveTask(): void {
    if (!this.newTask.title?.trim()) return;

    const labels = this.newTask.labels 
      ? this.newTask.labels.split(',').map(l => l.trim()).filter(l => l)
      : [];

    const taskData: Partial<Task> = {
      title: this.newTask.title,
      description: this.newTask.description,
      priority: this.newTask.priority || 'medium',
      status: this.newTask.status || 'todo',
      assignee: this.newTask.assignee,
      labels: labels,
      storyPoints: this.newTask.storyPoints,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate) : undefined,
      completed: this.newTask.status === 'done'
    };

    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id, taskData).subscribe({
        next: () => {
          this.editingTask = null;
          this.showAddForm = false;
          this.resetForm();
          this.loadTasks();
        }
      });
    } else {
      this.taskService.addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: () => {
          this.showAddForm = false;
          this.resetForm();
          this.loadTasks();
        }
      });
    }
  }

  editTask(task: Task): void {
    this.editingTask = task;
    this.newTask = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      labels: task.labels?.join(', '),
      storyPoints: task.storyPoints,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined
    };
    this.showAddForm = true;
  }

  deleteTask(task: Task): void {
    if (confirm('Supprimer cette tâche ?')) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.loadTasks();
        }
      });
    }
  }

  onDragStart(task: Task): void {
    this.draggedTask = task;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetStatus: string): void {
    event.preventDefault();
    if (!this.draggedTask || !this.isValidStatus(targetStatus)) return;

    const taskId = this.draggedTask.id;
    const previousStatus = this.draggedTask.status;

    // Mise à jour optimiste : déplacer la tâche immédiatement dans l'UI
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = targetStatus as Task['status'];
      task.completed = targetStatus === 'done';
      this.applyFilters();
    }
    this.draggedTask = null;

    // Synchroniser avec le serveur en arrière-plan
    this.taskService.updateTaskStatus(taskId, targetStatus as Task['status']).subscribe({
      error: () => {
        // En cas d'erreur, revenir à l'état précédent
        const t = this.tasks.find(x => x.id === taskId);
        if (t) {
          t.status = previousStatus;
          t.completed = previousStatus === 'done';
          this.applyFilters();
        }
      }
    });
  }

  private isValidStatus(status: string): status is Task['status'] {
    return ['todo', 'in-progress', 'in-review', 'done'].includes(status);
  }

  onDragEnd(): void {
    this.draggedTask = null;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityLabel(priority: string): string {
    const option = this.priorityOptions.find(p => p.value === priority);
    return option ? `${option.icon} ${option.label}` : priority;
  }

  navigateToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  getStatusColor(status: Task['status']): string {
    const column = this.statusColumns.find(c => c.id === status);
    return column?.color || '#6b7280';
  }

  getStatusLabel(status: Task['status']): string {
    const column = this.statusColumns.find(c => c.id === status);
    return column?.label || status;
  }
}
