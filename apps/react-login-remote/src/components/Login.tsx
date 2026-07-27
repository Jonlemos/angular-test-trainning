// apps/react-login-remote/src/components/Login.tsx
import { useState, useTransition, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { LoginProps } from '../types/auth';
import '../index.css';

// React 19: Lazy loading de componentes para code-splitting
const LoginFormStep = lazy(() => import('./LoginFormStep').then(m => ({ default: m.LoginFormStep })));
const MfaFormStep = lazy(() => import('./MfaFormStep').then(m => ({ default: m.MfaFormStep })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Skeleton de carregamento super leve para o Suspense
function FormSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      <p className="text-sm text-slate-500 animate-pulse">Carregando módulo...</p>
    </div>
  );
}

function LoginScreen({ onLoginSuccess, onLoginError }: LoginProps) {
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  
  // React 19: useTransition para transições de tela suaves sem travar a UI
  const [isPending, startTransition] = useTransition();

  const handleMfaRequired = (token: string) => {
    startTransition(() => {
      setSessionToken(token);
      setMfaRequired(true);
    });
  };

  const handleSuccessLogin = (token: string, user: any) => {
    onLoginSuccess?.(token, user);
  };

  const handleBackToLogin = () => {
    startTransition(() => {
      setMfaRequired(false);
      setSessionToken('');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary transition-all duration-300">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-secondary text-white font-bold text-2xl w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            Banco
          </div>
          <CardTitle className="text-2xl text-secondary flex items-center justify-center gap-2">
            {mfaRequired && <ShieldCheck className="w-6 h-6 text-primary" />}
            {mfaRequired ? 'Segurança' : 'Acesso Banco PJ'}
          </CardTitle>
          <CardDescription>
            {mfaRequired 
              ? 'Insira o código de 6 dígitos enviado' 
              : 'Gerencie seu negócio com agilidade'}
          </CardDescription>
        </CardHeader>
        <CardContent className={isPending ? 'opacity-70 pointer-events-none transition-opacity' : 'transition-opacity'}>
          <Suspense fallback={<FormSkeleton />}>
            {!mfaRequired ? (
              <LoginFormStep 
                onSuccessMfaRequired={handleMfaRequired} 
                onSuccessLogin={handleSuccessLogin}
                onLoginError={onLoginError} 
              />
            ) : (
              <MfaFormStep 
                sessionToken={sessionToken} 
                onSuccessLogin={handleSuccessLogin} 
                onBack={handleBackToLogin}
                onLoginError={onLoginError}
              />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper com QueryClient
function Login(props: LoginProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <LoginScreen {...props} />
    </QueryClientProvider>
  );
}

// 🚀 EXPORTA A FUNÇÃO DE MOUNT (Agnóstico)
import { createRoot } from 'react-dom/client';

export function mount(element: HTMLElement, props: LoginProps) {
  const root = createRoot(element);
  root.render(<Login {...props} />);
  
  return {
    unmount: () => {
      setTimeout(() => root.unmount(), 0);
    }
  };
}

export default Login;
export { Login };