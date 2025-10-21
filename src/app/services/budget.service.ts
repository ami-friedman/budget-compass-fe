import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

// Models
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'cash' | 'monthly' | 'savings';
  description?: string;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  type: 'income' | 'cash' | 'monthly' | 'savings';
  description?: string;
}

export interface Budget {
  id: number;
  month: number;
  year: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface BudgetCreate {
  month: number;
  year: number;
  name: string;
  description?: string;
}

export interface BudgetItem {
  id: number;
  amount: number;
  budget_id: number;
  category_id: number;
  is_active: boolean;
}

export interface BudgetItemCreate {
  amount: number;
  budget_id: number;
  category_id: number;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsAmount: number;
  cashAmount: number;
  monthlyAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://localhost:8000/api/budgets';
  private http = inject(HttpClient);
  
  // Signal state
  private budgetsSignal = signal<Budget[]>([]);
  private currentBudgetSignal = signal<Budget | null>(null);
  private categoriesSignal = signal<Category[]>([]);
  private budgetItemsSignal = signal<BudgetItem[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // Public readonly signals
  readonly budgets = this.budgetsSignal.asReadonly();
  readonly currentBudget = this.currentBudgetSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly budgetItems = this.budgetItemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  // Computed signals for budget summary
  readonly budgetSummary = computed<BudgetSummary>(() => {
    const items = this.budgetItems();
    const categories = this.categories();
    
    if (!items.length || !categories.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        savingsAmount: 0,
        cashAmount: 0,
        monthlyAmount: 0
      };
    }
    
    // Create a map of category IDs to their types for faster lookup
    const categoryTypeMap = new Map<number, string>();
    categories.forEach(category => {
      categoryTypeMap.set(category.id, category.type);
    });
    
    // Calculate totals by category type
    let totalIncome = 0;
    let savingsAmount = 0;
    let cashAmount = 0;
    let monthlyAmount = 0;
    
    items.forEach(item => {
      const categoryType = categoryTypeMap.get(item.category_id);
      
      if (categoryType === 'income') {
        totalIncome += item.amount;
      } else if (categoryType === 'savings') {
        savingsAmount += item.amount;
      } else if (categoryType === 'cash') {
        cashAmount += item.amount;
      } else if (categoryType === 'monthly') {
        monthlyAmount += item.amount;
      }
    });
    
    const totalExpenses = savingsAmount + cashAmount + monthlyAmount;
    const balance = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsAmount,
      cashAmount,
      monthlyAmount
    };
  });
  
  // Computed signals for categories by type
  readonly incomeCategories = computed(() => 
    this.categories().filter(c => c.type === 'income')
  );
  
  readonly savingsCategories = computed(() => 
    this.categories().filter(c => c.type === 'savings')
  );
  
  readonly cashCategories = computed(() => 
    this.categories().filter(c => c.type === 'cash')
  );
  
  readonly monthlyCategories = computed(() => 
    this.categories().filter(c => c.type === 'monthly')
  );
  
  // Budget methods
  loadBudgets(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.http.get<Budget[]>(this.apiUrl).pipe(
      tap(budgets => {
        this.budgetsSignal.set(budgets);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to load budgets');
        this.loadingSignal.set(false);
        console.error('Error loading budgets:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  loadCurrentBudget(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.http.get<Budget>(`${this.apiUrl}/current`).pipe(
      tap(budget => {
        this.currentBudgetSignal.set(budget);
        this.loadBudgetItems(budget.id);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        // No budgets found or other error, not critical for budget creation
        this.currentBudgetSignal.set(null);
        this.loadingSignal.set(false);
        
        // Don't set error for create budget page
        if (!window.location.pathname.includes('/budgets/create')) {
          this.errorSignal.set('Failed to load current budget');
        }
        
        console.error('Error loading current budget:', error);
        return of(null);
      })
    ).subscribe();
  }
  
  createBudget(budget: BudgetCreate): Observable<Budget> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.post<Budget>(this.apiUrl, budget).pipe(
      tap(newBudget => {
        // Update the budgets list
        this.budgetsSignal.update(budgets => [...budgets, newBudget]);
        // Set as current budget
        this.currentBudgetSignal.set(newBudget);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to create budget');
        this.loadingSignal.set(false);
        console.error('Error creating budget:', error);
        throw error;
      })
    );
  }
  
  // Category methods
  loadCategories(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      tap(categories => {
        this.categoriesSignal.set(categories);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to load categories');
        this.loadingSignal.set(false);
        console.error('Error loading categories:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  createCategory(category: CategoryCreate): Observable<Category> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.post<Category>(`${this.apiUrl}/categories`, category).pipe(
      tap(newCategory => {
        // Update the categories list
        this.categoriesSignal.update(categories => [...categories, newCategory]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to create category');
        this.loadingSignal.set(false);
        console.error('Error creating category:', error);
        throw error;
      })
    );
  }
  
  // Budget Item methods
  loadBudgetItems(budgetId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.http.get<BudgetItem[]>(`${this.apiUrl}/items/${budgetId}`).pipe(
      tap(items => {
        this.budgetItemsSignal.set(items);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to load budget items');
        this.loadingSignal.set(false);
        console.error('Error loading budget items:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  createBudgetItem(item: BudgetItemCreate): Observable<BudgetItem> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.post<BudgetItem>(`${this.apiUrl}/items`, item).pipe(
      tap(newItem => {
        // Update the budget items list
        this.budgetItemsSignal.update(items => {
          // Check if this item already exists (same category in the budget)
          const existingIndex = items.findIndex(i => 
            i.budget_id === newItem.budget_id && i.category_id === newItem.category_id
          );
          
          if (existingIndex >= 0) {
            // Replace the existing item
            const updatedItems = [...items];
            updatedItems[existingIndex] = newItem;
            return updatedItems;
          } else {
            // Add as a new item
            return [...items, newItem];
          }
        });
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to create budget item');
        this.loadingSignal.set(false);
        console.error('Error creating budget item:', error);
        throw error;
      })
    );
  }
  
  // Helper methods
  getMonthName(month: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || '';
  }
  
  getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return {
      month: now.getMonth() + 1, // JavaScript months are 0-indexed
      year: now.getFullYear()
    };
  }
  
  // Initialize data
  initialize(): void {
    this.loadCategories();
    this.loadBudgets();
    this.loadCurrentBudget();
  }
}