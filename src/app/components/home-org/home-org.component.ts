import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../services/home.service';
import { ShoppingList, ShoppingItem, HouseholdTask } from '../../models/home.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-home-org',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
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

  ngOnDestroy(): void {
    // Les subscriptions sont gérées dans les méthodes loadData
  }

  loadData(): void {
    // Charger toutes les données depuis l'API
    this.homeService.getShoppingListsObservable().subscribe({
      next: (lists) => {
        // Les données sont déjà transformées par le service
        this.shoppingLists = lists;
        if (this.selectedList) {
          this.selectedList = this.shoppingLists.find(l => l.id === this.selectedList!.id) || null;
        }
      },
      error: (error) => console.error('Error loading shopping lists:', error)
    });

    this.homeService.getHouseholdTasksObservable().subscribe({
      next: (tasks) => {
        // Les données sont déjà transformées par le service
        this.householdTasks = tasks;
      },
      error: (error) => console.error('Error loading household tasks:', error)
    });
  }

  closeShoppingModal(): void {
    this.showShoppingForm = false;
    this.newListName = '';
  }

  closeTaskModal(): void {
    this.showTaskForm = false;
    this.newTask = { frequency: 'weekly' };
  }

  // Shopping List methods
  createShoppingList(): void {
    if (!this.newListName.trim()) return;
    this.homeService.addShoppingList({
      name: this.newListName,
      items: [],
      completed: false
    }).subscribe({
      next: (list) => {
        // Les données sont déjà transformées par le service
        this.selectedList = list;
        this.newListName = '';
        this.showShoppingForm = false;
        this.loadData();
      },
      error: (error) => {
        console.error('Error creating shopping list:', error);
        alert('Erreur lors de la création de la liste');
      }
    });
  }

  selectList(list: ShoppingList): void {
    // S'assurer que les items sont toujours un tableau
    this.selectedList = {
      ...list,
      items: list.items || []
    };
  }

  addItemToList(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.selectedList || !this.newItem.name) {
      console.warn('Cannot add item: selectedList or item name missing', {
        selectedList: this.selectedList,
        itemName: this.newItem.name
      });
      return;
    }
    
    console.log('Adding item to list:', this.selectedList.id, this.newItem);
    
    this.homeService.addItemToList(this.selectedList.id, {
      name: this.newItem.name!.trim(),
      quantity: this.newItem.quantity,
      category: this.newItem.category,
      purchased: false,
      priority: this.newItem.priority || 'medium'
    }).subscribe({
      next: (updatedList) => {
        console.log('Item added successfully, updated list:', updatedList);
        // Les données sont déjà transformées par le service
        this.selectedList = updatedList;
        this.newItem = {};
        // Recharger pour mettre à jour la liste dans la sidebar
        this.loadData();
      },
      error: (error) => {
        console.error('Error adding item to list:', error);
        alert('Erreur lors de l\'ajout de l\'article: ' + (error.message || 'Erreur inconnue'));
      }
    });
  }

  toggleItemPurchase(listId: string, itemId: string): void {
    this.homeService.toggleItemPurchase(listId, itemId).subscribe({
      next: (updatedList) => {
        // Les données sont déjà transformées par le service
        if (this.selectedList && this.selectedList.id === listId) {
          this.selectedList = updatedList;
        }
        // Recharger pour mettre à jour la liste dans la sidebar
        this.loadData();
      },
      error: (error) => {
        console.error('Error toggling item purchase:', error);
        alert('Erreur lors de la mise à jour de l\'article');
      }
    });
  }

  deleteShoppingList(id: string): void {
    if (confirm('Supprimer cette liste ?')) {
      this.homeService.deleteShoppingList(id).subscribe({
        next: () => {
          if (this.selectedList?.id === id) {
            this.selectedList = null;
          }
          this.loadData();
        }
      });
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
    }).subscribe({
      next: () => {
        this.showTaskForm = false;
        this.newTask = { frequency: 'weekly' };
        this.loadData();
      }
    });
  }

  toggleTaskComplete(task: HouseholdTask): void {
    this.homeService.updateHouseholdTask(task.id, { completed: !task.completed }).subscribe({
      next: () => {
        this.loadData();
      }
    });
  }

  deleteHouseholdTask(id: string): void {
    if (confirm('Supprimer cette tâche ?')) {
      this.homeService.deleteHouseholdTask(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  getUpcomingTasks(): HouseholdTask[] {
    return this.homeService.getUpcomingHouseholdTasks();
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'fruits': 'Fruits & Légumes',
      'dairy': 'Produits laitiers',
      'meat': 'Viande & Poisson',
      'bakery': 'Boulangerie',
      'beverages': 'Boissons',
      'other': 'Autre'
    };
    return labels[category] || category;
  }
}


