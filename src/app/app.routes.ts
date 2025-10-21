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
        path: 'test-navigation',
        loadComponent: () => import('./components/test/navigation-test.component').then(m => m.NavigationTestComponent)
      },
      // Placeholder routes for future implementation
      {
        path: 'budgets',
        children: [
          {
            path: '',
            loadComponent: () => import('./components/budgets/budget-selector/budget-selector.component').then(m => m.BudgetSelectorComponent),
            pathMatch: 'full'
          },
          {
            path: 'categories',
            loadComponent: () => import('./components/budgets/category-management/category-management.component').then(m => m.CategoryManagementComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./components/budgets/budget-detail/budget-detail.component').then(m => m.BudgetDetailComponent)
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
          {
            path: 'new',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'recurring',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'import',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          }
        ]
      },
      {
        path: 'accounts',
        children: [
          {
            path: '',
            redirectTo: 'checking',
            pathMatch: 'full'
          },
          {
            path: 'checking',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'savings',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'transfer',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          }
        ]
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            redirectTo: 'monthly',
            pathMatch: 'full'
          },
          {
            path: 'monthly',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'categories',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'trends',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'income-expenses',
            loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
          }
        ]
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
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
