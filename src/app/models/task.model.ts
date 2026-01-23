export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  assignee?: string;
  reporter?: string;
  labels?: string[];
  storyPoints?: number;
  category?: string;
  reminder?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  type: 'task' | 'event' | 'reminder';
  color?: string;
}

