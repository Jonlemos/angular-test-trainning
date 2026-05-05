// apps/react-login-remote/src/api/auth.ts

export const API_URL = 'http://localhost:3001/api/auth';

export interface LoginPayload {
  cpfCnpj: string;
  password: string;
}

export interface VerifyMFAPayload {
  code: string;
  sessionToken: string;
}

export interface LoginResponse {
  token: string;
  user: any;
  requiresMFA?: boolean;
  sessionToken?: string;
  message?: string;
}

export const loginApi = async (values: LoginPayload): Promise<LoginResponse> => {
  // Limpa a máscara antes de enviar para o backend
  const payload = {
    ...values,
    cpfCnpj: values.cpfCnpj.replace(/\D/g, '')
  };

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.user_message || data.error?.message || 'Erro ao autenticar');
  }
  
  return data;
};

export const verifyMfaApi = async (values: VerifyMFAPayload): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Código inválido');
  }
  
  return data;
};
