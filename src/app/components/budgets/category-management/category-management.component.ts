import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule, SelectModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent {
  categoryService = inject(CategoryService);
  categories = this.categoryService.categories;

  newCategoryName = '';
  editingCategoryId: number | null = null;
  editingCategoryName = '';
  selectedCategory: any = null;

  addCategory() {
    if (this.newCategoryName.trim()) {
      this.categoryService.createCategory({ name: this.newCategoryName.trim() }).subscribe({
        next: () => {
          this.newCategoryName = '';
        },
        error: (err) => console.error('Error creating category', err)
      });
    }
  }

  startEdit(category: { id: number, name: string }) {
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelEdit() {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveCategory(categoryId: number) {
    if (this.editingCategoryName.trim() && this.editingCategoryId === categoryId) {
      this.categoryService.updateCategory(categoryId, { name: this.editingCategoryName.trim() }).subscribe({
        next: () => {
          this.cancelEdit();
        },
        error: (err) => console.error('Error updating category', err)
      });
    }
  }

  archiveCategory(categoryId: number) {
    if (confirm('Are you sure you want to archive this category?')) {
      this.categoryService.archiveCategory(categoryId).subscribe({
        error: (err) => console.error('Error archiving category', err)
      });
    }
  }
}