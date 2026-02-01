import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../services/home.service';
import { GeminiService, ChatMessage } from '../../services/gemini.service';
import { ToastService } from '../../services/toast.service';
import { ShoppingList, ShoppingItem, HouseholdTask } from '../../models/home.model';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { CountUpComponent } from '../shared/count-up/count-up.component';

@Component({
  selector: 'app-home-org',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe, EmptyStateComponent, ConfirmDialogComponent, CountUpComponent],
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
  errorMessage: string | null = null;

  showDeleteListConfirm = false;
  showDeleteTaskConfirm = false;
  itemToDelete: string | null = null;
  
  newListName = '';
  newItem: Partial<ShoppingItem> = {};
  newTask: Partial<HouseholdTask> = { frequency: 'weekly' };

  // Assistant IA (maison / cuisine) : bouton flottant + panneau chat comme Santé
  houseChatOpen = false;
  houseChatMessages: ChatMessage[] = [];
  houseChatInput = '';
  houseChatLoading = false;
  houseChatError: string | null = null;

  constructor(
    private homeService: HomeService,
    private geminiService: GeminiService,
    private toastService: ToastService
  ) {}

  get geminiAvailable(): boolean {
    return this.geminiService.isAvailable();
  }

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
        this.errorMessage = null;
        this.selectedList = list;
        this.newListName = '';
        this.showShoppingForm = false;
        this.loadData();
        this.toastService.success('Liste créée');
      },
      error: (error) => {
        const msg = error?.error?.message || error?.message || 'Erreur lors de la création de la liste';
        this.errorMessage = msg;
        this.toastService.error(msg);
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
        this.errorMessage = null;
        this.selectedList = updatedList;
        this.newItem = {};
        this.loadData();
        this.toastService.success('Article ajouté');
      },
      error: (error) => {
        const msg = error?.error?.message || error?.message || 'Erreur lors de l\'ajout de l\'article';
        this.errorMessage = msg;
        this.toastService.error(msg);
      }
    });
  }

  toggleItemPurchase(listId: string, itemId: string): void {
    this.homeService.toggleItemPurchase(listId, itemId).subscribe({
      next: (updatedList) => {
        this.errorMessage = null;
        if (this.selectedList && this.selectedList.id === listId) {
          this.selectedList = updatedList;
        }
        this.loadData();
      },
      error: (error) => {
        const msg = error?.error?.message || error?.message || 'Erreur lors de la mise à jour';
        this.toastService.error(msg);
      }
    });
  }

  deleteShoppingList(id: string): void {
    this.itemToDelete = id;
    this.showDeleteListConfirm = true;
  }

  confirmDeleteList(): void {
    if (!this.itemToDelete) return;
    this.homeService.deleteShoppingList(this.itemToDelete).subscribe({
      next: () => {
        if (this.selectedList?.id === this.itemToDelete) {
          this.selectedList = null;
        }
        this.loadData();
        this.toastService.success('Liste supprimée');
        this.showDeleteListConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Erreur');
        this.showDeleteListConfirm = false;
      }
    });
  }

  cancelDeleteList(): void {
    this.showDeleteListConfirm = false;
    this.itemToDelete = null;
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
        this.toastService.success('Tâche créée');
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || 'Erreur')
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
    this.itemToDelete = id;
    this.showDeleteTaskConfirm = true;
  }

  confirmDeleteTask(): void {
    if (!this.itemToDelete) return;
    this.homeService.deleteHouseholdTask(this.itemToDelete).subscribe({
      next: () => {
        this.loadData();
        this.toastService.success('Tâche supprimée');
        this.showDeleteTaskConfirm = false;
        this.itemToDelete = null;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Erreur');
        this.showDeleteTaskConfirm = false;
      }
    });
  }

  cancelDeleteTask(): void {
    this.showDeleteTaskConfirm = false;
    this.itemToDelete = null;
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

  getFrequencyLabel(freq: string): string {
    const labels: { [key: string]: string } = {
      daily: 'Quotidienne',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuelle',
      'one-time': 'Unique'
    };
    return labels[freq] || freq;
  }

  async sendHouseholdChatMessage(): Promise<void> {
    const text = (this.houseChatInput || '').trim();
    if (!text || this.houseChatLoading || !this.geminiAvailable) return;
    this.houseChatError = null;
    this.houseChatMessages.push({ role: 'user', text });
    this.houseChatInput = '';
    this.houseChatLoading = true;
    try {
      const response = await this.geminiService.sendHouseholdMessage(text, this.houseChatMessages.slice(0, -1));
      this.houseChatMessages.push({ role: 'model', text: response });
    } catch (err) {
      this.houseChatError = err instanceof Error ? err.message : 'common.error';
    } finally {
      this.houseChatLoading = false;
    }
  }
}


