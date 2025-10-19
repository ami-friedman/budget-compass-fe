import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

interface LoginResponse {
  message: string;
}

interface UserResponse {
  email: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<UserResponse | null>(null);
  
  user$ = this.userSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Check if token exists on startup and load user if it does
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe();
    }
  }

  login(email: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email });
  }

  verifyToken(token: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/verify`, { token })
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.getCurrentUser().subscribe();
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
  }

  getCurrentUser(): Observable<UserResponse | null> {
    const token = this.getToken();
    
    if (!token) {
      return of(null);
    }
    
    return this.http.get<UserResponse>(`${this.apiUrl}/users/me`)
      .pipe(
        tap(user => this.userSubject.next(user)),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
