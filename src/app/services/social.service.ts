import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged } from 'rxjs';
import { SocialEvent, ActivitySuggestion } from '../models/social.model';
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
export class SocialService {
  private events: SocialEvent[] = [];
  private suggestions: ActivitySuggestion[] = [
    {
      id: '1',
      title: 'Randonnée en forêt',
      description: 'Profitez d\'une belle journée pour une randonnée en nature',
      category: 'outdoor',
      estimatedCost: 0,
      estimatedDuration: 120
    },
    {
      id: '2',
      title: 'Visite d\'un musée',
      description: 'Découvrez l\'art et l\'histoire dans un musée local',
      category: 'cultural',
      estimatedCost: 15,
      estimatedDuration: 180
    },
    {
      id: '3',
      title: 'Pique-nique au parc',
      description: 'Un pique-nique simple et agréable avec des amis',
      category: 'outdoor',
      estimatedCost: 20,
      estimatedDuration: 120
    },
    {
      id: '4',
      title: 'Séance de cinéma',
      description: 'Regardez un film au cinéma ou à la maison',
      category: 'indoor',
      estimatedCost: 12,
      estimatedDuration: 150
    },
    {
      id: '5',
      title: 'Cours de cuisine',
      description: 'Apprenez à cuisiner un nouveau plat ensemble',
      category: 'indoor',
      estimatedCost: 30,
      estimatedDuration: 120
    }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Charger les données seulement quand l'utilisateur est authentifié
    this.authService.currentUser$.pipe(
      distinctUntilChanged()
    ).subscribe((user) => {
      if (user !== null) {
        // Utilisateur connecté - charger les données
        this.loadAll();
      } else {
        // Utilisateur déconnecté - vider les données (garder les suggestions par défaut)
        this.events = [];
      }
    });
  }

  // Social Event methods
  getEvents(): SocialEvent[] {
    return [...this.events];
  }

  getEventsObservable(): Observable<SocialEvent[]> {
    return this.apiService.get<ApiResponse<SocialEvent[]>>('/social/events').pipe(
      map(response => response.data || []),
      tap(events => this.events = events.map(e => ({
        ...e,
        id: e.id.toString(),
        date: new Date(e.date),
        reminder: e.reminder ? new Date(e.reminder) : undefined
      })))
    );
  }

  getEventById(id: string): SocialEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  getEventByIdObservable(id: string): Observable<SocialEvent> {
    return this.apiService.get<ApiResponse<SocialEvent>>(`/social/events/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addEvent(event: Omit<SocialEvent, 'id'>): Observable<SocialEvent> {
    return this.apiService.post<ApiResponse<SocialEvent>>('/social/events', event).pipe(
      map(response => response.data!),
      tap(newEvent => {
        this.events.push({
          ...newEvent,
          id: newEvent.id.toString(),
          date: new Date(newEvent.date),
          reminder: newEvent.reminder ? new Date(newEvent.reminder) : undefined
        });
      })
    );
  }

  updateEvent(id: string, updates: Partial<SocialEvent>): Observable<SocialEvent> {
    return this.apiService.put<ApiResponse<SocialEvent>>(`/social/events/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedEvent => {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
          this.events[index] = {
            ...updatedEvent,
            id: updatedEvent.id.toString(),
            date: new Date(updatedEvent.date),
            reminder: updatedEvent.reminder ? new Date(updatedEvent.reminder) : undefined
          };
        }
      })
    );
  }

  deleteEvent(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/social/events/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
          this.events.splice(index, 1);
        }
      })
    );
  }

  // Activity Suggestion methods
  getSuggestions(): ActivitySuggestion[] {
    return [...this.suggestions];
  }

  getSuggestionsObservable(): Observable<ActivitySuggestion[]> {
    return this.apiService.get<ApiResponse<ActivitySuggestion[]>>('/social/suggestions').pipe(
      map(response => response.data || []),
      tap(suggestions => {
        if (suggestions.length > 0) {
          this.suggestions = suggestions.map(s => ({ ...s, id: s.id.toString() }));
        }
      })
    );
  }

  addSuggestion(suggestion: Omit<ActivitySuggestion, 'id'>): Observable<ActivitySuggestion> {
    return this.apiService.post<ApiResponse<ActivitySuggestion>>('/social/suggestions', suggestion).pipe(
      map(response => response.data!),
      tap(newSuggestion => {
        this.suggestions.push({ ...newSuggestion, id: newSuggestion.id.toString() });
      })
    );
  }

  updateSuggestion(id: string, updates: Partial<ActivitySuggestion>): Observable<ActivitySuggestion> {
    return this.apiService.put<ApiResponse<ActivitySuggestion>>(`/social/suggestions/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedSuggestion => {
        const index = this.suggestions.findIndex(s => s.id === id);
        if (index !== -1) {
          this.suggestions[index] = { ...updatedSuggestion, id: updatedSuggestion.id.toString() };
        }
      })
    );
  }

  deleteSuggestion(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/social/suggestions/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.suggestions.findIndex(s => s.id === id);
        if (index !== -1) {
          this.suggestions.splice(index, 1);
        }
      })
    );
  }

  getEventsForDate(date: Date): SocialEvent[] {
    const dateStr = date.toDateString();
    return this.events.filter(e => {
      const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
      return eventDate.toDateString() === dateStr;
    });
  }

  getUpcomingEvents(): SocialEvent[] {
    const now = new Date();
    return this.events
      .filter(e => {
        const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  getBirthdays(): SocialEvent[] {
    return this.events.filter(e => e.type === 'birthday');
  }

  getActivitySuggestions(): ActivitySuggestion[] {
    return this.getSuggestions();
  }

  addCustomSuggestion(suggestion: Omit<ActivitySuggestion, 'id'>): Observable<ActivitySuggestion> {
    return this.addSuggestion(suggestion);
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      this.getEventsObservable().subscribe({
        error: (error) => console.error('Error loading social events:', error)
      });
      this.getSuggestionsObservable().subscribe({
        error: (error) => console.error('Error loading suggestions:', error)
      });
    } else {
      this.events = [];
      // Garder les suggestions par défaut même si non authentifié
    }
  }
}
