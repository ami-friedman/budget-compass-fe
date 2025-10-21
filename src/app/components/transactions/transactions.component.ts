import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TransactionService, Transaction, TransactionCreate } from '../../services/transaction.service';
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
                <select formControlName="budget_item_id" class="select select-bordered w-full focus:select-primary transition-colors duration-200">
                  <option [ngValue]="null" disabled>Select a category</option>
                  @for (option of budgetItemOptions(); track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
                <div class="label py-1">
                  <span class="label-text-alt text-xs text-base-content/60">Choose the budget category for this transaction</span>
                </div>
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
                    ? 'border-primary text-primary py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap'
                    : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-300 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200'"
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
                      <td>{{ getCategoryNameForTransaction(transaction.budget_item_id) }}</td>
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
    
    if (!budget || !budgetItems.length || !categories.length) return [];
    
    // Create options from budget items with category names
    return budgetItems.map(item => {
      const category = categories.find(cat => cat.id === item.category_id);
      return {
        label: category ? `${category.name} (${item.category_type})` : `Category ${item.category_id}`,
        value: item.id,
        categoryType: item.category_type
      };
    });
  });


  transactionForm: FormGroup = this.fb.group({
    description: [''],  // Made optional
    amount: [0, [Validators.required, Validators.min(0.01)]],
    budget_item_id: [null, Validators.required]
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
  }

  onTabChange(event: any): void {
    this.activeTabIndex.set(event.index);
    // Reset form when switching tabs (unless editing)
    if (!this.isEditing()) {
      this.transactionForm.reset({
        description: '',
        amount: 0,
        budget_item_id: null
      });
    }
  }

  getAccountTransactions() {
    const accountType = this.activeAccountType();
    const transactions = accountType === 'checking'
      ? this.transactionService.checkingTransactions()
      : this.transactionService.savingsTransactions();
    
    // Debug logging to help troubleshoot
    console.log(`Component getAccountTransactions() - ${accountType}:`, transactions.length, 'transactions');
    
    return transactions;
  }

  getAccountTotal() {
    const accountType = this.activeAccountType();
    return accountType === 'checking'
      ? this.transactionService.checkingTotal()
      : this.transactionService.savingsTotal();
  }

  getCategoryNameForTransaction(budgetItemId: number): string {
    const budgetItems = this.budgetService.budgetItems();
    const categories = this.categoryService.categories();
    
    const budgetItem = budgetItems.find(item => item.id === budgetItemId);
    if (!budgetItem) return `Budget Item #${budgetItemId}`;
    
    const category = categories.find(cat => cat.id === budgetItem.category_id);
    return category ? category.name : `Category ${budgetItem.category_id}`;
  }

  resetForm() {
    this.isEditing.set(false);
    this.editingTransaction.set(null);
    this.transactionForm.reset({
      description: '',
      amount: 0,
      budget_item_id: null
    });
  }

  editTransaction(transaction: Transaction) {
    this.isEditing.set(true);
    this.editingTransaction.set(transaction);
    this.transactionForm.patchValue({
      description: transaction.description,
      amount: transaction.amount,
      budget_item_id: transaction.budget_item_id
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
    const transactionData: TransactionCreate = {
      description: formValue.description,
      amount: formValue.amount,
      budget_item_id: formValue.budget_item_id,
      account_type: this.activeAccountType() as 'checking' | 'savings'
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
          // The service handles the optimistic update, no need to reload.
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
}