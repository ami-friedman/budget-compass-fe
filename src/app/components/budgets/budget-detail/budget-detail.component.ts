import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { BudgetService, Budget, BudgetItem } from '../../../services/budget.service';
import { CategoryService, Category } from '../../../services/category.service';
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
  
  // Computed signals for grouping budget items
  checkingItems = computed(() =>
    this.budgetItems().filter(item => item.account_type === 'checking')
  );
  
  savingsItems = computed(() =>
    this.budgetItems().filter(item => item.account_type === 'savings')
  );
  
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
  
  initBudgetItemForm(item?: BudgetItem): void {
    this.budgetItemForm = this.formBuilder.group({
      category_id: [item?.category_id || null, Validators.required],
      amount: [item?.amount || null, [Validators.required, Validators.min(0.01)]],
      account_type: [item?.account_type || 'checking', Validators.required]
    });
    
    this.editingItemId = item?.id || null;
  }

  onSubmit(): void {
    if (this.budgetItemForm.invalid) {
      return;
    }
    
    const budgetId = this.budget?.id;
    if (!budgetId) return;
    
    if (this.editingItemId) {
      // Update existing item
      this.http.put(`${this.budgetService['apiUrl']}/${budgetId}/items/${this.editingItemId}`, this.budgetItemForm.value)
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
      this.budgetService.createBudgetItem(this.budgetItemForm.value).subscribe({
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
      amount: null,
      account_type: 'checking'
    });
    this.editingItemId = null;
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