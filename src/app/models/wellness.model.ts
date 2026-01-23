export interface JournalEntry {
  id: string;
  date: Date;
  title?: string;
  content: string;
  mood?: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  tags?: string[];
}

export interface PersonalGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  progress: number; // 0-100
  completed: boolean;
  category: 'health' | 'career' | 'personal' | 'financial' | 'other';
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: Date;
}

export interface StressManagement {
  id: string;
  date: Date;
  stressLevel: number; // 1-10
  triggers?: string[];
  copingStrategies?: string[];
  notes?: string;
}


