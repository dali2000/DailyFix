export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  date: Date;
  notes?: string;
}

export interface PhysicalActivity {
  id: string;
  type: string;
  duration: number; // in minutes
  calories?: number;
  date: Date;
  notes?: string;
}

export interface SleepRecord {
  id: string;
  date: Date;
  sleepTime: Date;
  wakeTime: Date;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  hours: number;
}

export interface WaterIntake {
  id: string;
  date: Date;
  amount: number; // in liters
}

export interface MeditationSession {
  id: string;
  date: Date;
  duration: number; // in minutes
  type: string;
  notes?: string;
}


