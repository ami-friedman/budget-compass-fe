import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss'
})
export class VerifyComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verifyToken();
  }

  verifyToken(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (!token) {
        this.error = 'No verification token provided';
        this.loading = false;
        return;
      }

      this.authService.verifyToken(token).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Invalid or expired token';
          console.error('Token verification error:', error);
        }
      });
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
