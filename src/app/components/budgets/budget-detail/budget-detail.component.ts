import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { BudgetService, Budget, BudgetItem, Category } from '../../../services/budget.service';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './budget-detail.component.html',
  styleUrls: ['./budget-detail.component.scss']
})
export class BudgetDetailComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private navigationService = inject(NavigationService);
  
  // Signals from the budget service
  loading = this.budgetService.loading;
  error = this.budgetService.error;
  categories = this.budgetService.categories;
  budgetItems = this.budgetService.budgetItems;
  budgetSummary = this.budgetService.budgetSummary;
  
  // Category groups
  incomeCategories = this.budgetService.incomeCategories;
  savingsCategories = this.budgetService.savingsCategories;
  cashCategories = this.budgetService.cashCategories;
  monthlyCategories = this.budgetService.monthlyCategories;
  
  // Computed signals for filtered budget items
  incomeBudgetItems = computed(() =>
    this.budgetItems().filter(item => this.getCategoryType(item.category_id) === 'income')
  );
  
  savingsBudgetItems = computed(() =>
    this.budgetItems().filter(item => this.getCategoryType(item.category_id) === 'savings')
  );
  
  monthlyBudgetItems = computed(() =>
    this.budgetItems().filter(item => this.getCategoryType(item.category_id) === 'monthly')
  );
  
  cashBudgetItems = computed(() =>
    this.budgetItems().filter(item => this.getCategoryType(item.category_id) === 'cash')
  );
  
  // Component state
  budget: Budget | null = null;
  budgetItemForm!: FormGroup;
  selectedCategoryType: string = 'income';
  
  ngOnInit(): void {
    // Get the budget ID from the route
    this.route.paramMap.subscribe(params => {
      const budgetId = params.get('id');
      
      if (budgetId) {
        this.loadBudget(parseInt(budgetId, 10));
      } else {
        this.router.navigate(['/budgets']);
      }
    });
    
    // Initialize the budget item form
    this.initBudgetItemForm();
    
    // Load categories if not already loaded
    if (this.categories().length === 0) {
      this.budgetService.loadCategories();
    }
  }
  
  loadBudget(budgetId: number): void {
    // Call the API to get the budget details
    this.http.get<Budget>(`${this.budgetService['apiUrl']}/${budgetId}`).subscribe({
      next: (budget: Budget) => {
        this.budget = budget;
        // Load budget items
        this.budgetService.loadBudgetItems(budgetId);
        // Update breadcrumbs
        this.navigationService.updateBreadcrumbs([
          { label: 'Budgets', route: '/budgets' },
          { label: budget.name, route: null }
        ]);
      },
      error: (error: any) => {
        console.error('Error loading budget:', error);
        this.router.navigate(['/budgets']);
      }
    });
  }
  
  initBudgetItemForm(): void {
    this.budgetItemForm = this.formBuilder.group({
      category_id: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]]
    });
  }
  
  onCategoryTypeChange(type: string): void {
    this.selectedCategoryType = type;
    // Reset the category selection
    this.budgetItemForm.get('category_id')?.setValue(null);
  }
  
  onSubmit(): void {
    if (this.budgetItemForm.invalid || !this.budget) {
      return;
    }
    
    const budgetItem: any = {
      ...this.budgetItemForm.value,
      budget_id: this.budget.id
    };
    
    this.budgetService.createBudgetItem(budgetItem).subscribe({
      next: () => {
        // Reset the form
        this.budgetItemForm.reset({
          category_id: null,
          amount: null
        });
      },
      error: (error) => {
        console.error('Error creating budget item:', error);
      }
    });
  }
  
  // Helper methods
  getMonthName(month: number): string {
    return this.budgetService.getMonthName(month);
  }
  
  getCategoryById(categoryId: number): Category | undefined {
    return this.categories().find(c => c.id === categoryId);
  }
  
  getCategoryName(categoryId: number): string {
    const category = this.getCategoryById(categoryId);
    return category ? category.name : 'Unknown Category';
  }
  
  getCategoryType(categoryId: number): string {
    const category = this.getCategoryById(categoryId);
    return category ? category.type : '';
  }
}