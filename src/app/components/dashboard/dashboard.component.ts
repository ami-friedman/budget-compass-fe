import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { BudgetService, MonthsEndSummary } from '../../services/budget.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Expose Math for template
  Math = Math;

  // Signals for state management
  private selectedMonthSignal = signal<number>(new Date().getMonth() + 1);
  private selectedYearSignal = signal<number>(new Date().getFullYear());
  private summarySignal = signal<MonthsEndSummary | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly selectedMonth = this.selectedMonthSignal.asReadonly();
  readonly selectedYear = this.selectedYearSignal.asReadonly();
  readonly summary = this.summarySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly selectedMonthName = computed(() => 
    this.budgetService.getMonthName(this.selectedMonth())
  );

  readonly hasData = computed(() => 
    this.summary() !== null && this.summary()!.has_budget
  );

  // Month and year options
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years: number[] = [];

  ngOnInit(): void {
    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    // Load initial summary
    this.loadSummary();
  }

  onMonthChange(month: number): void {
    this.selectedMonthSignal.set(month);
    this.loadSummary();
  }

  onYearChange(year: number): void {
    this.selectedYearSignal.set(year);
    this.loadSummary();
  }

  loadSummary(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.budgetService.getMonthsEndSummary(
      this.selectedMonth(),
      this.selectedYear()
    ).subscribe({
      next: (summary) => {
        this.summarySignal.set(summary);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set('Failed to load month summary');
        this.loadingSignal.set(false);
        console.error('Error loading summary:', error);
      }
    });
  }

  getVarianceClass(variance: number, isExpense: boolean = false): string {
    // For income: positive variance is good (green), negative is bad (red)
    // For expenses: negative variance is good (green), positive is bad (red)
    if (isExpense) {
      return variance <= 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return variance >= 0 ? 'text-green-600' : 'text-red-600';
    }
  }

  getVarianceIcon(variance: number, isExpense: boolean = false): string {
    if (isExpense) {
      return variance <= 0 ? '✓' : '⚠';
    } else {
      return variance >= 0 ? '✓' : '⚠';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercentage(percentage: number): string {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
