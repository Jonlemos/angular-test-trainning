// apps/react-login-remote/src/hooks/useAuthMutations.ts
import { useMutation } from '@tanstack/react-query';
import { loginApi, verifyMfaApi, LoginPayload, VerifyMFAPayload, LoginResponse } from '../api/auth';

interface UseAuthOptions {
  onSuccessMfaRequired: (sessionToken: string) => void;
  onSuccessLogin: (token: string, user: any) => void;
  onError: (error: Error) => void;
}

export function useLoginMutation({ onSuccessMfaRequired, onSuccessLogin, onError }: UseAuthOptions) {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      if (data.requiresMFA && data.sessionToken) {
        onSuccessMfaRequired(data.sessionToken);
      } else if (data.token) {
        onSuccessLogin(data.token, data.user);
      }
    },
    onError,
  });
}

export function useVerifyMfaMutation({ onSuccessLogin, onError }: Omit<UseAuthOptions, 'onSuccessMfaRequired'>) {
  return useMutation<LoginResponse, Error, VerifyMFAPayload>({
    mutationFn: verifyMfaApi,
    onSuccess: (data) => {
      if (data.token) {
        onSuccessLogin(data.token, data.user);
      }
    },
    onError,
  });
}
