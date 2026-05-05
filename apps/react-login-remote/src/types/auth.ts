import * as z from 'zod';
import { validateCNPJ, validateCPF } from '../lib/validations';

export const loginSchema = z.object({
  cpfCnpj: z.string()
    .min(11, 'Documento muito curto')
    .max(18, 'Documento muito longo') // Considera a máscara
    .refine((val) => {
      const pure = val.replace(/\D/g, '');
      if (pure.length === 11) return validateCPF(pure);
      if (pure.length === 14) return validateCNPJ(pure);
      return false;
    }, {
      message: 'CPF ou CNPJ inválido',
    }),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const mfaSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type MFAFormData = z.infer<typeof mfaSchema>;

export interface LoginProps {
  onLoginSuccess?: (token: string, user: any) => void;
  onLoginError?: (error: Error) => void;
}
