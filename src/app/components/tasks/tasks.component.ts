import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
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
    { id: 'todo', labelKey: 'tasks.todo', color: '#6b7280' },
    { id: 'in-progress', labelKey: 'tasks.inProgress', color: '#3b82f6' },
    { id: 'in-review', labelKey: 'tasks.inReview', color: '#f59e0b' },
    { id: 'done', labelKey: 'tasks.done', color: '#10b981' }
  ];

  priorityOptions = [
    { value: 'lowest', labelKey: 'tasks.lowest', icon: '⬇️' },
    { value: 'low', labelKey: 'tasks.low', icon: '🔽' },
    { value: 'medium', labelKey: 'tasks.medium', icon: '➡️' },
    { value: 'high', labelKey: 'tasks.high', icon: '🔼' },
    { value: 'highest', labelKey: 'tasks.highest', icon: '⬆️' }
  ];

  draggedTask: Task | null = null;

  /** Touch / long-press drag (tablette, mobile) */
  private longPressDelay = 450;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  isTouchDragging = false;
  private lastTouchClientX = 0;
  private lastTouchClientY = 0;
  private touchStartTask: Task | null = null;
  /** Ignorer le prochain clic après un touch-drag pour éviter d’ouvrir l’édition. */
  private touchDragJustEnded = false;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private i18n: I18nService
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
          // Liste mise à jour via getTasksObservable(), pas besoin de recharger
        }
      });
    } else {
      this.taskService.addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: () => {
          this.showAddForm = false;
          this.resetForm();
          // Liste mise à jour via getTasksObservable(), pas besoin de recharger
        }
      });
    }
  }

  editTask(task: Task): void {
    if (this.touchDragJustEnded) return;
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
    if (this.touchDragJustEnded) return;
    if (confirm('Supprimer cette tâche ?')) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          // Liste mise à jour via getTasksObservable(), pas besoin de recharger
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
    this.moveTaskToStatus(this.draggedTask, targetStatus);
    this.draggedTask = null;
  }

  /** Déplace une tâche vers un statut (souris ou tactile). */
  moveTaskToStatus(task: Task, targetStatus: string): void {
    if (!this.isValidStatus(targetStatus) || task.status === targetStatus) return;

    const taskId = task.id;
    const previousStatus = task.status;

    const t = this.tasks.find(x => x.id === taskId);
    if (t) {
      t.status = targetStatus as Task['status'];
      t.completed = targetStatus === 'done';
      this.applyFilters();
    }

    this.taskService.updateTaskStatus(taskId, targetStatus as Task['status']).subscribe({
      error: () => {
        const rollback = this.tasks.find(x => x.id === taskId);
        if (rollback) {
          rollback.status = previousStatus;
          rollback.completed = previousStatus === 'done';
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

  /** Long-press sur la carte : après un maintien, la tâche peut être déposée sur une colonne (tactile). */
  onTouchStart(ev: TouchEvent, task: Task): void {
    if (ev.touches.length !== 1) return;
    this.touchStartTask = task;
    this.lastTouchClientX = ev.touches[0].clientX;
    this.lastTouchClientY = ev.touches[0].clientY;
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.startTouchDrag(task);
      this.longPressTimer = null;
    }, this.longPressDelay);
  }

  onTouchMove(ev: TouchEvent): void {
    if (ev.touches.length !== 1) return;
    if (this.isTouchDragging) {
      ev.preventDefault();
      this.lastTouchClientX = ev.touches[0].clientX;
      this.lastTouchClientY = ev.touches[0].clientY;
      return;
    }
    const dx = ev.touches[0].clientX - this.lastTouchClientX;
    const dy = ev.touches[0].clientY - this.lastTouchClientY;
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
      this.clearLongPressTimer();
      this.touchStartTask = null;
    }
  }

  onTouchEnd(ev: TouchEvent): void {
    this.clearLongPressTimer();
    if (!this.isTouchDragging || !this.draggedTask) {
      this.touchStartTask = null;
      this.isTouchDragging = false;
      this.draggedTask = null;
      return;
    }
    const touch = ev.changedTouches?.[0];
    const x = touch?.clientX ?? this.lastTouchClientX;
    const y = touch?.clientY ?? this.lastTouchClientY;
    const el = document.elementFromPoint(x, y);
    const columnEl = el?.closest('.kanban-column');
    const columnId = columnEl?.getAttribute('data-column-id');
    if (columnId && this.isValidStatus(columnId)) {
      this.moveTaskToStatus(this.draggedTask, columnId);
    }
    this.isTouchDragging = false;
    this.draggedTask = null;
    this.touchStartTask = null;
    this.touchDragJustEnded = true;
    setTimeout(() => { this.touchDragJustEnded = false; }, 300);
  }

  onTouchCancel(): void {
    this.clearLongPressTimer();
    this.isTouchDragging = false;
    this.draggedTask = null;
    this.touchStartTask = null;
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private startTouchDrag(task: Task): void {
    this.draggedTask = task;
    this.isTouchDragging = true;
    this.touchStartTask = null;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityLabel(priority: string): string {
    const option = this.priorityOptions.find(p => p.value === priority);
    return option ? `${option.icon} ${this.i18n.instant(option.labelKey)}` : priority;
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
    return column ? this.i18n.instant(column.labelKey) : status;
  }

  get modalTitleKey(): string {
    return this.editingTask ? 'tasks.editTask' : 'tasks.createNewTask';
  }
}
