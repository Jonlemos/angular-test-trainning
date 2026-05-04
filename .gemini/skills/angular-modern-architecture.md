# Angular Modern Architecture (v18+)

## Overview
This skill covers Angular 18+ best practices using standalone components, signals, Native Federation, and modern reactive patterns.

## Core Principles

### 1. Standalone Components (Default)
**Always use standalone components unless explicitly integrating with legacy code.**

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {}
```

### 2. Signals for State Management

**Use signals instead of BehaviorSubject for local component state.**

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  template: `
    <div class="balance-card">
      <h2>Saldo disponível</h2>
      <p>{{ formattedBalance() }}</p>
      <button (click)="toggleVisibility()">
        {{ isVisible() ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>
  `
})
export class BalanceCardComponent {
  private balance = signal(0);
  private isVisible = signal(true);
  
  formattedBalance = computed(() => 
    this.isVisible() 
      ? `R$ ${this.balance().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : '- - - - - - '
  );
  
  toggleVisibility() {
    this.isVisible.update(v => !v);
  }
}
```

### 3. OnPush Change Detection (Always)

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // REQUIRED
  template: `...`
})
export class TransactionListComponent {}
```

## Project Structure

apps/angular-host/
├── src/
│ ├── app/
│ │ ├── core/ # Singleton services, guards, interceptors
│ │ │ ├── auth/
│ │ │ │ ├── auth.service.ts
│ │ │ │ ├── auth.guard.ts
│ │ │ │ └── token.interceptor.ts
│ │ │ ├── api/
│ │ │ │ └── api.service.ts
│ │ │ └── error/
│ │ │ └── error.service.ts
│ │ ├── features/ # Feature modules (lazy loaded)
│ │ │ ├── dashboard/
│ │ │ │ ├── dashboard.routes.ts
│ │ │ │ ├── dashboard.component.ts
│ │ │ │ └── components/
│ │ │ ├── payments/
│ │ │ ├── statements/
│ │ │ └── renegotiation/
│ │ ├── shared/ # Shared components, directives, pipes
│ │ │ ├── components/
│ │ │ │ ├── button/
│ │ │ │ ├── card/
│ │ │ │ └── modal/
│ │ │ ├── directives/
│ │ │ ├── pipes/
│ │ │ └── utils/
│ │ ├── app.config.ts # Application configuration
│ │ ├── app.routes.ts # Route configuration
│ │ └── app.component.ts # Root component
│ ├── assets/
│ ├── environments/
│ │ ├── environment.ts
│ │ └── environment.prod.ts
│ ├── styles/
│ │ ├── _variables.scss
│ │ ├── _mixins.scss
│ │ └── global.scss
│ └── main.ts


## Routing (File-based with Lazy Loading)

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payments',
    loadChildren: () => import('./features/payments/payments.routes')
      .then(m => m.PAYMENTS_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
```

## Services (Injectable with providedIn)

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

@Injectable({
  providedIn: 'root' // Singleton
})
export class TransactionService {
  private http = inject(HttpClient);
  private transactions = signal<Transaction[]>([]);
  
  readonly transactions$ = computed(() => this.transactions());
  
  loadTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${environment.chargeApiUrl}/transactions`)
      .pipe(
        tap(transactions => this.transactions.set(transactions))
      );
  }
  
  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${environment.chargeApiUrl}/transactions`, transaction)
      .pipe(
        tap(newTransaction => {
          this.transactions.update(txns => [...txns, newTransaction]);
        })
      );
  }
}
```

## HTTP Interceptors (Functional)

```typescript
// core/auth/token.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Request-ID': crypto.randomUUID()
      }
    });
  }
  
  return next(req);
};

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([tokenInterceptor, errorInterceptor])
    )
  ]
};
```

## Forms (Reactive with Typed Forms)

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
      <input formControlName="recipient" placeholder="Destinatário" />
      <input formControlName="amount" type="number" placeholder="Valor" />
      <button type="submit" [disabled]="paymentForm.invalid">Pagar</button>
    </form>
  `
})
export class PaymentFormComponent {
  private fb = inject(FormBuilder);
  
  paymentForm = this.fb.group({
    recipient: ['', [Validators.required, Validators.minLength(3)]],
    amount: [0, [Validators.required, Validators.min(0.01)]]
  });
  
  onSubmit() {
    if (this.paymentForm.valid) {
      console.log(this.paymentForm.value);
    }
  }
}
```

## Testing (Jest + Testing Library)

```typescript
// dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { TransactionService } from '../../core/services/transaction.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  beforeEach(async () => {
    mockTransactionService = {
      loadTransactions: jest.fn().mockReturnValue(of([]))
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: TransactionService, useValue: mockTransactionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should load transactions on init', () => {
    fixture.detectChanges();
    expect(mockTransactionService.loadTransactions).toHaveBeenCalled();
  });
});
```

## Performance Optimizations

### 1. TrackBy Functions
```typescript
@Component({
  template: `
    <div *ngFor="let item of items; trackBy: trackById">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  items = signal<Item[]>([]);
  
  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

### 2. Async Pipe (Always prefer over manual subscriptions)
```typescript
@Component({
  template: `
    <div *ngIf="balance$ | async as balance">
      {{ balance | currency:'BRL' }}
    </div>
  `
})
export class BalanceComponent {
  balance$ = inject(BalanceService).balance$;
}
```

### 3. Defer (for below-fold content)
```typescript
@Component({
  template: `
    @defer (on viewport) {
      <app-transaction-list />
    } @placeholder {
      <div class="skeleton"></div>
    }
  `
})
```

## Accessibility

```typescript
@Component({
  template: `
    <button 
      type="button"
      [attr.aria-label]="'Pagar R$ ' + amount()"
      [attr.aria-pressed]="isSelected()"
      (click)="handlePayment()"
      (keydown.enter)="handlePayment()"
      (keydown.space)="handlePayment()">
      Pagar
    </button>
  `
})
```

## Style Encapsulation

```typescript
@Component({
  selector: 'app-card',
  encapsulation: ViewEncapsulation.Emulated, // Default (recommended)
  styles: [`
    :host {
      display: block;
      padding: 1rem;
      border-radius: 8px;
      background: var(--card-bg);
    }
  `]
})
```

## Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authApiUrl: 'http://localhost:3001/api',
  chargeApiUrl: 'http://localhost:3002/api',
  renegotiationApiUrl: 'http://localhost:3003/api',
  enableLogging: true,
  version: '1.0.0'
};
```

---

*Always follow these patterns for consistency and maintainability.*