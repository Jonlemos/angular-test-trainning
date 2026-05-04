# Testing Strategy - Comprehensive Testing Guide

## Overview
This skill defines the testing strategy for the Itaú PJ Dashboard, covering unit tests, integration tests, E2E tests, and accessibility testing across Angular, React, and Node.js microservices [web:113][web:117].

## Testing Pyramid
┌─────────────────────────────────────────────────────────┐
│ E2E Tests            │ 10% - Critical user flows        │
│ (Playwright)         │                                  │
├─────────────────────────────────────────────────────────┤
│ Integration Tests    │ 30% - API + Component integration│
│ (Jest)               │                                  │
├─────────────────────────────────────────────────────────┤
│ Unit Tests           │ 60% - Business logic, utilities  │
│ (Jest + RTL)         │                                  │
└─────────────────────────────────────────────────────────┘


## Coverage Requirements

| Layer | Minimum Coverage | Target |
|-------|-----------------|--------|
| Unit Tests | 80% | 90% |
| Integration Tests | 60% | 75% |
| E2E Tests | Critical paths | 100% |
| Accessibility | WCAG 2.1 AA | 100% |

## Angular Testing (Jest + Testing Library)

### Setup Configuration

```javascript
// apps/angular-host/jest.config.js
export default {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.module.ts',
    '!src/main.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
    '@features/(.*)': '<rootDir>/src/app/features/$1'
  }
};
```

### Unit Test Examples

```typescript
// apps/angular-host/src/app/core/services/balance.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BalanceService } from './balance.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BalanceService]
    });
    
    service = TestBed.inject(BalanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch balance successfully', (done) => {
    const mockBalance = { available: 15000.50, blocked: 0 };
    
    service.getBalance().subscribe(balance => {
      expect(balance).toEqual(mockBalance);
      done();
    });
    
    const req = httpMock.expectOne('http://localhost:3002/api/balance');
    expect(req.request.method).toBe('GET');
    req.flush(mockBalance);
  });

  it('should handle balance fetch error', (done) => {
    service.getBalance().subscribe({
      error: (error) => {
        expect(error.status).toBe(500);
        done();
      }
    });
    
    const req = httpMock.expectOne('http://localhost:3002/api/balance');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('should update balance signal', () => {
    const mockBalance = { available: 20000, blocked: 0 };
    
    service.balance.set(mockBalance);
    
    expect(service.balance()).toEqual(mockBalance);
  });
});
```

### Component Testing

```typescript
// apps/angular-host/src/app/features/dashboard/dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { BalanceService } from '@core/services/balance.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockBalanceService: jest.Mocked<BalanceService>;

  beforeEach(async () => {
    mockBalanceService = {
      balance: signal({ available: 15000.50, blocked: 0 }),
      getBalance: jest.fn().mockReturnValue(of({ available: 15000.50, blocked: 0 }))
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: BalanceService, useValue: mockBalanceService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display balance on init', () => {
    fixture.detectChanges();
    
    const balanceElement = fixture.debugElement.query(By.css('[data-testid="balance-amount"]'));
    expect(balanceElement.nativeElement.textContent).toContain('15.000,50');
  });

  it('should show error message when balance fetch fails', () => {
    mockBalanceService.getBalance.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    
    fixture.detectChanges();
    
    const errorElement = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
    expect(errorElement).toBeTruthy();
  });

  it('should toggle balance visibility', () => {
    fixture.detectChanges();
    
    const toggleButton = fixture.debugElement.query(By.css('[data-testid="toggle-visibility"]'));
    toggleButton.nativeElement.click();
    fixture.detectChanges();
    
    const balanceElement = fixture.debugElement.query(By.css('[data-testid="balance-amount"]'));
    expect(balanceElement.nativeElement.textContent).toContain('- - - - - - ');
  });
});
```

## React Testing (Jest + React Testing Library)

### Setup Configuration

```javascript
// apps/react-login-remote/jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Component Tests

```typescript
// apps/react-login-remote/src/components/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { apiClient } from '@/lib/api';

// Mock API client
jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />, { wrapper });
    
    expect(screen.getByPlaceholderText(/cpf ou cnpj/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<Login />, { wrapper });
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cpf\/cnpj deve ter no mínimo/i)).toBeInTheDocument();
      expect(screen.getByText(/senha deve ter no mínimo/i)).toBeInTheDocument();
    });
  });

  it('calls onLoginSuccess when login is successful', async () => {
    const mockOnLoginSuccess = jest.fn();
    
    mockApiClient.post.mockResolvedValueOnce({
      token: 'mock-token-123',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        cnpj: '12.345.678/0001-90'
      }
    });
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />, { wrapper });
    
    const user = userEvent.setup();
    
    await user.type(screen.getByPlaceholderText(/cpf ou cnpj/i), '12345678901234');
    await user.type(screen.getByPlaceholderText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('mock-token-123');
    });
  });

  it('displays error message when login fails', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<Login />, { wrapper });
    
    const user = userEvent.setup();
    
    await user.type(screen.getByPlaceholderText(/cpf ou cnpj/i), '12345678901234');
    await user.type(screen.getByPlaceholderText(/senha/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows MFA modal when MFA is required', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      requiresMFA: true,
      sessionToken: 'session-token-123'
    });
    
    render(<Login />, { wrapper });
    
    const user = userEvent.setup();
    
    await user.type(screen.getByPlaceholderText(/cpf ou cnpj/i), '12345678901234');
    await user.type(screen.getByPlaceholderText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/autenticação de dois fatores/i)).toBeInTheDocument();
    });
  });
});
```

## Backend Testing (Node.js + Jest + Supertest)

### API Integration Tests

```javascript
// apps/backend/auth-service/__tests__/auth.integration.test.js
import request from 'supertest';
import app from '../server.js';

describe('Auth Service Integration Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should return session token for valid credentials with MFA enabled', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '12345678901234',
          password: 'password123'
        })
        .expect(200);
      
      expect(response.body).toMatchObject({
        requiresMFA: true,
        sessionToken: expect.any(String),
        message: expect.stringContaining('autenticação')
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '99999999999999',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for invalid input format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: 'invalid',
          password: '123'
        })
        .expect(400);
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce rate limiting', async () => {
      // Make 101 requests rapidly
      const requests = Array(101).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            cpfCnpj: '12345678901234',
            password: 'password123'
          })
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/mfa/verify', () => {
    let sessionToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '12345678901234',
          password: 'password123'
        });
      
      sessionToken = loginResponse.body.sessionToken;
    });

    it('should return JWT token for valid MFA code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({
          code: '123456',
          sessionToken
        })
        .expect(200);
      
      expect(response.body).toMatchObject({
        token: expect.any(String),
        user: {
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          cnpj: expect.any(String)
        }
      });
    });

    it('should return 401 for invalid MFA code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .send({
          code: '999999',
          sessionToken
        })
        .expect(401);
      
      expect(response.body.error.code).toBe('INVALID_MFA_CODE');
    });
  });
});
```

## E2E Testing (Playwright)

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('complete login flow with MFA', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:4200/login');
    
    // Fill credentials
    await page.getByPlaceholder(/cpf ou cnpj/i).fill('12345678901234');
    await page.getByPlaceholder(/senha/i).fill('password123');
    
    // Submit
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Wait for MFA modal
    await expect(page.getByText(/autenticação de dois fatores/i)).toBeVisible();
    
    // Enter MFA code
    await page.getByPlaceholder(/código/i).fill('123456');
    await page.getByRole('button', { name: /verificar/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/saldo disponível/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    await page.getByPlaceholder(/cpf ou cnpj/i).fill('99999999999999');
    await page.getByPlaceholder(/senha/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    await expect(page.getByText(/cpf\/cnpj ou senha inválidos/i)).toBeVisible();
  });
});
```

## Accessibility Testing

```typescript
// apps/angular-host/src/app/features/dashboard/dashboard.component.a11y.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DashboardComponent } from './dashboard.component';

expect.extend(toHaveNoViolations);

describe('Dashboard Accessibility', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should have no accessibility violations', async () => {
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
```

## Coverage Reports

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:a11y": "jest --testMatch='**/*.a11y.spec.ts'"
  }
}
```

---

*Follow this testing strategy to ensure high-quality, reliable code across all layers.*