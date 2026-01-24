import { Injectable } from '@angular/core';
import { Task, CalendarEvent } from '../models/task.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = [];
  private events: CalendarEvent[] = [];

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur pour recharger les données
    this.authService.currentUser$.subscribe(() => {
      this.loadFromStorage();
    });
    this.loadFromStorage();
  }

  // Task methods
  getTasks(): Task[] {
    return [...this.tasks];
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.push(newTask);
    this.saveToStorage();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.tasks[index] = { 
      ...this.tasks[index], 
      ...updates,
      updatedAt: new Date()
    };
    this.saveToStorage();
    return this.tasks[index];
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getTasksForDate(date: Date): Task[] {
    const dateStr = date.toDateString();
    return this.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate).toDateString() === dateStr
    );
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return this.tasks.filter(t => t.status === status);
  }

  updateTaskStatus(id: string, status: Task['status']): Task | null {
    return this.updateTask(id, { status });
  }

  getCompletedTasksCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }

  getTotalTasksCount(): number {
    return this.tasks.length;
  }

  // Calendar Event methods
  getEvents(): CalendarEvent[] {
    return [...this.events];
  }

  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: this.generateId()
    };
    this.events.push(newEvent);
    this.saveToStorage();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.events[index] = { ...this.events[index], ...updates };
    this.saveToStorage();
    return this.events[index];
  }

  deleteEvent(id: string): boolean {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.events.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toDateString();
    return this.events.filter(e => 
      new Date(e.startDate).toDateString() === dateStr
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    const tasksKey = this.authService.getUserStorageKey('tasks');
    const eventsKey = this.authService.getUserStorageKey('events');
    localStorage.setItem(tasksKey, JSON.stringify(this.tasks));
    localStorage.setItem(eventsKey, JSON.stringify(this.events));
  }

  private loadFromStorage(): void {
    const tasksKey = this.authService.getUserStorageKey('tasks');
    const eventsKey = this.authService.getUserStorageKey('events');
    const tasksStr = localStorage.getItem(tasksKey);
    const eventsStr = localStorage.getItem(eventsKey);
    if (tasksStr) {
      this.tasks = JSON.parse(tasksStr).map((t: any) => ({
        ...t,
        status: t.status || (t.completed ? 'done' : 'todo'),
        priority: t.priority || 'medium',
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        reminder: t.reminder ? new Date(t.reminder) : undefined,
        createdAt: new Date(t.createdAt),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt)
      }));
    }
    if (eventsStr) {
      this.events = JSON.parse(eventsStr).map((e: any) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined
      }));
    }
  }
}

