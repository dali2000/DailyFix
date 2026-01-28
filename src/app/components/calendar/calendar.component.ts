import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { SocialService } from '../../services/social.service';
import { Task, CalendarEvent } from '../../models/task.model';
import { SocialEvent } from '../../models/social.model';
import { ModalComponent } from '../shared/modal/modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  viewMode: 'month' | 'week' | 'day' = 'month';
  
  selectedDate: Date | null = null;
  eventsForSelectedDate: (CalendarEvent | SocialEvent)[] = [];
  
  showEventForm = false;
  editingEvent: CalendarEvent | null = null;
  newEvent: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    type?: 'event' | 'reminder';
    color?: string;
  } = {
    type: 'event',
    color: '#3b82f6'
  };

  daysInMonth: Date[] = [];
  weekDays: Date[] = [];
  currentDay: Date = new Date();

  weekdayKeys = ['calendar.sun', 'calendar.mon', 'calendar.tue', 'calendar.wed', 'calendar.thu', 'calendar.fri', 'calendar.sat'];
  eventColors = [
    { value: '#3b82f6', labelKey: 'calendar.blue' },
    { value: '#10b981', labelKey: 'calendar.green' },
    { value: '#f59e0b', labelKey: 'calendar.orange' },
    { value: '#ef4444', labelKey: 'calendar.red' },
    { value: '#8b5cf6', labelKey: 'calendar.purple' },
    { value: '#ec4899', labelKey: 'calendar.pink' }
  ];

  constructor(
    private taskService: TaskService,
    private socialService: SocialService
  ) {}

  ngOnInit(): void {
    this.loadCalendar();
  }

  loadCalendar(): void {
    if (this.viewMode === 'month') {
      this.generateMonthDays();
    } else if (this.viewMode === 'week') {
      this.generateWeekDays();
    }
  }

  generateMonthDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    this.daysInMonth = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.daysInMonth.push(date);
    }
  }

  generateWeekDays(): void {
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(date);
    }
  }

  previousPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.viewMode === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.loadCalendar();
  }

  nextPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.viewMode === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.loadCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadCalendar();
  }

  setViewMode(mode: 'month' | 'week' | 'day'): void {
    this.viewMode = mode;
    this.loadCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  getEventsForDate(date: Date): (CalendarEvent | SocialEvent)[] {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    // Utiliser les données chargées depuis l'API (déjà dans le cache du service)
    const events = this.taskService.getEvents();
    const socialEvents = this.socialService.getEventsForDate(date);
    
    // Filtrer pour ne garder que les événements et rappels, pas les tâches
    const filteredEvents = events.filter(e => {
      if (e.type !== 'event' && e.type !== 'reminder') return false;
      
      const eventStart = new Date(e.startDate);
      eventStart.setHours(0, 0, 0, 0);
      const eventStartTime = eventStart.getTime();
      
      const eventEnd = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      eventEnd.setHours(23, 59, 59, 999);
      const eventEndTime = eventEnd.getTime();
      
      // Vérifier si la date est dans la plage de l'événement
      return dateStart >= eventStartTime && dateStart <= eventEndTime;
    });
    
    return [...filteredEvents, ...socialEvents];
  }

  getEventColorForDate(date: Date): string | null {
    const events = this.getEventsForDate(date);
    if (events.length === 0) return null;
    
    // Prendre la couleur du premier événement trouvé (priorité aux CalendarEvent)
    const calendarEvent = events.find(e => this.isCalendarEvent(e));
    if (calendarEvent) {
      return this.getEventColor(calendarEvent);
    }
    
    // Sinon prendre le premier événement
    return this.getEventColor(events[0]);
  }

  getEventBackgroundColor(date: Date): string | null {
    const color = this.getEventColorForDate(date);
    if (!color) return null;
    
    // Convertir hex en rgba avec transparence
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  }

  hasEventsOnDate(date: Date): boolean {
    return this.getEventsForDate(date).length > 0;
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.eventsForSelectedDate = this.getEventsForDate(date);
    this.newEvent.startDate = date.toISOString().split('T')[0];
  }

  toggleEventForm(): void {
    this.showEventForm = !this.showEventForm;
    if (!this.showEventForm) {
      this.editingEvent = null;
      this.resetEventForm();
    }
  }

  closeEventModal(): void {
    this.showEventForm = false;
    this.editingEvent = null;
    this.resetEventForm();
  }

  resetEventForm(): void {
    this.newEvent = {
      title: '',
      description: '',
      type: 'event',
      color: '#3b82f6',
      startDate: this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: undefined
    };
  }

  saveEvent(): void {
    if (!this.newEvent.title?.trim()) return;

    const eventData: Partial<CalendarEvent> = {
      title: this.newEvent.title,
      description: this.newEvent.description,
      startDate: new Date(this.newEvent.startDate!),
      endDate: this.newEvent.endDate ? new Date(this.newEvent.endDate) : undefined,
      type: this.newEvent.type || 'event',
      color: this.newEvent.color || '#3b82f6'
    };

    if (this.editingEvent) {
      this.taskService.updateEvent(this.editingEvent.id, eventData).subscribe({
        next: () => {
          this.editingEvent = null;
          this.showEventForm = false;
          this.resetEventForm();
          this.loadCalendar();
          if (this.selectedDate) {
            this.eventsForSelectedDate = this.getEventsForDate(this.selectedDate);
          }
        }
      });
    } else {
      this.taskService.addEvent(eventData as Omit<CalendarEvent, 'id'>).subscribe({
        next: () => {
          this.showEventForm = false;
          this.resetEventForm();
          this.loadCalendar();
          if (this.selectedDate) {
            this.eventsForSelectedDate = this.getEventsForDate(this.selectedDate);
          }
        }
      });
    }
  }

  editEvent(event: CalendarEvent): void {
    this.editingEvent = event;
    this.newEvent = {
      title: event.title,
      description: event.description,
      type: event.type === 'task' ? 'event' : event.type,
      color: event.color || '#3b82f6',
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : undefined,
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : undefined
    };
    this.showEventForm = true;
  }

  deleteEvent(event: CalendarEvent): void {
    if (confirm('Supprimer cet événement ?')) {
      this.taskService.deleteEvent(event.id).subscribe({
        next: () => {
          this.loadCalendar();
          if (this.selectedDate) {
            this.eventsForSelectedDate = this.getEventsForDate(this.selectedDate);
          }
        }
      });
    }
  }

  getMonthName(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  getMonthNameOnly(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long' });
  }

  getYear(): number {
    return this.currentDate.getFullYear();
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  getDayNumber(date: Date): number {
    return date.getDate();
  }

  isCalendarEvent(event: CalendarEvent | SocialEvent): event is CalendarEvent {
    return 'startDate' in event;
  }

  getEventDate(event: CalendarEvent | SocialEvent): Date {
    return this.isCalendarEvent(event) ? event.startDate : event.date;
  }

  getEventColor(event: CalendarEvent | SocialEvent): string {
    return this.isCalendarEvent(event) ? (event.color || '#007bff') : '#ff9800';
  }
}

