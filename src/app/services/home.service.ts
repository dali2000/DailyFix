import { Injectable } from '@angular/core';
import { Observable, map, tap, distinctUntilChanged, switchMap } from 'rxjs';
import { ShoppingList, ShoppingItem, HouseholdTask } from '../models/home.model';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private shoppingLists: ShoppingList[] = [];
  private householdTasks: HouseholdTask[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Charger les données seulement quand l'utilisateur est authentifié
    this.authService.currentUser$.pipe(
      distinctUntilChanged()
    ).subscribe((user) => {
      if (user !== null) {
        // Utilisateur connecté - charger les données
        this.loadAll();
      } else {
        // Utilisateur déconnecté - vider les données
        this.shoppingLists = [];
        this.householdTasks = [];
      }
    });
  }

  // Shopping List methods
  getShoppingLists(): ShoppingList[] {
    return [...this.shoppingLists];
  }

  getShoppingListsObservable(): Observable<ShoppingList[]> {
    return this.apiService.get<ApiResponse<ShoppingList[]>>('/home/shopping-lists').pipe(
      map(response => response.data || []),
      map(lists => lists.map(l => {
        // S'assurer que items est un tableau
        let itemsArray: any[] = [];
        if (l.items) {
          if (Array.isArray(l.items)) {
            itemsArray = l.items;
          } else if (typeof l.items === 'string') {
            // Si c'est une chaîne JSON, la parser
            try {
              itemsArray = JSON.parse(l.items);
            } catch (e) {
              console.warn('Failed to parse items as JSON:', e);
              itemsArray = [];
            }
          } else {
            console.warn('Items is not an array or string:', l.items);
            itemsArray = [];
          }
        }
        
        return {
          ...l,
          id: l.id.toString(),
          createdAt: new Date(l.createdAt),
          items: itemsArray.map((item: any, index: number) => ({
            ...item,
            id: item.id ? item.id.toString() : `item_${l.id}_${index}_${Date.now()}`
          }))
        };
      })),
      tap(lists => this.shoppingLists = lists)
    );
  }

  getShoppingListById(id: string): ShoppingList | undefined {
    return this.shoppingLists.find(list => list.id === id);
  }

  getShoppingListByIdObservable(id: string): Observable<ShoppingList> {
    // Convertir l'ID en nombre si nécessaire pour l'API
    const listId = isNaN(Number(id)) ? id : Number(id);
    
    return this.apiService.get<ApiResponse<ShoppingList>>(`/home/shopping-lists/${listId}`).pipe(
      map(response => {
        const list = response.data!;
        
        // S'assurer que items est un tableau
        let itemsArray: any[] = [];
        if (list.items) {
          if (Array.isArray(list.items)) {
            itemsArray = list.items;
          } else if (typeof list.items === 'string') {
            // Si c'est une chaîne JSON, la parser
            try {
              itemsArray = JSON.parse(list.items);
            } catch (e) {
              console.warn('Failed to parse items as JSON:', e);
              itemsArray = [];
            }
          } else {
            console.warn('Items is not an array or string:', list.items);
            itemsArray = [];
          }
        }
        
        return {
          ...list,
          id: list.id.toString(),
          createdAt: new Date(list.createdAt),
          items: itemsArray.map((item: any, index: number) => ({
            ...item,
            id: item.id ? item.id.toString() : `item_${list.id}_${index}_${Date.now()}`
          }))
        };
      })
    );
  }

  addShoppingList(list: Omit<ShoppingList, 'id' | 'createdAt'>): Observable<ShoppingList> {
    return this.apiService.post<ApiResponse<ShoppingList>>('/home/shopping-lists', list).pipe(
      map(response => {
        const newList = response.data!;
        return {
          ...newList,
          id: newList.id.toString(),
          createdAt: new Date(newList.createdAt),
          items: (newList.items || []).map((item: any, index: number) => ({
            ...item,
            id: item.id ? item.id.toString() : `item_${newList.id}_${index}_${Date.now()}`
          }))
        };
      }),
      tap(newList => {
        this.shoppingLists.push(newList);
      })
    );
  }

  updateShoppingList(id: string, updates: Partial<ShoppingList>): Observable<ShoppingList> {
    // Convertir l'ID en nombre si nécessaire pour l'API
    const listId = isNaN(Number(id)) ? id : Number(id);
    
    console.log('Updating shopping list:', listId, updates);
    
    return this.apiService.put<ApiResponse<ShoppingList>>(`/home/shopping-lists/${listId}`, updates).pipe(
      map(response => {
        const updatedList = response.data!;
        
        // S'assurer que items est un tableau
        let itemsArray: any[] = [];
        if (updatedList.items) {
          if (Array.isArray(updatedList.items)) {
            itemsArray = updatedList.items;
          } else if (typeof updatedList.items === 'string') {
            // Si c'est une chaîne JSON, la parser
            try {
              itemsArray = JSON.parse(updatedList.items);
            } catch (e) {
              console.warn('Failed to parse items as JSON:', e);
              itemsArray = [];
            }
          } else {
            console.warn('Items is not an array or string:', updatedList.items);
            itemsArray = [];
          }
        }
        
        const transformedList = {
          ...updatedList,
          id: updatedList.id.toString(),
          createdAt: new Date(updatedList.createdAt),
          items: itemsArray.map((item: any, index: number) => ({
            ...item,
            id: item.id ? item.id.toString() : `item_${updatedList.id}_${index}_${Date.now()}`
          }))
        };
        console.log('Updated list received:', transformedList);
        return transformedList;
      }),
      tap(updatedList => {
        const index = this.shoppingLists.findIndex(list => list.id === id || list.id === updatedList.id);
        if (index !== -1) {
          this.shoppingLists[index] = updatedList;
        } else {
          // Si la liste n'est pas trouvée, l'ajouter
          this.shoppingLists.push(updatedList);
        }
      })
    );
  }

  deleteShoppingList(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/home/shopping-lists/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.shoppingLists.findIndex(list => list.id === id);
        if (index !== -1) {
          this.shoppingLists.splice(index, 1);
        }
      })
    );
  }

  // Household Task methods
  getHouseholdTasks(): HouseholdTask[] {
    return [...this.householdTasks];
  }

  getHouseholdTasksObservable(): Observable<HouseholdTask[]> {
    return this.apiService.get<ApiResponse<HouseholdTask[]>>('/home/household-tasks').pipe(
      map(response => response.data || []),
      tap(tasks => this.householdTasks = tasks.map(t => ({
        ...t,
        id: t.id.toString(),
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        lastCompleted: t.lastCompleted ? new Date(t.lastCompleted) : undefined,
        nextDueDate: t.nextDueDate ? new Date(t.nextDueDate) : undefined
      })))
    );
  }

  getHouseholdTaskById(id: string): HouseholdTask | undefined {
    return this.householdTasks.find(task => task.id === id);
  }

  getHouseholdTaskByIdObservable(id: string): Observable<HouseholdTask> {
    return this.apiService.get<ApiResponse<HouseholdTask>>(`/home/household-tasks/${id}`).pipe(
      map(response => response.data!)
    );
  }

  addHouseholdTask(task: Omit<HouseholdTask, 'id'>): Observable<HouseholdTask> {
    return this.apiService.post<ApiResponse<HouseholdTask>>('/home/household-tasks', task).pipe(
      map(response => response.data!),
      tap(newTask => {
        this.householdTasks.push({
          ...newTask,
          id: newTask.id.toString(),
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
          lastCompleted: newTask.lastCompleted ? new Date(newTask.lastCompleted) : undefined,
          nextDueDate: newTask.nextDueDate ? new Date(newTask.nextDueDate) : undefined
        });
      })
    );
  }

  updateHouseholdTask(id: string, updates: Partial<HouseholdTask>): Observable<HouseholdTask> {
    return this.apiService.put<ApiResponse<HouseholdTask>>(`/home/household-tasks/${id}`, updates).pipe(
      map(response => response.data!),
      tap(updatedTask => {
        const index = this.householdTasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.householdTasks[index] = {
            ...updatedTask,
            id: updatedTask.id.toString(),
            dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined,
            lastCompleted: updatedTask.lastCompleted ? new Date(updatedTask.lastCompleted) : undefined,
            nextDueDate: updatedTask.nextDueDate ? new Date(updatedTask.nextDueDate) : undefined
          };
        }
      })
    );
  }

  deleteHouseholdTask(id: string): Observable<boolean> {
    return this.apiService.delete<ApiResponse<any>>(`/home/household-tasks/${id}`).pipe(
      map(response => response.success),
      tap(() => {
        const index = this.householdTasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.householdTasks.splice(index, 1);
        }
      })
    );
  }

  addItemToList(listId: string, item: Omit<ShoppingItem, 'id'>): Observable<ShoppingList> {
    // Trouver la liste dans le cache local d'abord
    const list = this.shoppingLists.find(l => l.id === listId || l.id.toString() === listId.toString());
    
    if (!list) {
      // Si la liste n'est pas dans le cache, la récupérer depuis le backend
      return this.getShoppingListByIdObservable(listId).pipe(
        switchMap(list => {
          const newItem: ShoppingItem = {
            ...item,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            purchased: item.purchased || false
          };
          const updatedItems = [...(list.items || []), newItem];
          return this.updateShoppingList(listId, { items: updatedItems });
        })
      );
    }
    
    // Utiliser la liste du cache
    const newItem: ShoppingItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      purchased: item.purchased || false
    };
    const updatedItems = [...(list.items || []), newItem];
    
    console.log('Adding item to list:', {
      listId,
      currentItems: list.items,
      newItem,
      updatedItems
    });
    
    // Mettre à jour via l'API
    return this.updateShoppingList(listId, { items: updatedItems });
  }

  toggleItemPurchase(listId: string, itemId: string): Observable<ShoppingList> {
    // Trouver la liste dans le cache local d'abord
    const list = this.shoppingLists.find(l => l.id === listId);
    
    if (list) {
      // Utiliser la liste du cache
      const updatedItems = (list.items || []).map(item => 
        item.id === itemId ? { ...item, purchased: !item.purchased } : item
      );
      return this.updateShoppingList(listId, { items: updatedItems });
    } else {
      // Si la liste n'est pas dans le cache, la récupérer depuis le backend
      return this.getShoppingListByIdObservable(listId).pipe(
        map(list => {
          const updatedItems = (list.items || []).map(item => 
            item.id === itemId ? { ...item, purchased: !item.purchased } : item
          );
          return { ...list, items: updatedItems };
        }),
        switchMap(updatedList => 
          this.updateShoppingList(listId, { items: updatedList.items })
        )
      );
    }
  }

  getUpcomingHouseholdTasks(): HouseholdTask[] {
    const now = new Date();
    return this.householdTasks
      .filter(task => {
        if (!task.nextDueDate) return false;
        const dueDate = task.nextDueDate instanceof Date ? task.nextDueDate : new Date(task.nextDueDate);
        return dueDate >= now;
      })
      .sort((a, b) => {
        const dateA = a.nextDueDate instanceof Date ? a.nextDueDate : (a.nextDueDate ? new Date(a.nextDueDate) : new Date(0));
        const dateB = b.nextDueDate instanceof Date ? b.nextDueDate : (b.nextDueDate ? new Date(b.nextDueDate) : new Date(0));
        return dateA.getTime() - dateB.getTime();
      });
  }

  private loadAll(): void {
    if (this.authService.isAuthenticated()) {
      this.getShoppingListsObservable().subscribe({
        error: (error) => console.error('Error loading shopping lists:', error)
      });
      this.getHouseholdTasksObservable().subscribe({
        error: (error) => console.error('Error loading household tasks:', error)
      });
    } else {
      this.shoppingLists = [];
      this.householdTasks = [];
    }
  }
}
