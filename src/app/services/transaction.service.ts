import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Transaction {
  id: number;
  amount: number;
  description?: string;  // Made optional
  transaction_date: string;
  account_type: 'checking' | 'savings';
  budget_item_id: number;
  is_active: boolean;
  created_at: string;
}

export interface TransactionCreate {
  amount: number;
  description?: string;  // Made optional
  transaction_date?: string;
  budget_item_id: number;
  account_type: 'checking' | 'savings';
}

export interface TransactionUpdate {
  amount?: number;
  description?: string;
  transaction_date?: string;
  budget_item_id?: number;
  account_type?: 'checking' | 'savings';
}

export interface TransactionSummary {
  checking: {
    total_spent: number;
    categories: Record<string, {
      budgeted: number;
      spent: number;
      remaining: number;
    }>;
  };
  savings: {
    total_spent: number;
    categories: Record<string, {
      budgeted: number;
      spent: number;
      remaining: number;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/transactions`;

  // Signals for state management
  private transactionsSignal = signal<Transaction[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedBudgetIdSignal = signal<number | null>(null);

  // Readonly signals for components
  readonly transactions = this.transactionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedBudgetId = this.selectedBudgetIdSignal.asReadonly();

  // Computed signals for derived state
  readonly checkingTransactions = computed(() =>
    this.transactions().filter(t => t.account_type === 'checking')
  );

  readonly savingsTransactions = computed(() =>
    this.transactions().filter(t => t.account_type === 'savings')
  );

  readonly checkingTotal = computed(() =>
    this.checkingTransactions().reduce((sum, t) => sum + t.amount, 0)
  );

  readonly savingsTotal = computed(() =>
    this.savingsTransactions().reduce((sum, t) => sum + t.amount, 0)
  );

  readonly totalTransactions = computed(() =>
    this.checkingTotal() + this.savingsTotal()
  );

  // Methods to update state
  setSelectedBudget(budgetId: number | null): void {
    this.selectedBudgetIdSignal.set(budgetId);
    if (budgetId) {
      this.loadTransactionsForBudget(budgetId);
    } else {
      this.transactionsSignal.set([]);
    }
  }

  async loadTransactionsForBudget(budgetId: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const transactions = await this.http.get<Transaction[]>(
        `${this.baseUrl}?budget_id=${budgetId}`
      ).toPromise();

      this.transactionsSignal.set(transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.errorSignal.set('Failed to load transactions');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadTransactionsByAccount(accountType: 'checking' | 'savings'): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const transactions = await this.http.get<Transaction[]>(
        `${this.baseUrl}?account_type=${accountType}`
      ).toPromise();

      this.transactionsSignal.set(transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.errorSignal.set('Failed to load transactions');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createTransaction(transactionData: TransactionCreate): Promise<Transaction | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const newTransaction = await this.http.post<Transaction>(
        this.baseUrl,
        transactionData
      ).toPromise();

      if (newTransaction) {
        // Add to current transactions
        this.transactionsSignal.update(transactions => 
          [...transactions, newTransaction]
        );
        return newTransaction;
      }
      return null;
    } catch (error) {
      console.error('Error creating transaction:', error);
      this.errorSignal.set('Failed to create transaction');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateTransaction(id: number, updateData: TransactionUpdate): Promise<Transaction | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const updatedTransaction = await this.http.put<Transaction>(
        `${this.baseUrl}/${id}`,
        updateData
      ).toPromise();

      if (updatedTransaction) {
        // Update in current transactions
        this.transactionsSignal.update(transactions =>
          transactions.map(t => t.id === id ? updatedTransaction : t)
        );
        return updatedTransaction;
      }
      return null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      this.errorSignal.set('Failed to update transaction');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.http.delete(`${this.baseUrl}/${id}`).toPromise();

      // Remove from current transactions
      this.transactionsSignal.update(transactions =>
        transactions.filter(t => t.id !== id)
      );
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      this.errorSignal.set('Failed to delete transaction');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async getBudgetTransactionSummary(budgetId: number): Promise<TransactionSummary | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const summary = await this.http.get<TransactionSummary>(
        `${this.baseUrl}/budget/${budgetId}/summary`
      ).toPromise();

      return summary || null;
    } catch (error) {
      console.error('Error loading transaction summary:', error);
      this.errorSignal.set('Failed to load transaction summary');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Helper methods
  clearTransactions(): void {
    this.transactionsSignal.set([]);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  // Get transactions grouped by category for display
  getTransactionsByCategory(accountType: 'checking' | 'savings') {
    return computed(() => {
      const transactions = accountType === 'checking' 
        ? this.checkingTransactions() 
        : this.savingsTransactions();
      
      const grouped: Record<string, Transaction[]> = {};
      
      transactions.forEach(transaction => {
        // Note: We'll need to include budget item and category info in the transaction response
        // For now, we'll group by budget_item_id as a placeholder
        const key = `budget_item_${transaction.budget_item_id}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(transaction);
      });
      
      return grouped;
    });
  }
}