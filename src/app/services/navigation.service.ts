import { Injectable, signal } from '@angular/core';

export interface NavItem {
  label: string;
  route: string;
}

export interface BreadcrumbItem {
  label: string;
  route: string | null | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  // Current section
  private currentSectionSignal = signal<string>('dashboard');
  readonly currentSection = this.currentSectionSignal.asReadonly();
  
  // Secondary navigation items
  private secondaryNavItemsSignal = signal<NavItem[]>([]);
  readonly secondaryNavItems = this.secondaryNavItemsSignal.asReadonly();
  
  // Breadcrumbs
  private breadcrumbsSignal = signal<BreadcrumbItem[]>([
    { label: 'Home', route: '/dashboard' }
  ]);
  readonly breadcrumbs = this.breadcrumbsSignal.asReadonly();
  
  // Show/hide secondary navigation
  private showSecondaryNavSignal = signal<boolean>(false);
  readonly showSecondaryNav = this.showSecondaryNavSignal.asReadonly();
  
  constructor() {}
  
  /**
   * Set the current section and update secondary navigation
   */
  setCurrentSection(section: string): void {
    this.currentSectionSignal.set(section);
    this.updateSecondaryNav(section);
  }
  
  /**
   * Update secondary navigation based on the current section
   */
  private updateSecondaryNav(section: string): void {
    switch (section) {
      case 'budgets':
        this.secondaryNavItemsSignal.set([
          { label: 'Budget', route: '/budgets/current' },
          { label: 'Categories', route: '/budgets/categories' }
        ]);
        this.showSecondaryNavSignal.set(true);
        break;
        
      case 'transactions':
        this.secondaryNavItemsSignal.set([
          { label: 'Add New', route: '/transactions/new' },
          { label: 'All Transactions', route: '/transactions/all' },
          { label: 'Recurring', route: '/transactions/recurring' },
          { label: 'Import', route: '/transactions/import' }
        ]);
        this.showSecondaryNavSignal.set(true);
        break;
        
      case 'accounts':
        this.secondaryNavItemsSignal.set([
          { label: 'Checking', route: '/accounts/checking' },
          { label: 'Savings', route: '/accounts/savings' },
          { label: 'Transfer', route: '/accounts/transfer' },
          { label: 'Account Settings', route: '/accounts/settings' }
        ]);
        this.showSecondaryNavSignal.set(true);
        break;
        
      case 'reports':
        this.secondaryNavItemsSignal.set([
          { label: 'Monthly Overview', route: '/reports/monthly' },
          { label: 'Category Analysis', route: '/reports/categories' },
          { label: 'Spending Trends', route: '/reports/trends' },
          { label: 'Income vs Expenses', route: '/reports/income-expenses' }
        ]);
        this.showSecondaryNavSignal.set(true);
        break;
        
      default:
        this.secondaryNavItemsSignal.set([]);
        this.showSecondaryNavSignal.set(false);
        break;
    }
  }
  
  /**
   * Update breadcrumbs
   */
  updateBreadcrumbs(items: BreadcrumbItem[]): void {
    // Always include Home as the first item
    const breadcrumbs = [{ label: 'Home', route: '/dashboard' }, ...items];
    this.breadcrumbsSignal.set(breadcrumbs);
  }
  
  /**
   * Clear breadcrumbs (except Home)
   */
  clearBreadcrumbs(): void {
    this.breadcrumbsSignal.set([{ label: 'Home', route: '/dashboard' }]);
  }
}