import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Auth routes (not wrapped in main layout)
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./components/verify/verify.component').then(m => m.VerifyComponent)
  },
  
  // Main application routes (wrapped in main layout)
  {
    path: '',
    loadComponent: () => import('./components/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'budgets',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/budgets/budget-detail/budget-detail.component').then(m => m.BudgetDetailComponent),
            pathMatch: 'full'
          },
          {
            path: 'categories',
            loadComponent: () => import('./components/budgets/category-management/category-management.component').then(m => m.CategoryManagementComponent)
          }
        ]
      },
      {
        path: 'transactions',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/transactions/transactions.component').then(m => m.TransactionsComponent),
            pathMatch: 'full'
          },
          {
            path: 'all',
            loadComponent: () => import('./components/transactions/transactions.component').then(m => m.TransactionsComponent)
          },
        ]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Fallback routes
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
