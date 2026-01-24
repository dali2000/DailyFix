import { Injectable } from '@angular/core';
import { ShoppingList, ShoppingItem, HouseholdTask } from '../models/home.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private shoppingLists: ShoppingList[] = [];
  private householdTasks: HouseholdTask[] = [];

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur pour recharger les données
    this.authService.currentUser$.subscribe(() => {
      this.loadFromStorage();
    });
    this.loadFromStorage();
  }

  // Shopping List methods
  getShoppingLists(): ShoppingList[] {
    return [...this.shoppingLists];
  }

  getShoppingListById(id: string): ShoppingList | undefined {
    return this.shoppingLists.find(list => list.id === id);
  }

  addShoppingList(list: Omit<ShoppingList, 'id' | 'createdAt'>): ShoppingList {
    const newList: ShoppingList = {
      ...list,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.shoppingLists.push(newList);
    this.saveToStorage();
    return newList;
  }

  updateShoppingList(id: string, updates: Partial<ShoppingList>): ShoppingList | null {
    const index = this.shoppingLists.findIndex(list => list.id === id);
    if (index === -1) return null;
    this.shoppingLists[index] = { ...this.shoppingLists[index], ...updates };
    this.saveToStorage();
    return this.shoppingLists[index];
  }

  deleteShoppingList(id: string): boolean {
    const index = this.shoppingLists.findIndex(list => list.id === id);
    if (index === -1) return false;
    this.shoppingLists.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  addItemToList(listId: string, item: Omit<ShoppingItem, 'id'>): ShoppingItem | null {
    const list = this.getShoppingListById(listId);
    if (!list) return null;
    const newItem: ShoppingItem = {
      ...item,
      id: this.generateId()
    };
    list.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  toggleItemPurchase(listId: string, itemId: string): boolean {
    const list = this.getShoppingListById(listId);
    if (!list) return false;
    const item = list.items.find(i => i.id === itemId);
    if (!item) return false;
    item.purchased = !item.purchased;
    this.saveToStorage();
    return true;
  }

  // Household Task methods
  getHouseholdTasks(): HouseholdTask[] {
    return [...this.householdTasks];
  }

  addHouseholdTask(task: Omit<HouseholdTask, 'id'>): HouseholdTask {
    const newTask: HouseholdTask = {
      ...task,
      id: this.generateId()
    };
    this.calculateNextDueDate(newTask);
    this.householdTasks.push(newTask);
    this.saveToStorage();
    return newTask;
  }

  updateHouseholdTask(id: string, updates: Partial<HouseholdTask>): HouseholdTask | null {
    const index = this.householdTasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.householdTasks[index] = { ...this.householdTasks[index], ...updates };
    if (updates.completed) {
      this.householdTasks[index].lastCompleted = new Date();
      this.calculateNextDueDate(this.householdTasks[index]);
    }
    this.saveToStorage();
    return this.householdTasks[index];
  }

  deleteHouseholdTask(id: string): boolean {
    const index = this.householdTasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.householdTasks.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getUpcomingHouseholdTasks(): HouseholdTask[] {
    const now = new Date();
    return this.householdTasks
      .filter(t => !t.completed && t.nextDueDate && new Date(t.nextDueDate) >= now)
      .sort((a, b) => {
        const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : 0;
        const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : 0;
        return dateA - dateB;
      });
  }

  private calculateNextDueDate(task: HouseholdTask): void {
    if (task.frequency === 'one-time' && task.dueDate) {
      task.nextDueDate = task.dueDate;
      return;
    }

    const baseDate = task.lastCompleted || new Date();
    const nextDate = new Date(baseDate);

    switch (task.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    task.nextDueDate = nextDate;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    const listsKey = this.authService.getUserStorageKey('shoppingLists');
    const tasksKey = this.authService.getUserStorageKey('householdTasks');
    localStorage.setItem(listsKey, JSON.stringify(this.shoppingLists));
    localStorage.setItem(tasksKey, JSON.stringify(this.householdTasks));
  }

  private loadFromStorage(): void {
    const listsKey = this.authService.getUserStorageKey('shoppingLists');
    const tasksKey = this.authService.getUserStorageKey('householdTasks');
    const listsStr = localStorage.getItem(listsKey);
    const tasksStr = localStorage.getItem(tasksKey);

    if (listsStr) {
      this.shoppingLists = JSON.parse(listsStr).map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt)
      }));
    }
    if (tasksStr) {
      this.householdTasks = JSON.parse(tasksStr).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
        nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : undefined
      }));
    }
  }
}


