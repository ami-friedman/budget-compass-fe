import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loading = true;
    this.error = null;

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.loading = false;
        if (user) {
          this.userEmail = user.email;
        } else {
          this.error = 'User data not available';
          this.logout();
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load user data';
        console.error('Error loading user data:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
