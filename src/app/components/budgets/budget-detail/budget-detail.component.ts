import { Component, OnInit, effect, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { BudgetService, Budget, BudgetItem } from '../../../services/budget.service';
import { CategoryService, Category } from '../../../services/category.service';
import { NavigationService } from '../../../services/navigation.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ButtonModule, TooltipModule],
  templateUrl: './budget-detail.component.html',
  styleUrls: ['./budget-detail.component.scss']
})
export class BudgetDetailComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private navigationService = inject(NavigationService);
  
  // Signals from the budget service
  loading = this.budgetService.loading;
  error = this.budgetService.error;
  
  // Data signals
  budgetItems = this.budgetService.budgetItems;
  categories = this.categoryService.categories;
  
  // Component state
  budget: Budget | null = null;
  budgetItemForm!: FormGroup;
  editingItemId: number | null = null;
  activeTabIndex = signal(0); // Track active tab (0: Cash, 1: Monthly, 2: Savings, 3: Income)
  searchTerm = signal(''); // Search term for filtering items
  
  // Month/Year selection signals
  selectedMonthSignal = signal<number>(new Date().getMonth() + 1);
  selectedYearSignal = signal<number>(new Date().getFullYear());
  
  readonly selectedMonth = this.selectedMonthSignal.asReadonly();
  readonly selectedYear = this.selectedYearSignal.asReadonly();
  
  // Computed signal for month name
  readonly selectedMonthName = computed(() =>
    this.budgetService.getMonthName(this.selectedMonth())
  );
  
  // Year options for dropdown (current year ± 5 years)
  readonly yearOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  });
  
  // Tab configuration
  tabs = [
    { label: 'Cash', categoryType: 'cash', color: 'text-orange-600' },
    { label: 'Monthly', categoryType: 'monthly', color: 'text-blue-600' },
    { label: 'Savings', categoryType: 'savings', color: 'text-purple-600' },
    { label: 'Income', categoryType: 'income', color: 'text-green-600' }
  ];
  
  // Current active category type based on tab
  activeCategoryType = computed(() => this.tabs[this.activeTabIndex()].categoryType);
  
  // Computed signals for grouping budget items by category type
  incomeItems = computed(() =>
    this.budgetItems().filter(item => item.category_type === 'income')
  );
  
  monthlyItems = computed(() =>
    this.budgetItems().filter(item => item.category_type === 'monthly')
  );
  
  savingsItems = computed(() =>
    this.budgetItems().filter(item => item.category_type === 'savings')
  );
  
  cashItems = computed(() =>
    this.budgetItems().filter(item => item.category_type === 'cash')
  );
  
  constructor() {
    // Reactive effect to load budget when month/year changes
    effect(() => {
      const month = this.selectedMonth();
      const year = this.selectedYear();
      this.loadBudgetForMonth(month, year);
    });
  }
  
  ngOnInit(): void {
    // Initialize the budget item form
    this.initBudgetItemForm();
  }
  
  loadBudgetForMonth(month: number, year: number): void {
    this.budgetService.getBudgetByMonth(month, year).subscribe({
      next: (budget: Budget | null) => {
        this.budget = budget;
        
        if (budget) {
          // Load budget items
          this.budgetService.loadBudgetItems(budget.id);
          // Update breadcrumbs
          this.navigationService.updateBreadcrumbs([
            { label: 'Budgets', route: '/budgets' },
            { label: `${this.selectedMonthName()} ${year}`, route: null }
          ]);
        } else {
          // No budget for this month - clear budget items
          this.budgetService['budgetItemsSignal'].set([]);
          // Update breadcrumbs
          this.navigationService.updateBreadcrumbs([
            { label: 'Budgets', route: '/budgets' },
            { label: `${this.selectedMonthName()} ${year}`, route: null }
          ]);
        }
      },
      error: (error: any) => {
        console.error('Error loading budget:', error);
        this.budget = null;
      }
    });
  }
  
  initBudgetItemForm(item?: BudgetItem): void {
    this.budgetItemForm = this.formBuilder.group({
      category_id: [item?.category_id || null, Validators.required],
      amount: [item?.amount || null, [Validators.required, Validators.min(0.01)]]
    });
    
    this.editingItemId = item?.id || null;
    
    // If editing an item, switch to the appropriate tab
    if (item) {
      const tabIndex = this.tabs.findIndex(tab => tab.categoryType === item.category_type);
      if (tabIndex !== -1) {
        this.activeTabIndex.set(tabIndex);
      }
    }
  }

  onSubmit(): void {
    if (this.budgetItemForm.invalid) {
      return;
    }
    
    const budgetId = this.budget?.id;
    if (!budgetId) return;
    
    // Add the category type based on active tab
    const formData = {
      ...this.budgetItemForm.value,
      category_type: this.activeCategoryType()
    };
    
    if (this.editingItemId) {
      // Update existing item
      this.http.patch(`${this.budgetService['apiUrl']}/${budgetId}/items/${this.editingItemId}`, formData)
        .subscribe({
          next: (updatedItem: any) => {
            // Update the local state
            this.budgetService.loadBudgetItems(budgetId);
            this.resetForm();
          },
          error: (error) => {
            console.error('Error updating budget item:', error);
          }
        });
    } else {
      // Create new item
      this.budgetService.createBudgetItem(formData).subscribe({
        next: () => {
          this.resetForm();
        },
        error: (error) => {
          console.error('Error creating budget item:', error);
        }
      });
    }
  }
  
  resetForm(): void {
    this.budgetItemForm.reset({
      category_id: null,
      amount: null
    });
    this.editingItemId = null;
  }
  
  onTabChange(event: any): void {
    this.activeTabIndex.set(event.index);
    // Reset form when switching tabs (unless editing)
    if (!this.editingItemId) {
      this.resetForm();
    }
  }
  
  getItemsForTab(categoryType: string) {
    const items = this.budgetItems().filter(item => item.category_type === categoryType);
    const search = this.searchTerm().toLowerCase();
    
    if (!search) {
      return items;
    }
    
    return items.filter(item => {
      const categoryName = this.getCategoryName(item.category_id).toLowerCase();
      return categoryName.includes(search) || item.amount.toString().includes(search);
    });
  }
  
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }
  
  editBudgetItem(item: BudgetItem): void {
    this.initBudgetItemForm(item);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  deleteBudgetItem(itemId: number): void {
    if (confirm('Are you sure you want to delete this budget item?')) {
      const budgetId = this.budget?.id;
      if (!budgetId) return;
      
      this.http.delete(`${this.budgetService['apiUrl']}/${budgetId}/items/${itemId}`).subscribe({
        next: () => {
          // Update the local state
          this.budgetService.removeBudgetItem(itemId);
        },
        error: (error) => {
          console.error('Error deleting budget item:', error);
        }
      });
    }
  }
  
}