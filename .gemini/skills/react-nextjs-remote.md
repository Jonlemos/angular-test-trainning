# React 19 + Next.js 15 Remote (Login Micro-frontend)

## Overview
This skill covers best practices for building the React login component as a standalone micro-frontend using React 19, Next.js 15, TanStack Query, Zustand, and Shadcn/ui [web:65][web:71].

## Tech Stack

- **React 19:** Latest features (Server Components, use hook)
- **Next.js 15:** App Router, Server Actions
- **TypeScript:** Strict mode
- **TanStack Query v5:** Data fetching and caching
- **Zustand:** Lightweight state management
- **Shadcn/ui:** Accessible component library
- **Zod:** Runtime validation
- **React Hook Form:** Form handling

## Project Structure

apps/react-login-remote/
├── src/
│ ├── app/
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ └── api/
│ │ └── auth/
│ │ └── route.ts
│ ├── components/
│ │ ├── Login.tsx # Exposed to Angular
│ │ ├── LoginForm.tsx
│ │ ├── MFAModal.tsx
│ │ └── ui/ # Shadcn components
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ └── card.tsx
│ ├── lib/
│ │ ├── api.ts
│ │ ├── validations.ts
│ │ └── utils.ts
│ ├── hooks/
│ │ ├── useAuth.ts
│ │ └── useMFA.ts
│ ├── store/
│ │ └── authStore.ts
│ └── types/
│ └── auth.ts
├── public/
├── next.config.js
├── tailwind.config.ts
└── package.json


## Setup Instructions

### 1. Create Next.js Project

```bash
npx create-next-app@latest react-login-remote --typescript --tailwind --app --no-src-dir
cd react-login-remote
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install react@19 react-dom@19 next@15

# State & Data Fetching
npm install @tanstack/react-query zustand

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card label

# Module Federation
npm install @module-federation/nextjs-mf
```

### 3. Configure TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../libs/shared/*"]
    }
  }
}
```

## Core Implementation

### 1. Auth Store (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    cnpj: string;
  } | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthState['user']) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true 
      }),
      
      clearAuth: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false 
      })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);

export default useAuthStore;
```

### 2. API Client with TanStack Query

```typescript
// src/lib/api.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const apiClient = {
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001/api',
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
};
```

### 3. Validation Schemas (Zod)

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const loginSchema = z.object({
  cpfCnpj: z
    .string()
    .min(11, 'CPF/CNPJ deve ter no mínimo 11 dígitos')
    .max(14, 'CPF/CNPJ deve ter no máximo 14 dígitos')
    .regex(/^\d+$/, 'Digite apenas números'),
  
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(50, 'Senha muito longa')
});

export const mfaSchema = z.object({
  code: z
    .string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d+$/, 'Digite apenas números')
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type MFAFormData = z.infer<typeof mfaSchema>;
```

### 4. Auth Hook

```typescript
// src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import type { LoginFormData } from '@/lib/validations';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    cnpj: string;
  };
  requiresMFA?: boolean;
}

export const useAuth = () => {
  const { setAuth } = useAuthStore();
  
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormData) => 
      apiClient.post<LoginResponse>('/auth/login', credentials),
    
    onSuccess: (data) => {
      if (!data.requiresMFA) {
        setAuth(data.token, data.user);
      }
    }
  });
  
  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
    data: loginMutation.data
  };
}
```

### 5. Login Component (Exposed to Angular)

```typescript
// src/components/Login.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MFAModal } from './MFAModal';

interface LoginProps {
  onLoginSuccess?: (token: string) => void;
  onLoginError?: (error: Error) => void;    
}

export const Login = ({ onLoginSuccess, onLoginError }: LoginProps) => {
  const [showMFA, setShowMFA] = useState(false);
  const { login, isLoading, error, data } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      cpfCnpj: '',
      password: ''
    }
  });
  
  const onSubmit = (formData: LoginFormData) => {
    login(formData, {
      onSuccess: (response) => {
        if (response.requiresMFA) {
          setShowMFA(true);
        } else {
          onLoginSuccess?.(response.token);
        }
      },
      onError: (err) => {
        onLoginError?.(err as Error);
      }
    });
  };
  
  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login PJ - Itaú Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...form.register('cpfCnpj')}
                type="text"
                placeholder="CPF ou CNPJ"
                aria-label="CPF ou CNPJ"
                aria-invalid={!!form.formState.errors.cpfCnpj}
              />
              {form.formState.errors.cpfCnpj && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.cpfCnpj.message}
                </p>
              )}
            </div>
            
            <div>
              <Input
                {...form.register('password')}
                type="password"
                placeholder="Senha"
                aria-label="Senha"
                aria-invalid={!!form.formState.errors.password}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded" role="alert">
                {error.message}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {showMFA && data && (
        <MFAModal
          onSuccess={onLoginSuccess}
          onClose={() => setShowMFA(false)}
        />
      )}
    </>
  );
}

export default Login;
```

### 6. MFA Modal Component

```typescript
// src/components/MFAModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaSchema, type MFAFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MFAModalProps {
  onSuccess?: (token: string) => void;
  onClose: () => void;
}

export const MFAModal = ({ onSuccess, onClose }: MFAModalProps) => {
  const form = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema)
  });
  
  const onSubmit = async (data: MFAFormData) => {
    // Verify MFA code
    // On success, call onSuccess with token
    onSuccess?.('mfa-verified-token');
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4">Autenticação de Dois Fatores</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...form.register('code')}
            type="text"
            placeholder="Código de 6 dígitos"
            maxLength={6}
          />
          {form.formState.errors.code && (
            <p className="text-sm text-red-600">{form.formState.errors.code.message}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Verificar</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MFAModal;
```

## Testing

```typescript
// src/components/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api';
import Login from './Login';

describe('Login Component', () => {
  it('renders login form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Login />
      </QueryClientProvider>
    );
    
    expect(screen.getByPlaceholderText('CPF ou CNPJ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
  });
  
  it('shows validation errors', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Login />
      </QueryClientProvider>
    );
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/CPF\/CNPJ deve ter no mínimo/i)).toBeInTheDocument();
    });
  });
});
```

---

*This micro-frontend provides a secure, accessible login experience for PJ customers.*

