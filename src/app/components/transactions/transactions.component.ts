import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TransactionService, Transaction, TransactionCreate, SavingsCategoryBalance } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';

interface BudgetItemOption {
  label: string;
  value: number;
  categoryType: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="container mx-auto p-4">
      @if (selectedBudget()) {
        <div class="mb-6">
          <h2 class="text-3xl font-bold">{{ selectedBudget()!.name }} - Transactions</h2>
        </div>

        <!-- Add Transaction Form -->
        <div class="mb-8 p-6 border border-base-300 rounded-xl shadow-lg bg-base-100 hover:shadow-xl transition-shadow duration-200">
          <div class="mb-6 pb-4 border-b border-base-300">
            <h3 class="text-2xl font-bold text-base-content flex items-center gap-2">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              @if (isEditing()) {
                Edit Transaction
              } @else {
                Add New Transaction
              }
            </h3>
            <p class="text-sm text-base-content/70 mt-2 leading-relaxed">
              @if (isEditing()) {
                Update the details for this transaction
              } @else {
                Create a new transaction for {{ tabs[activeTabIndex()].label.toLowerCase() }}
              }
            </p>
          </div>
          
          <form [formGroup]="transactionForm" (ngSubmit)="saveTransaction()">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Description Input -->
              <div class="form-control space-y-2">
                <label class="label pb-1">
                  <span class="label-text font-semibold text-base text-base-content flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Description
                  </span>
                </label>
                <input
                  type="text"
                  formControlName="description"
                  placeholder="Enter transaction description (optional)"
                  class="input input-bordered w-full focus:input-primary transition-colors duration-200" />
                <div class="label py-1">
                  <span class="label-text-alt text-xs text-base-content/60">Describe what this transaction is for (optional)</span>
                </div>
              </div>

              <!-- Amount Input -->
              <div class="form-control space-y-2">
                <label class="label pb-1">
                  <span class="label-text font-semibold text-base text-base-content flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    Amount
                  </span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/70 font-medium pointer-events-none z-10">₪</span>
                  <input
                    type="number"
                    formControlName="amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    class="input input-bordered w-full pl-8 focus:input-primary transition-colors duration-200" />
                </div>
                <div class="label py-1">
                  <span class="label-text-alt text-xs text-base-content/60">Enter the transaction amount</span>
                </div>
              </div>

              <!-- Category Dropdown -->
              <div class="form-control space-y-2">
                <label class="label pb-1">
                  <span class="label-text font-semibold text-base text-base-content flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    Category
                  </span>
                </label>
                @if (activeAccountType() === 'checking') {
                  <select formControlName="budget_item_id" class="select select-bordered w-full focus:select-primary transition-colors duration-200 cursor-pointer">
                    <option [ngValue]="null" disabled>Select a budget category</option>
                    @for (option of budgetItemOptions(); track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                } @else {
                  <select formControlName="category_id" class="select select-bordered w-full focus:select-primary transition-colors duration-200 cursor-pointer">
                    @if (budgetItemOptions().length === 0) {
                      <option [ngValue]="null" disabled>No funded savings categories yet</option>
                    } @else {
                      <option [ngValue]="null" disabled>Select a savings category</option>
                      @for (option of budgetItemOptions(); track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    }
                  </select>
                }
                <div class="label py-1">
                  @if (activeAccountType() === 'savings' && budgetItemOptions().length === 0) {
                    <span class="label-text-alt text-xs text-warning">
                      <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Fund a savings category from the Checking Account tab first
                    </span>
                  } @else {
                    <span class="label-text-alt text-xs text-base-content/60">Choose the budget category for this transaction</span>
                  }
                </div>
                
                <!-- Display available balance for savings transactions -->
                @if (activeAccountType() === 'savings' && selectedCategoryBalance()) {
                  <div class="mt-2 p-3 rounded-lg" [ngClass]="selectedCategoryBalance()!.available_balance > 0 ? 'bg-success/10 border border-success/30' : 'bg-warning/10 border border-warning/30'">
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-4 h-4" [ngClass]="selectedCategoryBalance()!.available_balance > 0 ? 'text-success' : 'text-warning'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span class="font-semibold text-sm" [ngClass]="selectedCategoryBalance()!.available_balance > 0 ? 'text-success' : 'text-warning'">
                        Available Balance
                      </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span class="text-base-content/60">Funded:</span>
                        <span class="ml-1 font-medium">{{ selectedCategoryBalance()!.funded_amount | currency:'ILS':'symbol-narrow':'1.2-2' }}</span>
                      </div>
                      <div>
                        <span class="text-base-content/60">Spent:</span>
                        <span class="ml-1 font-medium">{{ selectedCategoryBalance()!.spent_amount | currency:'ILS':'symbol-narrow':'1.2-2' }}</span>
                      </div>
                      <div>
                        <span class="text-base-content/60">Available:</span>
                        <span class="ml-1 font-bold" [ngClass]="selectedCategoryBalance()!.available_balance > 0 ? 'text-success' : 'text-warning'">
                          {{ selectedCategoryBalance()!.available_balance | currency:'ILS':'symbol-narrow':'1.2-2' }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Account Display (Read-only) -->
              <div class="form-control space-y-2">
                <label class="label pb-1">
                  <span class="label-text font-semibold text-base text-base-content flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    Account
                  </span>
                </label>
                <div class="input input-bordered w-full bg-base-200 text-base-content/70 cursor-not-allowed">
                  {{ tabs[activeTabIndex()].label }}
                </div>
                <div class="label py-1">
                  <span class="label-text-alt text-xs text-base-content/60">Transaction will be added to {{ tabs[activeTabIndex()].label.toLowerCase() }}</span>
                </div>
              </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-base-300 flex flex-col sm:flex-row gap-3">
              <p-button
                type="submit"
                [label]="isEditing() ? 'Update Transaction' : 'Add Transaction'"
                [disabled]="transactionForm.invalid || transactionService.loading()">
              </p-button>
              @if (isEditing()) {
                <p-button
                  type="button"
                  label="Cancel"
                  styleClass="p-button-ghost"
                  (click)="resetForm()">
                </p-button>
              }
            </div>
          </form>
        </div>

        <!-- Custom Tabbed Transactions -->
        <div class="bg-base-100 rounded-xl shadow-lg">
          <!-- Tab Headers -->
          <div class="border-b border-base-300">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              @for (tab of tabs; track tab.accountType; let i = $index) {
                <button
                  (click)="onTabChange({index: i})"
                  [class]="activeTabIndex() === i
                    ? 'border-primary text-primary py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer'
                    : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-300 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 cursor-pointer'"
                  [attr.aria-current]="activeTabIndex() === i ? 'page' : null">
                  {{ tab.label }}
                </button>
              }
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Summary Card -->
            <div class="mb-6 p-4 rounded-lg" [ngClass]="tabs[activeTabIndex()].summaryClass">
              <h3 class="text-lg font-semibold mb-2" [ngClass]="tabs[activeTabIndex()].textClass">
                {{ tabs[activeTabIndex()].label }} Summary
              </h3>
              <p [ngClass]="tabs[activeTabIndex()].textClass">
                Total: {{ getAccountTotal() | currency:'ILS':'symbol-narrow':'1.2-2' }}
              </p>
              <p [ngClass]="tabs[activeTabIndex()].textClass">
                Transactions: {{ getAccountTransactions().length }}
              </p>
              
              <!-- Savings Account Balances Summary -->
              @if (activeAccountType() === 'savings' && transactionService.savingsBalances().length > 0) {
                <div class="mt-4 pt-4 border-t border-green-200">
                  <h4 class="text-sm font-semibold mb-2 text-green-900">Category Balances</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    @for (balance of transactionService.savingsBalances(); track balance.category_id) {
                      <div class="text-xs p-2 bg-white rounded border border-green-200">
                        <div class="font-medium text-green-900 mb-1">{{ balance.category_name }}</div>
                        <div class="flex justify-between">
                          <span class="text-green-700">Available:</span>
                          <span class="font-semibold" [ngClass]="balance.available_balance > 0 ? 'text-success' : 'text-warning'">
                            {{ balance.available_balance | currency:'ILS':'symbol-narrow':'1.2-2' }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="mt-3 pt-3 border-t border-green-200 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span class="text-green-700">Total Funded:</span>
                      <div class="font-semibold text-green-900">
                        {{ transactionService.totalFundedAmount() | currency:'ILS':'symbol-narrow':'1.2-2' }}
                      </div>
                    </div>
                    <div>
                      <span class="text-green-700">Total Spent:</span>
                      <div class="font-semibold text-green-900">
                        {{ transactionService.totalSpentFromSavings() | currency:'ILS':'symbol-narrow':'1.2-2' }}
                      </div>
                    </div>
                    <div>
                      <span class="text-green-700">Total Available:</span>
                      <div class="font-bold text-success">
                        {{ transactionService.totalAvailableSavings() | currency:'ILS':'symbol-narrow':'1.2-2' }}
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
            
            <div class="overflow-x-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th class="text-left">Date</th>
                    <th class="text-left">Description</th>
                    <th class="text-left">Category</th>
                    <th class="text-right">Amount</th>
                    <th class="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (transaction of getAccountTransactions(); track transaction.id) {
                    <tr>
                      <td>{{ transaction.transaction_date | date:'short' }}</td>
                      <td>{{ transaction.description || 'No description' }}</td>
                      <td>{{ getCategoryNameForTransaction(transaction) }}</td>
                      <td class="text-right" [ngClass]="tabs[activeTabIndex()].color">
                        {{ transaction.amount | currency:'ILS':'symbol-narrow':'1.2-2' }}
                      </td>
                      <td class="text-right">
                        <p-button
                          (click)="editTransaction(transaction)"
                          styleClass="p-button-sm p-button-ghost mr-1"
                          pTooltip="Edit transaction"
                          tooltipPosition="top">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </p-button>
                        <p-button
                          (click)="confirmDelete(transaction)"
                          styleClass="p-button-sm p-button-danger"
                          pTooltip="Delete transaction"
                          tooltipPosition="top">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </p-button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-8">
                        <div class="flex flex-col items-center gap-2">
                          <svg class="w-12 h-12 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <p class="text-base-content/60">No {{ tabs[activeTabIndex()].label.toLowerCase() }} transactions yet.</p>
                          <p class="text-sm text-base-content/40">Add your first {{ tabs[activeTabIndex()].label.toLowerCase() }} transaction using the form above.</p>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

      } @else if (transactionService.loading()) {
        <div class="text-center p-8">
          <span class="loading loading-lg loading-spinner"></span>
        </div>
      } @else {
        <div class="text-center p-8">
          <p>Please select a budget to view transactions.</p>
        </div>
      }

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: 1.5rem;
    }

    :host ::ng-deep .p-tabview .p-tabview-panels {
      padding: 1rem 0;
    }

    :host ::ng-deep .p-table .p-table-tbody > tr > td {
      padding: 0.75rem;
    }

    :host ::ng-deep .p-button.p-button-sm {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class TransactionsComponent {
  transactionService = inject(TransactionService);
  budgetService = inject(BudgetService);
  categoryService = inject(CategoryService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  fb = inject(FormBuilder);

  isEditing = signal(false);
  editingTransaction = signal<Transaction | null>(null);
  selectedCategoryBalance = signal<SavingsCategoryBalance | null>(null);

  selectedBudget = computed(() => this.budgetService.currentBudget());
  activeTabIndex = signal(0); // Track active tab (0: Checking, 1: Savings)

  // Tab configuration
  tabs = [
    {
      label: 'Checking Account',
      accountType: 'checking',
      color: 'text-blue-600',
      summaryClass: 'bg-blue-50',
      textClass: 'text-blue-900'
    },
    {
      label: 'Savings Account',
      accountType: 'savings',
      color: 'text-green-600',
      summaryClass: 'bg-green-50',
      textClass: 'text-green-900'
    }
  ];

  // Current active account type based on tab
  activeAccountType = computed(() => this.tabs[this.activeTabIndex()].accountType);
  

  budgetItemOptions = computed(() => {
    const budget = this.selectedBudget();
    const budgetItems = this.budgetService.budgetItems();
    const categories = this.categoryService.categories();
    const activeAccountType = this.activeAccountType();
    
    if (!categories.length) return [];
    
    if (activeAccountType === 'checking') {
      // For checking account: show budget items from current month (all category types)
      if (!budget || !budgetItems.length) return [];
      
      return budgetItems.map(item => {
        const category = categories.find(cat => cat.id === item.category_id);
        return {
          label: category ? `${category.name} (${item.category_type})` : `Category ${item.category_id}`,
          value: item.id,
          categoryType: item.category_type
        };
      });
    } else {
      // For savings account: show only categories that have been funded (have a balance)
      const savingsBalances = this.transactionService.savingsBalances();
      
      // Only show categories that have been funded at some point
      return savingsBalances.map(balance => ({
        label: balance.category_name,
        value: balance.category_id,
        categoryType: 'savings'
      }));
    }
  });


  transactionForm: FormGroup = this.fb.group({
    description: [''],  // Made optional
    amount: [0, [Validators.required, Validators.min(0.01)]],
    budget_item_id: [null],  // Will be required conditionally
    category_id: [null]      // Will be required conditionally
  });

  constructor() {
    // Ensure budget service is initialized (fallback in case APP_INITIALIZER didn't run)
    if (!this.selectedBudget()) {
      this.budgetService.initialize();
    }

    // Reactive effect to load transactions when the selected budget changes
    effect(() => {
      const budget = this.selectedBudget();
      
      if (budget) {
        // Always load ALL transactions for the budget (both checking and savings)
        // The UI will filter them appropriately based on the active tab
        this.transactionService.setSelectedBudget(budget.id);
      } else {
        // If there's no budget, clear the transactions
        this.transactionService.clearTransactions();
      }
    });

    // Ensure categories are loaded for the dropdown
    this.categoryService.loadCategories().subscribe();

    // Load savings balances
    this.transactionService.loadSavingsBalances();

    // Watch for category selection changes to update balance display
    effect(() => {
      const categoryId = this.transactionForm.get('category_id')?.value;
      if (categoryId && this.activeAccountType() === 'savings') {
        this.updateSelectedCategoryBalance(categoryId);
      } else {
        this.selectedCategoryBalance.set(null);
      }
    });
  }

  async updateSelectedCategoryBalance(categoryId: number): Promise<void> {
    const balance = await this.transactionService.getCategoryBalance(categoryId);
    this.selectedCategoryBalance.set(balance);
  }

  onTabChange(event: any): void {
    this.activeTabIndex.set(event.index);
    
    // Reload savings balances when switching to savings tab
    if (this.tabs[event.index].accountType === 'savings') {
      this.transactionService.loadSavingsBalances();
    }
    
    // Reset form when switching tabs (unless editing)
    if (!this.isEditing()) {
      this.transactionForm.reset({
        description: '',
        amount: 0,
        budget_item_id: null,
        category_id: null
      });
    }
  }

  getAccountTransactions() {
    const accountType = this.activeAccountType();
    return accountType === 'checking'
      ? this.transactionService.checkingTransactions()
      : this.transactionService.savingsTransactions();
  }

  getAccountTotal() {
    const accountType = this.activeAccountType();
    return accountType === 'checking'
      ? this.transactionService.checkingTotal()
      : this.transactionService.savingsTotal();
  }

  getCategoryNameForTransaction(transaction: any): string {
    const categories = this.categoryService.categories();
    
    if (transaction.account_type === 'checking' && transaction.budget_item_id) {
      // For checking transactions, get category through budget item
      const budgetItems = this.budgetService.budgetItems();
      const budgetItem = budgetItems.find(item => item.id === transaction.budget_item_id);
      if (!budgetItem) return `Budget Item #${transaction.budget_item_id}`;
      
      const category = categories.find(cat => cat.id === budgetItem.category_id);
      return category ? category.name : `Category ${budgetItem.category_id}`;
    } else if (transaction.account_type === 'savings' && transaction.category_id) {
      // For savings transactions, get category directly
      const category = categories.find(cat => cat.id === transaction.category_id);
      return category ? category.name : `Category #${transaction.category_id}`;
    }
    
    return 'Unknown Category';
  }

  resetForm() {
    this.isEditing.set(false);
    this.editingTransaction.set(null);
    this.transactionForm.reset({
      description: '',
      amount: 0,
      budget_item_id: null,
      category_id: null
    });
  }

  editTransaction(transaction: Transaction) {
    this.isEditing.set(true);
    this.editingTransaction.set(transaction);
    this.transactionForm.patchValue({
      description: transaction.description,
      amount: transaction.amount,
      budget_item_id: transaction.budget_item_id || null,
      category_id: transaction.category_id || null
    });
    
    // Switch to the appropriate tab based on transaction's account type
    const tabIndex = this.tabs.findIndex(tab => tab.accountType === transaction.account_type);
    if (tabIndex !== -1) {
      this.activeTabIndex.set(tabIndex);
    }
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  async saveTransaction() {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const formValue = this.transactionForm.value;
    const accountType = this.activeAccountType() as 'checking' | 'savings';
    
    // Validate based on account type
    if (accountType === 'checking' && !formValue.budget_item_id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a budget category for checking account transactions'
      });
      return;
    }
    
    if (accountType === 'savings' && !formValue.category_id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a savings category for savings account transactions'
      });
      return;
    }

    // Validate savings balance
    if (accountType === 'savings') {
      const balance = this.selectedCategoryBalance();
      if (balance && formValue.amount > balance.available_balance) {
        this.messageService.add({
          severity: 'error',
          summary: 'Insufficient Balance',
          detail: `Available balance is ${balance.available_balance.toFixed(2)}. Cannot spend ${formValue.amount.toFixed(2)}.`
        });
        return;
      }
    }
    
    const transactionData: TransactionCreate = {
      description: formValue.description,
      amount: formValue.amount,
      budget_item_id: accountType === 'checking' ? formValue.budget_item_id : undefined,
      category_id: accountType === 'savings' ? formValue.category_id : undefined,
      account_type: accountType
    };

    try {
      if (this.isEditing()) {
        const transaction = this.editingTransaction();
        if (transaction) {
          await this.transactionService.updateTransaction(transaction.id, transactionData);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Transaction updated successfully'
          });
        }
      } else {
        const newTransaction = await this.transactionService.createTransaction(transactionData);
        if (newTransaction) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Transaction created successfully'
          });
          // Reload savings balances after creating a transaction
          if (accountType === 'savings' ||
              (accountType === 'checking' && this.isSavingsBudgetItem(formValue.budget_item_id))) {
            await this.transactionService.loadSavingsBalances();
          }
        }
      }
      this.resetForm();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save transaction'
      });
    }
  }

  confirmDelete(transaction: Transaction) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the transaction "${transaction.description}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteTransaction(transaction)
    });
  }

  async deleteTransaction(transaction: Transaction) {
    const success = await this.transactionService.deleteTransaction(transaction.id);
    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Transaction deleted successfully'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete transaction'
      });
    }
  }

  // Helper to check if a budget item is a savings type
  isSavingsBudgetItem(budgetItemId: number | null): boolean {
    if (!budgetItemId) return false;
    const budgetItems = this.budgetService.budgetItems();
    const item = budgetItems.find(bi => bi.id === budgetItemId);
    return item?.category_type === 'savings';
  }
}