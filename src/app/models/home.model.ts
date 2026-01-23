export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  purchased: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
  completed: boolean;
}

export interface HouseholdTask {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  dueDate?: Date;
  completed: boolean;
  lastCompleted?: Date;
  nextDueDate?: Date;
}


