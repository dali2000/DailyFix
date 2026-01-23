export interface SocialEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'birthday' | 'anniversary' | 'meeting' | 'party' | 'other';
  attendees?: string[];
  location?: string;
  reminder?: Date;
}

export interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  category: 'outdoor' | 'indoor' | 'cultural' | 'sport' | 'relaxation';
  estimatedCost?: number;
  estimatedDuration?: number; // in minutes
}


