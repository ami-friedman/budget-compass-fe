import { APP_INITIALIZER, Provider } from '@angular/core';
import { BudgetService } from './budget.service';

/**
 * Factory function to initialize the BudgetService
 */
export function initializeBudgetService(budgetService: BudgetService) {
  return () => {
    // Initialize the budget service data
    budgetService.initialize();
    return Promise.resolve();
  };
}

/**
 * Provider for initializing services when the application starts
 */
export const serviceInitializerProviders: Provider[] = [
  {
    provide: APP_INITIALIZER,
    useFactory: initializeBudgetService,
    deps: [BudgetService],
    multi: true
  }
];