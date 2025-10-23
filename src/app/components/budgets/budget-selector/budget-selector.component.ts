import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { BudgetService, BudgetCreate } from '../../../services/budget.service';

@Component({
  selector: 'app-budget-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule],
  template: `
    <div class="p-4 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">Select Budget</h2>
      
      <form [formGroup]="selectorForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label for="month" class="block text-sm font-medium mb-1">Month</label>
            <select 
              id="month" 
              formControlName="month" 
              class="w-full p-2 border rounded-md cursor-pointer"
              (change)="checkBudgetExists()">
              @for (month of months; track month.value) {
                <option [value]="month.value">{{ month.name }}</option>
              }
            </select>
          </div>
          
          <div class="form-group">
            <label for="year" class="block text-sm font-medium mb-1">Year</label>
            <select 
              id="year" 
              formControlName="year" 
              class="w-full p-2 border rounded-md cursor-pointer"
              (change)="checkBudgetExists()">
              @for (year of years; track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-4">
          <p-button
            type="submit"
            [label]="budgetExists ? 'View Budget' : 'Create New Budget'"
            [disabled]="loading()"
            [loading]="loading()"
          ></p-button>
        </div>
      </form>
      
      @if (error()) {
        <div class="mt-4 p-2 bg-red-100 text-red-700 rounded-md">
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BudgetSelectorComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  
  selectorForm!: FormGroup;
  budgetExists = false;
  
  // Signals from the budget service
  budgets = this.budgetService.budgets;
  loading = this.budgetService.loading;
  error = this.budgetService.error;
  
  // Month options for the dropdown
  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];
  
  // Generate year options (current year and next 5 years)
  years: number[] = [];
  
  ngOnInit(): void {
    // Initialize the form
    this.initForm();
    
    // Generate year options
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.years.push(currentYear + i);
    }
    
    // Set default values to current month and year
    const { month, year } = this.budgetService.getCurrentMonthYear();
    this.selectorForm.patchValue({
      month,
      year
    });
    
    // Load budgets
    this.budgetService.loadBudgets();
    
    // Check if budget exists for the selected month/year
    this.checkBudgetExists();
  }
  
  initForm(): void {
    this.selectorForm = this.formBuilder.group({
      month: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [null, [Validators.required, Validators.min(2000), Validators.max(2100)]]
    });
  }
  
  checkBudgetExists(): void {
    if (this.selectorForm.invalid) {
      return;
    }
    
    const month = this.selectorForm.get('month')?.value;
    const year = this.selectorForm.get('year')?.value;
    
    if (!month || !year) {
      return;
    }
    
    // Check if a budget exists for the selected month/year
    const existingBudget = this.budgets().find(b => b.month === month && b.year === year);
    this.budgetExists = !!existingBudget;
  }
  
  onSubmit(): void {
    if (this.selectorForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.selectorForm.controls).forEach(key => {
        const control = this.selectorForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    const month = this.selectorForm.get('month')?.value;
    const year = this.selectorForm.get('year')?.value;
    
    if (this.budgetExists) {
      // Find the budget ID and navigate to it
      const existingBudget = this.budgets().find(b => b.month === month && b.year === year);
      if (existingBudget) {
        this.router.navigate(['/budgets', existingBudget.id]);
      }
    } else {
      // Create the budget directly
      const budgetData: BudgetCreate = {
        month,
        year,
        name: `Budget for ${this.budgetService.getMonthName(month)} ${year}`
      };

      this.budgetService.createBudget(budgetData).subscribe({
        next: (budget) => {
          // Navigate to the budget detail page
          this.router.navigate(['/budgets', budget.id]);
        },
        error: (error) => {
          console.error('Error creating budget from selector:', error);
          // Error is handled by the service and displayed via the error signal
        }
      });
    }
  }
}