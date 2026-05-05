import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { maskCpfCnpj } from '../lib/validations';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { loginSchema, LoginFormData } from '../types/auth';

interface LoginFormStepProps {
  onSuccessMfaRequired: (token: string) => void;
  onSuccessLogin: (token: string, user: any) => void;
  onLoginError?: (error: Error) => void;
}

export function LoginFormStep({ onSuccessMfaRequired, onSuccessLogin, onLoginError }: LoginFormStepProps) {
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { cpfCnpj: '', password: '' },
  });

  const loginMutation = useLoginMutation({
    onSuccessMfaRequired,
    onSuccessLogin,
    onError: (error) => {
      onLoginError?.(error);
    }
  });

  const onLoginSubmit = (values: LoginFormData) => loginMutation.mutate(values);

  return (
    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
          <Building2 className="w-4 h-4 text-slate-400" />
          CPF ou CNPJ
        </label>
        <Input
          {...loginForm.register('cpfCnpj', {
            onChange: (e) => {
              const masked = maskCpfCnpj(e.target.value);
              loginForm.setValue('cpfCnpj', masked);
            }
          })}
          placeholder="00.000.000/0000-00"
          disabled={loginMutation.isPending}
        />
        {loginForm.formState.errors.cpfCnpj && (
          <p className="text-xs text-red-500 font-medium">{loginForm.formState.errors.cpfCnpj.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Senha
        </label>
        <Input
          {...loginForm.register('password')}
          type="password"
          placeholder="Sua senha secreta"
          disabled={loginMutation.isPending}
        />
        {loginForm.formState.errors.password && (
          <p className="text-xs text-red-500 font-medium">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      {loginMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
          {loginMutation.error.message}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-11" 
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {loginMutation.isPending ? 'Entrando...' : 'Acessar Conta'}
      </Button>
    </form>
  );
}
