import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useVerifyMfaMutation } from '../hooks/useAuthMutations';
import { mfaSchema, MFAFormData } from '../types/auth';

interface MfaFormStepProps {
  sessionToken: string;
  onSuccessLogin: (token: string, user: any) => void;
  onBack: () => void;
  onLoginError?: (error: Error) => void;
}

export function MfaFormStep({ sessionToken, onSuccessLogin, onBack, onLoginError }: MfaFormStepProps) {
  const mfaForm = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  const mfaMutation = useVerifyMfaMutation({
    onSuccessLogin,
    onError: (error) => {
      onLoginError?.(error);
    }
  });

  const onMFASubmit = (values: MFAFormData) => mfaMutation.mutate({ code: values.code, sessionToken });

  return (
    <form onSubmit={mfaForm.handleSubmit(onMFASubmit)} className="space-y-4">
      <div className="space-y-2 text-center">
        <Input
          {...mfaForm.register('code')}
          placeholder="000000"
          maxLength={6}
          className="text-center text-3xl tracking-[0.5em] h-16 font-bold text-secondary"
          disabled={mfaMutation.isPending}
          autoFocus
        />
        {mfaForm.formState.errors.code && (
          <p className="text-xs text-red-500 font-medium">{mfaForm.formState.errors.code.message}</p>
        )}
      </div>

      {mfaMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
          {mfaMutation.error.message}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-11" 
        disabled={mfaMutation.isPending}
      >
        {mfaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {mfaMutation.isPending ? 'Verificando...' : 'Confirmar Código'}
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        className="w-full text-secondary hover:text-primary transition-colors" 
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para o login
      </Button>
    </form>
  );
}
