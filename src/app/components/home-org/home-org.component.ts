import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../services/home.service';
import { ShoppingList, ShoppingItem, HouseholdTask } from '../../models/home.model';

@Component({
  selector: 'app-home-org',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-org.component.html',
  styleUrl: './home-org.component.css'
})
export class HomeOrgComponent implements OnInit {
  activeTab: 'shopping' | 'tasks' = 'shopping';
  
  shoppingLists: ShoppingList[] = [];
  householdTasks: HouseholdTask[] = [];
  
  showShoppingForm = false;
  showTaskForm = false;
  selectedList: ShoppingList | null = null;
  
  newListName = '';
  newItem: Partial<ShoppingItem> = {};
  newTask: Partial<HouseholdTask> = { frequency: 'weekly' };

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.shoppingLists = this.homeService.getShoppingLists();
    this.householdTasks = this.homeService.getHouseholdTasks();
  }

  // Shopping List methods
  createShoppingList(): void {
    if (!this.newListName.trim()) return;
    const list = this.homeService.addShoppingList({
      name: this.newListName,
      items: [],
      completed: false
    });
    this.selectedList = list;
    this.newListName = '';
    this.showShoppingForm = false;
    this.loadData();
  }

  selectList(list: ShoppingList): void {
    this.selectedList = list;
  }

  addItemToList(): void {
    if (!this.selectedList || !this.newItem.name) return;
    this.homeService.addItemToList(this.selectedList.id, {
      name: this.newItem.name!,
      quantity: this.newItem.quantity,
      category: this.newItem.category,
      purchased: false,
      priority: this.newItem.priority || 'medium'
    });
    this.newItem = {};
    this.loadData();
    this.selectedList = this.homeService.getShoppingListById(this.selectedList.id) || null;
  }

  toggleItemPurchase(listId: string, itemId: string): void {
    this.homeService.toggleItemPurchase(listId, itemId);
    this.loadData();
    if (this.selectedList) {
      this.selectedList = this.homeService.getShoppingListById(this.selectedList.id) || null;
    }
  }

  deleteShoppingList(id: string): void {
    if (confirm('Supprimer cette liste ?')) {
      this.homeService.deleteShoppingList(id);
      if (this.selectedList?.id === id) {
        this.selectedList = null;
      }
      this.loadData();
    }
  }

  // Household Task methods
  addHouseholdTask(): void {
    if (!this.newTask.name) return;
    this.homeService.addHouseholdTask({
      name: this.newTask.name!,
      description: this.newTask.description,
      frequency: this.newTask.frequency || 'weekly',
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate) : undefined,
      completed: false
    });
    this.showTaskForm = false;
    this.newTask = { frequency: 'weekly' };
    this.loadData();
  }

  toggleTaskComplete(task: HouseholdTask): void {
    this.homeService.updateHouseholdTask(task.id, { completed: !task.completed });
    this.loadData();
  }

  deleteHouseholdTask(id: string): void {
    if (confirm('Supprimer cette tâche ?')) {
      this.homeService.deleteHouseholdTask(id);
      this.loadData();
    }
  }

  getUpcomingTasks(): HouseholdTask[] {
    return this.homeService.getUpcomingHouseholdTasks();
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}


