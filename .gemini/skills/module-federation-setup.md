# Module Federation Setup - Angular + React Integration

## Overview
This skill covers the implementation of Module Federation using **Native Federation** for Angular 18+ and traditional **Module Federation** for React 19 + Next.js 15, enabling micro-frontend architecture [web:61][web:63][web:64].

## Architecture Overview
┌─────────────────────────────────────────────┐
│ Angular 18 Host (Shell) │
│ - Dashboard │
│ - Payments │
│ - Statements │
│ - Renegotiation │
│ - Layout & Navigation │
└──────────────┬──────────────────────────────┘
│
│ Native Federation
│
▼
┌──────────────────────────────────────────────┐
│ React 19 + Next.js 15 Remote │
│ - Login Component │
│ - Authentication Flow │
│ - MFA (Multi-Factor Auth) │
└──────────────────────────────────────────────┘


## Why Native Federation for Angular?

Angular 18+ uses **Native Federation** instead of Webpack Module Federation because:
- Works with esbuild (Angular's new default bundler)
- Better performance (faster builds)
- Type-safe remote imports
- Simpler configuration [web:61][web:66]

## Angular Host Configuration

### 1. Install Native Federation

```bash
cd apps/angular-host
ng add @angular-architects/native-federation
```

### 2. Configure `federation.config.js`

```javascript
// apps/angular-host/federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'angular-host',
  
  // Remotes (micro-frontends to load)
  remotes: {
    'reactLogin': 'http://localhost:4201/remoteEntry.js'
  },
  
  // Shared dependencies
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    })
  },
  
  // Skip these from sharing (React-specific)
  skip: [
    'react',
    'react-dom',
    'next'
  ]
});
```

### 3. Load Remote in Angular Component

```typescript
// apps/angular-host/src/app/features/auth/login-wrapper.component.ts
import { Component, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';

@Component({
  selector: 'app-login-wrapper',
  standalone: true,
  template: `
    <div #reactLoginContainer></div>
  `
})
export class LoginWrapperComponent implements OnInit {
  @ViewChild('reactLoginContainer', { read: ViewContainerRef }) 
  container!: ViewContainerRef;

  async ngOnInit() {
    // Load React remote component
    const { LoginComponent } = await loadRemoteModule({
      remoteName: 'reactLogin',
      exposedModule: './Login'
    });
    
    // Mount React component
    this.mountReactComponent(LoginComponent);
  }
  
  private mountReactComponent(Component: any) {
    const element = this.container.element.nativeElement;
    
    // Create React root and render
    import('react-dom/client').then(({ createRoot }) => {
      import('react').then((React) => {
        const root = createRoot(element);
        root.render(React.createElement(Component, {
          onLoginSuccess: (token: string) => {
            // Handle login success in Angular
            console.log('Login successful:', token);
          }
        }));
      });
    });
  }
  
  ngOnDestroy() {
    // Cleanup React root
    this.container.clear();
  }
}
```

### 4. Route Configuration

```typescript
// apps/angular-host/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-wrapper.component')
      .then(m => m.LoginWrapperComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  }
];
```

## React Remote Configuration (Next.js 15)

### 1. Install Module Federation Plugin

```bash
cd apps/react-login-remote
npm install @module-federation/nextjs-mf
```

### 2. Configure `next.config.js`

```javascript
// apps/react-login-remote/next.config.js
const NextFederationPlugin = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'reactLogin',
          filename: 'static/chunks/remoteEntry.js',
          
          // Expose components
          exposes: {
            './Login': './src/components/Login.tsx'
          },
          
          // Shared dependencies
          shared: {
            react: {
              singleton: true,
              requiredVersion: '^19.0.0'
            },
            'react-dom': {
              singleton: true,
              requiredVersion: '^19.0.0'
            }
          }
        })
      );
    }
    return config;
  }
};

module.exports = nextConfig;
```

### 3. Create Exposed Component

```typescript
// apps/react-login-remote/src/components/Login.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess?: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        onLoginSuccess?.(result.token);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <h1>Login PJ - Itaú Empresas</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="cpfCnpj">CPF/CNPJ</label>
          <input 
            {...register('cpfCnpj')}
            type="text" 
            id="cpfCnpj"
            placeholder="Digite seu CPF ou CNPJ"
          />
          {errors.cpfCnpj && <span>{errors.cpfCnpj.message}</span>}
        </div>
        
        <div>
          <label htmlFor="password">Senha</label>
          <input 
            {...register('password')}
            type="password" 
            id="password"
            placeholder="Digite sua senha"
          />
          {errors.password && <span>{errors.password.message}</span>}
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
```

### 4. Standalone Development Mode

```typescript
// apps/react-login-remote/src/app/page.tsx
import Login from '@/components/Login';

export default function HomePage() {
  return (
    <main>
      <Login onLoginSuccess={(token) => console.log('Token:', token)} />
    </main>
  );
}
```

## Type Safety Between Remotes

### 1. Create Shared Types Package

```typescript
// libs/shared/types/src/auth.types.ts
export interface AuthCredentials {
  cpfCnpj: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoginComponentProps {
  onLoginSuccess?: (token: string) => void;
  onLoginError?: (error: Error) => void;
}
```

### 2. Use in React Component

```typescript
// apps/react-login-remote/src/components/Login.tsx
import type { LoginComponentProps, AuthCredentials } from '@shared/types';

export default function Login({ onLoginSuccess, onLoginError }: LoginComponentProps) {
  // Component implementation
}
```

### 3. Use in Angular

```typescript
// apps/angular-host/src/app/features/auth/login-wrapper.component.ts
import type { LoginComponentProps } from '@shared/types';

export class LoginWrapperComponent {
  private loginProps: LoginComponentProps = {
    onLoginSuccess: (token: string) => {
      this.handleLogin(token);
    },
    onLoginError: (error: Error) => {
      this.handleError(error);
    }
  };
}
```

## Development Workflow

### 1. Start All Services

```bash
# Terminal 1: React Remote
cd apps/react-login-remote
npm run dev  # Port 4201

# Terminal 2: Angular Host
cd apps/angular-host
npm start  # Port 4200

# Terminal 3: Backend Services
cd apps/backend
npm run dev:all
```

### 2. Hot Module Replacement (HMR)

Both Angular and React support HMR in development:
- Changes in React component auto-reload in Angular host
- No need to restart servers

### 3. Build for Production

```bash
# Build React remote first
cd apps/react-login-remote
npm run build

# Then build Angular host
cd apps/angular-host
npm run build
```

## Performance Optimization

### 1. Lazy Loading Strategy

```typescript
// Only load React remote when needed
{
  path: 'login',
  loadComponent: () => import('./features/auth/login-wrapper.component')
    .then(m => m.LoginWrapperComponent)
}
```

### 2. Preloading Strategy

```typescript
// apps/angular-host/src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};
```

### 3. Shared Dependencies Optimization

Only share what's necessary to reduce bundle size:

```javascript
// Federation config
shared: {
  '@angular/core': { singleton: true },
  '@angular/common': { singleton: true },
  'rxjs': { singleton: true }
  // Don't share everything - be selective
}
```

## Testing Module Federation

### 1. Unit Tests (Mock Remote)

```typescript
// login-wrapper.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { LoginWrapperComponent } from './login-wrapper.component';

// Mock loadRemoteModule
jest.mock('@angular-architects/native-federation', () => ({
  loadRemoteModule: jest.fn().mockResolvedValue({
    LoginComponent: () => '<div>Mock Login</div>'
  })
}));

describe('LoginWrapperComponent', () => {
  it('should load remote component', async () => {
    const fixture = TestBed.createComponent(LoginWrapperComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mock Login');
  });
});
```

### 2. Integration Tests

```typescript
// Test with real remote in CI/CD
describe('Module Federation Integration', () => {
  beforeAll(async () => {
    // Start React remote on test port
    await startRemote('http://localhost:5001');
  });
  
  it('should communicate between host and remote', async () => {
    // Test actual integration
  });
});
```

## Common Issues & Solutions

### Issue: Remote not loading

**Solution:** Check CORS configuration

```typescript
// apps/react-login-remote/next.config.js
async headers() {
  return [
    {
      source: '/remoteEntry.js',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' }
      ]
    }
  ];
}
```

### Issue: Type mismatch

**Solution:** Use shared types package and strict TypeScript

```bash
npm install @shared/types --workspace apps/angular-host
npm install @shared/types --workspace apps/react-login-remote
```

### Issue: Different React versions

**Solution:** Pin versions in both projects

```json
{
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
```

## Production Deployment

### 1. CDN Strategy

```javascript
// Production federation config
remotes: {
  'reactLogin': 'https://cdn.itau.com.br/pj/login/remoteEntry.js'
}
```

### 2. Versioning

```javascript
// Use version in remote URL
remotes: {
  'reactLogin': `https://cdn.itau.com.br/pj/login/${VERSION}/remoteEntry.js`
}
```

### 3. Fallback Strategy

```typescript
async loadRemoteWithFallback() {
  try {
    return await loadRemoteModule({ remoteName: 'reactLogin', exposedModule: './Login' });
  } catch (error) {
    console.error('Failed to load remote, using fallback');
    return await import('./fallback-login.component');
  }
}
```

## Resources

- [Native Federation Docs](https://www.angulararchitects.io/en/blog/the-microfrontend-revolution-part-2-module-federation-with-angular/) [web:61]
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples) [web:64]
- [Next.js Module Federation](https://module-federation.io/guide/framework/nextjs.html)

---

*Use this configuration to seamlessly integrate React components into Angular applications.*