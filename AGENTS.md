# Budget Compass: Frontend Coding Guidelines

This document provides specific guidelines for developing the Angular frontend of the Budget Compass application. Follow these instructions to ensure consistent, high-quality code.

## Technology Stack

- **Framework**: Angular 19+
- **UI Components**: PrimeNG
- **Data Grid**: AG-Grid
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals

## Task Planning

**IMPORTANT: Before starting any new task, always consult [`plan.md`](../plan.md) first.**

- Check [`plan.md`](../plan.md) for existing project plans, architectural decisions, and ongoing work
- Review any relevant context, requirements, or constraints documented in the plan
- Update [`plan.md`](../plan.md) with your task breakdown and approach before implementation
- Keep [`plan.md`](../plan.md) synchronized with actual progress and any changes to the plan
- Use the plan as a single source of truth for project direction and task coordination

This ensures all agents and developers are aligned on project goals, avoid duplicate work, and maintain consistency across the codebase.

## Modern Angular Concepts

### 1. Signals for State Management

- Use signals as the primary state management mechanism
- Follow these patterns for signal implementation:

```typescript
// In services
private dataSignal = signal<DataType[]>([]);
readonly data = this.dataSignal.asReadonly(); // Expose readonly signals

// Computed signals for derived state
readonly filteredData = computed(() => {
  const filter = this.filterSignal();
  return this.data().filter(item => /* filter logic */);
});

// In components
// Access signals with the function call syntax
<div>{{ data() }}</div>
```

- Use the appropriate signal update methods:
  - `set()` for replacing values
  - `update()` for updates based on previous value
  - `mutate()` for in-place mutations

### 2. Standalone Components

- Create all new components as standalone components
- Import dependencies directly in the component
- Use the following pattern:

```typescript
@Component({
  selector: 'app-budget-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Other component dependencies
  ],
  templateUrl: './budget-item.component.html',
  styleUrl: './budget-item.component.scss'
})
export class BudgetItemComponent {
  // Component implementation
}
```

### 3. New Control Flow Syntax

- **Strictly use the new built-in control flow syntax (`@if`, `@for`, `@switch`).**
- **The use of structural directives like `*ngIf`, `*ngFor`, and `ngSwitch` is forbidden.**
- Follow these patterns:

```html
<!-- Conditional rendering -->
@if (condition()) {
  <div>Content to show when condition is true</div>
} @else {
  <div>Content to show when condition is false</div>
}

<!-- Loops -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>No items found</div>
}
```

### 4. Component Inputs and Outputs

#### Inputs
- **Always use the `input()` function for declaring component inputs.** The `@Input()` decorator is forbidden.
- Use `input.required<T>()` for mandatory inputs.

```typescript
import { Component, input } from '@angular/core';

@Component({
  // ...
})
export class BudgetCategoryComponent {
  // Required input
  category = input.required<Category>();
  
  // Optional input with a default value
  description = input<string>('Default description');
}
```

#### Outputs
- **Always use the `output()` function for declaring component outputs.**
- **The `@Output()` decorator and `EventEmitter` are forbidden.**

```typescript
import { Component, output } from '@angular/core';
import { BudgetItem } from '../models/budget.model';

@Component({
  // ...
})
export class BudgetItemComponent {
  itemSelected = output<BudgetItem>();

  onSelect(item: BudgetItem) {
    this.itemSelected.emit(item);
  }
}
```

### 5. Deferred Loading

- Use deferred loading for heavy components or content that isn't immediately needed

```html
@defer {
  <app-budget-chart [data]="chartData()"></app-budget-chart>
} @placeholder {
  <div class="chart-placeholder">Chart will appear here</div>
}

@defer (on viewport) {
  <app-transaction-history [transactions]="transactions()"></app-transaction-history>
}
```

## Code Organization

### 1. Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature modules/components
│   │   ├── guards/           # Route guards
│   │   ├── interceptors/     # HTTP interceptors
│   │   ├── models/           # TypeScript interfaces/types
│   │   ├── services/         # Services for data and business logic
│   │   ├── utils/            # Utility functions
│   │   ├── app.component.ts  # Root component
│   │   ├── app.config.ts     # App configuration
│   │   └── app.routes.ts     # Route definitions
│   ├── assets/               # Static assets
│   └── styles/               # Global styles
```

### 2. Feature Organization

- Group related components, services, and models by feature
- Keep feature-specific code within its feature directory
- Share common code through the shared module or standalone imports

## Styling Guidelines

### 1. Tailwind CSS

- Use Tailwind utility classes for styling
- Create custom utility classes for repeated patterns
- Follow mobile-first responsive design principles

### 2. Component Styling

- Use component-specific stylesheets for complex styling
- Prefer scoped styles with the component's style file
- Use CSS variables for theming and consistent values

## Performance Best Practices

### 1. Change Detection

- Use OnPush change detection strategy for components
- Leverage signals for efficient updates
- Avoid expensive computations in templates

### 2. Lazy Loading

- Implement route-level lazy loading for features
- Use deferred loading for heavy components
- Implement virtual scrolling for long lists with AG-Grid

### 3. Bundle Optimization

- Keep dependencies minimal
- Use standalone components to improve tree-shaking
- Implement proper code-splitting

## Testing

### 1. Unit Tests

- Write unit tests for all services and complex components
- Test signal-based state changes
- Mock external dependencies

### 2. Component Tests

- Test component rendering and interactions
- Verify signal-based reactivity
- Test component inputs and outputs

## API Communication

### 1. Service Pattern

- Create dedicated services for API communication
- Use signals to store and expose API data
- Implement proper error handling

```typescript
@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private budgetsSignal = signal<Budget[]>([]);
  readonly budgets = this.budgetsSignal.asReadonly();
  
  constructor(private http: HttpClient) {}
  
  loadBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>('/api/budgets').pipe(
      tap(budgets => this.budgetsSignal.set(budgets)),
      catchError(this.handleError)
    );
  }
  
  // Other methods...
}
```

### 2. Error Handling

- Implement consistent error handling across the application
- Use HTTP interceptors for global error handling
- Provide user-friendly error messages

## Accessibility

- Ensure proper semantic HTML
- Implement ARIA attributes where needed
- Test with screen readers
- Ensure keyboard navigation works properly

## Documentation

- Document complex components with JSDoc comments
- Include usage examples for reusable components
- Document signal patterns and state management approaches

By following these guidelines, we'll create a modern, maintainable, and performant Angular application that leverages the latest features and best practices.