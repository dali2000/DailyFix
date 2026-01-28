import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, distinctUntilChanged } from 'rxjs';
import { Task, CalendarEvent } from '../models/task.model';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private events: CalendarEvent[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Charger les données seulement quand l'utilisateur est authentifié
    this.authService.currentUser$.pipe(
      distinctUntilChanged()
    ).subscribe((user) => {
      if (user !== null) {
        // Utilisateur connecté - charger les données (un seul GET)
        this.loadTasks();
        this.loadEvents();
      } else {
        // Utilisateur déconnecté - vider les données
        this.tasks = [];
        this.tasksSubject.next([]);
        this.events = [];
      }
    });
  }

  // Task methods
  getTasks(): Task[] {
    return [...this.tasks];
  }

  /** Observable partagé : un seul GET au login, les composants reçoivent le cache et les mises à jour. */
  getTasksObservable(): Observable<Task[]> {
    return this.tasksSubject.asObservable();
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  getTaskByIdObservable(id: string): Observable<Task> {
    return this.apiService.get<ApiResponse<Task>>(`/tasks/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Observable<Task> {
    return this.apiService.post<ApiResponse<Task>>('/tasks', task).pipe(
      map(response => response.data!),
      tap(newTask => {
        const normalized = this.normalizeTask(newTask);
        this.tasks.push(normalized);
        this.tasksSubject.next([...this.tasks]);
      })
    );
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    return this.apiService.put<ApiResponse<Task>>(`/tasks/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedTask => {
        const normalized = this.normalizeTask(updatedTask);
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tasks[index] = normalized;
        }
        this.tasksSubject.next([...this.tasks]);
      })
    );
  }

  deleteTask(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/tasks/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tasks.splice(index, 1);
        }
        this.tasksSubject.next([...this.tasks]);
      })
    );
  }

  getTasksForDate(date: Date): Task[] {
    const dateStr = date.toDateString();
    return this.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate).toDateString() === dateStr
    );
  }

  getTasksByStatus(status: Task['status']): Observable<Task[]> {
    return this.apiService.get<ApiResponse<Task[]>>(`/tasks/status/${status}`).pipe(
      map(response => response.data || [])
    );
  }

  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.updateTask(id, { status });
  }

  getCompletedTasksCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }

  getTasksCompletedTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.tasks.filter(t => {
      if (t.status !== 'done' && !t.completed) return false;
      const updatedAt = t.updatedAt ? new Date(t.updatedAt) : null;
      return updatedAt && updatedAt.toDateString() === todayStr;
    }).length;
  }

  getTotalTasksCount(): number {
    return this.tasks.length;
  }

  // Calendar Event methods
  getEvents(): CalendarEvent[] {
    return [...this.events];
  }

  getEventsObservable(): Observable<CalendarEvent[]> {
    return this.apiService.get<ApiResponse<CalendarEvent[]>>('/events').pipe(
      map(response => response.data || []),
      tap(events => this.events = events)
    );
  }

  addEvent(event: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
    return this.apiService.post<ApiResponse<CalendarEvent>>('/events', event).pipe(
      map(response => response.data!),
      tap(newEvent => {
        this.events.push(newEvent);
      })
    );
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): Observable<CalendarEvent> {
    return this.apiService.put<ApiResponse<CalendarEvent>>(`/events/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedEvent => {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
          this.events[index] = updatedEvent;
        }
      })
    );
  }

  deleteEvent(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/events/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
          this.events.splice(index, 1);
        }
      })
    );
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toDateString();
    return this.events.filter(e => 
      new Date(e.startDate).toDateString() === dateStr
    );
  }

  getEventsForDateObservable(date: Date): Observable<CalendarEvent[]> {
    const dateStr = date.toISOString().split('T')[0];
    return this.apiService.get<ApiResponse<CalendarEvent[]>>(`/events/date/${dateStr}`).pipe(
      map(response => response.data || [])
    );
  }

  private normalizeTask(t: any): Task {
    return {
      ...t,
      id: t.id?.toString() ?? t.id,
      status: t.status || (t.completed ? 'done' : 'todo'),
      priority: t.priority || 'medium',
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      reminder: t.reminder ? new Date(t.reminder) : undefined,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt)
    };
  }

  private loadTasks(): void {
    if (!this.authService.isAuthenticated()) {
      this.tasks = [];
      this.tasksSubject.next([]);
      return;
    }
    this.apiService.get<ApiResponse<Task[]>>('/tasks').pipe(
      map(response => (response.data || []).map((t: any) => this.normalizeTask(t)))
    ).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.tasksSubject.next([...this.tasks]);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        this.tasksSubject.next([]);
      }
    });
  }

  private loadEvents(): void {
    if (this.authService.isAuthenticated()) {
      this.getEventsObservable().subscribe({
        next: (events) => {
          this.events = events.map((e: any) => ({
            ...e,
            id: e.id.toString(),
            startDate: new Date(e.startDate),
            endDate: e.endDate ? new Date(e.endDate) : undefined
          }));
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.events = [];
        }
      });
    } else {
      this.events = [];
    }
  }
}
