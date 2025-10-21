import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

import { BudgetService, BudgetCreate } from '../../../services/budget.service';

@Component({
  selector: 'app-create-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, RouterModule],
  templateUrl: './create-budget.component.html',
  styleUrls: ['./create-budget.component.scss']
})
export class CreateBudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  budgetForm!: FormGroup;
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
    
    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      let month: number;
      let year: number;
      
      if (params['month'] && params['year']) {
        month = parseInt(params['month'], 10);
        year = parseInt(params['year'], 10);
      } else {
        // Use current month and year if no query params
        const current = this.budgetService.getCurrentMonthYear();
        month = current.month;
        year = current.year;
      }
      
      // Set form values
      this.budgetForm.patchValue({
        month,
        year,
      });
    });
  }
  
  initForm(): void {
    this.budgetForm = this.formBuilder.group({
      month: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [null, [Validators.required, Validators.min(2000), Validators.max(2100)]],
    });
  }
  
  onSubmit(): void {
    if (this.budgetForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.budgetForm.controls).forEach(key => {
        const control = this.budgetForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    const budgetData: BudgetCreate = {
      ...this.budgetForm.value,
      name: `Budget for ${this.budgetService.getMonthName(this.budgetForm.value.month)} ${this.budgetForm.value.year}`
    };
    
    this.budgetService.createBudget(budgetData).subscribe({
      next: (budget) => {
        // Navigate to the budget detail page
        this.router.navigate(['/budgets', budget.id]);
      },
      error: (error) => {
        console.error('Error creating budget:', error);
        // Error is handled by the service and displayed via the error signal
      }
    });
  }
  
}