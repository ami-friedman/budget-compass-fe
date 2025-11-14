import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// Define the Category interface based on our backend model
export interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/categories`;

  // Signal to hold the list of categories
  private categoriesSignal = signal<Category[]>([]);
  
  // Public readonly signal for components to consume
  readonly categories = this.categoriesSignal.asReadonly();

  constructor() {
    // Load categories initially
    this.loadCategories().subscribe();
  }

  /**
   * Fetches categories from the API and updates the signal.
   */
  loadCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      tap(categories => this.categoriesSignal.set(categories))
    );
  }

  /**
   * Creates a new category.
   * @param category The category data to create.
   */
  createCategory(category: { name: string }): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap(newCategory => {
        this.categoriesSignal.update(categories => [...categories, newCategory]);
      })
    );
  }

  /**
   * Updates an existing category.
   * @param categoryId The ID of the category to update.
   * @param categoryData The new data for the category.
   */
  updateCategory(categoryId: number, categoryData: { name: string }): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${categoryId}`, categoryData).pipe(
      tap(updatedCategory => {
        this.categoriesSignal.update(categories => 
          categories.map(cat => cat.id === categoryId ? updatedCategory : cat)
        );
      })
    );
  }

  /**
   * Archives a category (soft delete).
   * @param categoryId The ID of the category to archive.
   */
  archiveCategory(categoryId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${categoryId}`).pipe(
      tap(() => {
        // Instead of removing, we could update the is_active flag if we fetch archived ones too
        this.categoriesSignal.update(categories => 
          categories.filter(cat => cat.id !== categoryId)
        );
      })
    );
  }
}