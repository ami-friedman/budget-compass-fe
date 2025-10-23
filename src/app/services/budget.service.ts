import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// Models
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
  category_type: 'income' | 'monthly' | 'savings' | 'cash';
  budget_id: number;
  category_id: number;
  is_active: boolean;
}

export interface BudgetItemCreate {
  amount: number;
  category_type: 'income' | 'monthly' | 'savings' | 'cash';
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

// Month's End Summary Models
export interface CategorySummary {
  budgeted: number;
  actual: number;
  variance: number;
  variance_percentage: number;
}

export interface ExpenseBreakdown {
  cash: CategorySummary;
  monthly: CategorySummary;
  savings: CategorySummary;
}

export interface ExpensesSummary {
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  breakdown: ExpenseBreakdown;
}

export interface NetPosition {
  budgeted: number;
  actual: number;
  variance: number;
}

export interface MonthsEndSummary {
  budget_id: number | null;
  month: number;
  year: number;
  budget_name: string | null;
  has_budget: boolean;
  income: CategorySummary;
  expenses: ExpensesSummary;
  net_position: NetPosition;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;
  private http = inject(HttpClient);
  
  // Signal state
  private budgetsSignal = signal<Budget[]>([]);
  private currentBudgetSignal = signal<Budget | null>(null);
  private budgetItemsSignal = signal<BudgetItem[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // Public readonly signals
  readonly budgets = this.budgetsSignal.asReadonly();
  readonly currentBudget = this.currentBudgetSignal.asReadonly();
  readonly budgetItems = this.budgetItemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  // TODO: Re-implement budget summary with new structure
  
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
  
  // Budget Item methods
  loadBudgetItems(budgetId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    this.http.get<BudgetItem[]>(`${this.apiUrl}/${budgetId}/items`).pipe(
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
    
    const budgetId = this.currentBudget()?.id;
    if (!budgetId) {
      this.errorSignal.set('No current budget selected');
      return of(); // Should not happen if UI is correct
    }
    return this.http.post<BudgetItem>(`${this.apiUrl}/${budgetId}/items`, item).pipe(
      tap(newItem => {
        // Update the budget items list
        this.budgetItemsSignal.update(items => {
          // Check if this item already exists (same category and category type in the budget)
          const existingIndex = items.findIndex(i =>
            i.budget_id === newItem.budget_id &&
            i.category_id === newItem.category_id &&
            i.category_type === newItem.category_type
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
  
  removeBudgetItem(itemId: number): void {
    this.budgetItemsSignal.update(items => items.filter(item => item.id !== itemId));
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
  
  // Month's End Summary
  getMonthsEndSummary(month: number, year: number): Observable<MonthsEndSummary> {
    return this.http.get<MonthsEndSummary>(
      `${this.apiUrl}/months-end-summary`,
      { params: { month: month.toString(), year: year.toString() } }
    );
  }
  
  // Initialize data
  initialize(): void {
    this.loadBudgets();
    this.loadCurrentBudget();
  }
}