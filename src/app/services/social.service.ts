import { Injectable } from '@angular/core';
import { SocialEvent, ActivitySuggestion } from '../models/social.model';

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

  constructor() {
    this.loadFromStorage();
  }

  // Social Event methods
  getEvents(): SocialEvent[] {
    return [...this.events];
  }

  addEvent(event: Omit<SocialEvent, 'id'>): SocialEvent {
    const newEvent: SocialEvent = {
      ...event,
      id: this.generateId()
    };
    this.events.push(newEvent);
    this.saveToStorage();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<SocialEvent>): SocialEvent | null {
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

  getUpcomingEvents(): SocialEvent[] {
    const now = new Date();
    return this.events
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getEventsForDate(date: Date): SocialEvent[] {
    const dateStr = date.toDateString();
    return this.events.filter(e => new Date(e.date).toDateString() === dateStr);
  }

  getBirthdays(): SocialEvent[] {
    return this.events.filter(e => e.type === 'birthday');
  }

  // Activity Suggestion methods
  getActivitySuggestions(): ActivitySuggestion[] {
    return [...this.suggestions];
  }

  getSuggestionsByCategory(category: ActivitySuggestion['category']): ActivitySuggestion[] {
    return this.suggestions.filter(s => s.category === category);
  }

  addCustomSuggestion(suggestion: Omit<ActivitySuggestion, 'id'>): ActivitySuggestion {
    const newSuggestion: ActivitySuggestion = {
      ...suggestion,
      id: this.generateId()
    };
    this.suggestions.push(newSuggestion);
    this.saveToStorage();
    return newSuggestion;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    localStorage.setItem('dailyFix_socialEvents', JSON.stringify(this.events));
    localStorage.setItem('dailyFix_activitySuggestions', JSON.stringify(this.suggestions));
  }

  private loadFromStorage(): void {
    const eventsStr = localStorage.getItem('dailyFix_socialEvents');
    const suggestionsStr = localStorage.getItem('dailyFix_activitySuggestions');

    if (eventsStr) {
      this.events = JSON.parse(eventsStr).map((e: any) => ({
        ...e,
        date: new Date(e.date),
        reminder: e.reminder ? new Date(e.reminder) : undefined
      }));
    }
    if (suggestionsStr) {
      this.suggestions = JSON.parse(suggestionsStr);
    }
  }
}


