# Itaú PJ Dashboard - Testing Strategy

## 🎯 Overview
This skill defines the unified testing strategy for the hybrid Angular-React Micro-Frontend ecosystem.

---

## 🛠️ Test Engines

| Layer | Engine | Primary Focus |
|---|---|---|
| **Angular Host** | Jest | Unit, Component, Integration |
| **Backend** | Jest | Unit, Integration (API) |
| **React Remote** | Vitest | Unit, Component (Vite-native) |
| **E2E** | Playwright | Full user flows |

---

## 📐 Testing Patterns

### 1. Angular (Host)
- **Standalone Testing:** Use `TestBed.runInInjectionContext` for testing guards and functional interceptors.
- **Service Mocks:** Use `jest.mock` or manual mock classes to isolate services from HTTP calls.
- **HttpTestingController:** Always use `HttpClientTestingModule` to verify exact request sequences and payloads.

### 2. React (Remote)
- **Component Isolation:** Use `@testing-library/react` for user-centric testing. Avoid testing internal state; test observable behavior.
- **Hook Mocking:** Use `vi.mock` to simulate data fetching (TanStack Query) or state management (Zustand).
- **Environment:** Use `jsdom` for a browser-like testing environment.

### 3. Backend (Microservices)
- **Isolate Database:** Always mock the DB service/fetch calls in unit tests to ensure fast and deterministic execution.
- **Bcrypt Mocking:** Mock `bcrypt` in auth tests to avoid the CPU-intensive hashing process during unit test runs.

---

## 📊 Coverage Requirements
- **Mandatory:** >80% code coverage on all new features.
- **Critical Paths:** 100% coverage on authentication, token refresh, and financial transactions.

---

## 🚀 Execution Commands

```bash
# Angular
cd apps/angular-host && npm test

# React
cd apps/react-login-remote && npm test

# Backend
cd apps/backend/auth-service && npm test
```
