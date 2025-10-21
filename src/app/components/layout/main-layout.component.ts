import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, ButtonModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private routerSubscription: Subscription | null = null;
  
  // Mobile menu state
  isMobileMenuOpen = signal(false);
  isUserMenuOpen = signal(false);
  
  // User information
  userEmail = '';
  
  // Navigation state from service
  showSecondaryNav = this.navigationService.showSecondaryNav;
  secondaryNavItems = this.navigationService.secondaryNavItems;
  
  constructor() {
    // Subscribe to user information
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
      }
    });
  }
  
  ngOnInit(): void {
    // Listen for route changes to update navigation
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateNavigation(event.url);
      
      // Close mobile menu on navigation
      this.isMobileMenuOpen.set(false);
      this.isUserMenuOpen.set(false);
    });
    
    // Set initial navigation based on current URL
    this.updateNavigation(this.router.url);
  }
  
  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  /**
   * Update navigation based on current URL
   */
  private updateNavigation(url: string): void {
    // Extract the first segment of the URL to determine the section
    const section = url.split('/')[1] || 'dashboard';
    this.navigationService.setCurrentSection(section);
    
    // Update breadcrumbs based on the URL
    this.updateBreadcrumbs(url);
  }
  
  /**
   * Update breadcrumbs based on URL
   */
  private updateBreadcrumbs(url: string): void {
    const urlWithoutQuery = url.split('?')[0];
    const segments = urlWithoutQuery.split('/').filter(segment => segment);
    
    if (segments.length === 0) {
      this.navigationService.clearBreadcrumbs();
      return;
    }
    
    const breadcrumbs = segments.map((segment, index) => {
      // Create a partial URL up to this segment
      const route = `/${segments.slice(0, index + 1).join('/')}`;
      
      // Format the label (capitalize first letter, replace hyphens with spaces)
      const label = segment.charAt(0).toUpperCase() +
                   segment.slice(1).replace(/-/g, ' ');
      
      return { label, route };
    });
    
    // Make the last item not clickable by setting an empty route
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1] = {
        ...breadcrumbs[breadcrumbs.length - 1],
        route: ''
      };
    }
    
    this.navigationService.updateBreadcrumbs(breadcrumbs);
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }
  
  toggleUserMenu(): void {
    this.isUserMenuOpen.update(value => !value);
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}