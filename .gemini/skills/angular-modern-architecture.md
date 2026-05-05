# Angular Modern Architecture (v18+)

## Overview
This skill covers Angular 18+ best practices using standalone components, signals, Native Federation, and modern reactive patterns.

## Core Principles

### 1. Standalone Components (Default)
**Always use standalone components.** They are self-contained and don't require NgModule declarations.

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Best practice: OnPush
  imports: [...],
  template: `...`
})
export class AppComponent {}
```

### 2. Signals for State Management
**Signals are the preferred way to handle state.** Use them for local state, inputs, and outputs.

```typescript
import { Component, signal, computed, input, output, model } from '@angular/core';

@Component({
  selector: 'app-user',
  standalone: true,
  template: `
    <h3>{{ name() }}</h3>
    <button (click)="select.emit(id())">Selecionar</button>
  `
})
export class UserComponent {
  id = input.required<string>();
  name = input.required<string>();
  select = output<string>();
  
  // Two-way binding
  isActive = model(false);
}
```

### 3. Zoneless Angular (Recommended)
**Enable zoneless mode to improve performance and bundle size.**

```typescript
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection()
  ]
};
```

### 4. Modern Control Flow
**Always use the new control flow syntax (`@if`, `@for`, `@defer`).**

```html
@if (user()) {
  <span>{{ user()!.name }}</span>
} @else {
  <app-login-button />
}

@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>Nenhum item encontrado.</p>
}

@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div class="skeleton"></div>
}
```

### 5. Dependency Injection with `inject()`
**Use the `inject()` function for dependencies instead of constructor injection.**

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({...})
export class DashboardComponent {
  private authService = inject(AuthService);
  user = this.authService.user;
}
```

### 6. Reactive Auth Refresh (Polling)
**Implement background polling for session renewal using RxJS + Signals.**

```typescript
// token-refresh.service.ts
export class TokenRefreshService {
  private interval$ = timer(0, 5 * 60 * 1000).pipe(
    filter(() => this.authService.isAuthenticated()),
    switchMap(() => this.http.post<RefreshResponse>(URL, {}))
  );
  
  start() {
    this.interval$.subscribe(res => this.authService.update(res));
  }
}
```

### 7. Functional Interceptors
**Use functional interceptors for cleaner, more tree-shakeable HTTP pipelines.**

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }}) : req;
  return next(authReq);
};
```

## Performance Optimizations

1. **OnPush + Signals:** The combination of `OnPush` and signals ensures minimal change detection cycles.
2. **Defer Blocks:** Use `@defer` to lazy-load components that are not immediately visible.
3. **Optimized Images:** Use `NgOptimizedImage` for better LCP.

## Testing Modern Angular
Use signals and `setInput` for testing signal components.

```typescript
it('should update name', () => {
  const fixture = TestBed.createComponent(UserComponent);
  fixture.componentRef.setInput('name', 'Novo Nome');
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Novo Nome');
});
```