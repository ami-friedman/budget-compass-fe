import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-navigation-test',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-bold mb-4">Navigation Test Component</h2>
      
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-2">Current Navigation State</h3>
        <div class="bg-gray-100 p-4 rounded-md">
          <p><strong>Current Section:</strong> {{ currentSection() }}</p>
          <p><strong>Show Secondary Nav:</strong> {{ showSecondaryNav() ? 'Yes' : 'No' }}</p>
          <p><strong>Breadcrumbs:</strong></p>
          <ul class="list-disc pl-5">
            <li *ngFor="let item of breadcrumbs()">
              {{ item.label }}
              <ng-container *ngIf="item.route && item.route !== ''">
                (Link to {{ item.route }})
              </ng-container>
              <ng-container *ngIf="!item.route || item.route === ''">
                (Current)
              </ng-container>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-2">Secondary Navigation Items</h3>
        <div class="bg-gray-100 p-4 rounded-md">
          <ul class="list-disc pl-5" *ngIf="secondaryNavItems().length > 0">
            <li *ngFor="let item of secondaryNavItems()">
              {{ item.label }} ({{ item.route }})
            </li>
          </ul>
          <p *ngIf="secondaryNavItems().length === 0">No secondary navigation items for this section.</p>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-2">Test Navigation</h3>
        <div class="grid grid-cols-2 gap-4">
          <a routerLink="/dashboard" class="block p-3 bg-blue-100 hover:bg-blue-200 rounded-md text-center">
            Dashboard
          </a>
          <a routerLink="/budgets" class="block p-3 bg-green-100 hover:bg-green-200 rounded-md text-center">
            Budgets
          </a>
          <a routerLink="/transactions" class="block p-3 bg-yellow-100 hover:bg-yellow-200 rounded-md text-center">
            Transactions
          </a>
          <a routerLink="/accounts" class="block p-3 bg-purple-100 hover:bg-purple-200 rounded-md text-center">
            Accounts
          </a>
          <a routerLink="/reports" class="block p-3 bg-red-100 hover:bg-red-200 rounded-md text-center">
            Reports
          </a>
          <a routerLink="/settings" class="block p-3 bg-gray-100 hover:bg-gray-200 rounded-md text-center">
            Settings
          </a>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-medium mb-2">Test Secondary Navigation</h3>
        <div class="grid grid-cols-2 gap-4" *ngIf="showSecondaryNav()">
          <a *ngFor="let item of secondaryNavItems()" 
             [routerLink]="item.route" 
             class="block p-3 bg-indigo-100 hover:bg-indigo-200 rounded-md text-center">
            {{ item.label }}
          </a>
        </div>
        <p *ngIf="!showSecondaryNav()" class="text-gray-500">
          Navigate to a section with secondary navigation (like Budgets) to test.
        </p>
      </div>
    </div>
  `
})
export class NavigationTestComponent {
  private navigationService = inject(NavigationService);
  
  // Get navigation state from service
  currentSection = this.navigationService.currentSection;
  showSecondaryNav = this.navigationService.showSecondaryNav;
  secondaryNavItems = this.navigationService.secondaryNavItems;
  breadcrumbs = this.navigationService.breadcrumbs;
}