import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService } from '../../services/social.service';
import { SocialEvent, ActivitySuggestion } from '../../models/social.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  templateUrl: './social.component.html',
  styleUrl: './social.component.css'
})
export class SocialComponent implements OnInit {
  activeTab: 'events' | 'suggestions' = 'events';
  
  events: SocialEvent[] = [];
  suggestions: ActivitySuggestion[] = [];
  
  showEventForm = false;
  showSuggestionForm = false;
  
  newEvent: Partial<SocialEvent> & { attendeesString?: string; dateString?: string; reminderString?: string } = { type: 'other' };
  editingEvent: SocialEvent | null = null;
  newSuggestion: Partial<ActivitySuggestion> = { category: 'outdoor' };

  eventTypes = ['birthday', 'anniversary', 'meeting', 'party', 'other'];
  suggestionCategories = ['outdoor', 'indoor', 'cultural', 'sport', 'relaxation'];

  constructor(private socialService: SocialService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    // Les subscriptions sont gérées dans les méthodes loadData
  }

  loadData(): void {
    // Charger toutes les données depuis l'API
    this.socialService.getEventsObservable().subscribe({
      next: (events) => {
        this.events = events.map((e: any) => ({
          ...e,
          id: e.id.toString(),
          date: new Date(e.date),
          reminder: e.reminder ? new Date(e.reminder) : undefined
        }));
      },
      error: (error) => console.error('Error loading social events:', error)
    });

    // Les suggestions peuvent être chargées depuis l'API ou utiliser les valeurs par défaut
    this.socialService.getSuggestionsObservable().subscribe({
      next: (suggestions) => {
        if (suggestions.length > 0) {
          this.suggestions = suggestions.map((s: any) => ({ ...s, id: s.id.toString() }));
        }
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
        // Utiliser les suggestions par défaut en cas d'erreur
        this.suggestions = this.socialService.getActivitySuggestions();
      }
    });
  }

  addEvent(): void {
    if (!this.newEvent.title || !this.newEvent.dateString) return;
    
    const attendees = this.newEvent.attendeesString 
      ? this.newEvent.attendeesString.split(',').map(a => a.trim()).filter(a => a)
      : undefined;

    const eventData: Omit<SocialEvent, 'id'> = {
      title: this.newEvent.title!,
      description: this.newEvent.description,
      date: new Date(this.newEvent.dateString),
      type: this.newEvent.type || 'other',
      attendees: attendees,
      location: this.newEvent.location,
      reminder: this.newEvent.reminderString ? new Date(this.newEvent.reminderString) : undefined
    };

    if (this.editingEvent) {
      this.socialService.updateEvent(this.editingEvent.id, eventData).subscribe({
        next: () => {
          this.editingEvent = null;
          this.showEventForm = false;
          this.resetEventForm();
          this.loadData();
        }
      });
    } else {
      this.socialService.addEvent(eventData).subscribe({
        next: () => {
          this.showEventForm = false;
          this.resetEventForm();
          this.loadData();
        }
      });
    }
  }

  resetEventForm(): void {
    this.newEvent = { type: 'other' };
  }

  editEvent(event: SocialEvent): void {
    this.editingEvent = event;
    this.newEvent = {
      title: event.title,
      description: event.description,
      type: event.type,
      location: event.location,
      attendeesString: event.attendees ? event.attendees.join(', ') : '',
      dateString: this.formatDateForInput(event.date),
      reminderString: event.reminder ? this.formatDateForInput(event.reminder) : undefined
    };
    this.showEventForm = true;
  }

  cancelEventForm(): void {
    this.showEventForm = false;
    this.editingEvent = null;
    this.resetEventForm();
  }

  closeSuggestionModal(): void {
    this.showSuggestionForm = false;
    this.newSuggestion = { category: 'outdoor' };
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  deleteEvent(id: string): void {
    if (confirm('Supprimer cet événement ?')) {
      this.socialService.deleteEvent(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  getUpcomingEvents(): SocialEvent[] {
    return this.socialService.getUpcomingEvents();
  }

  getBirthdays(): SocialEvent[] {
    return this.socialService.getBirthdays();
  }

  getEventTypeName(type: string): string {
    const names: { [key: string]: string } = {
      birthday: 'Anniversaire',
      anniversary: 'Anniversaire',
      meeting: 'Réunion',
      party: 'Fête',
      other: 'Autre'
    };
    return names[type] || type;
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      outdoor: 'Extérieur',
      indoor: 'Intérieur',
      cultural: 'Culturel',
      sport: 'Sport',
      relaxation: 'Détente'
    };
    return names[category] || category;
  }

  addCustomSuggestion(): void {
    if (!this.newSuggestion.title || !this.newSuggestion.description) return;
    this.socialService.addCustomSuggestion({
      title: this.newSuggestion.title!,
      description: this.newSuggestion.description!,
      category: this.newSuggestion.category || 'outdoor',
      estimatedCost: this.newSuggestion.estimatedCost,
      estimatedDuration: this.newSuggestion.estimatedDuration
    }).subscribe({
      next: () => {
        this.showSuggestionForm = false;
        this.newSuggestion = { category: 'outdoor' };
        this.loadData();
      }
    });
  }

  getSuggestionsByCategory(category: string): ActivitySuggestion[] {
    return this.suggestions.filter(s => s.category === category);
  }
}

