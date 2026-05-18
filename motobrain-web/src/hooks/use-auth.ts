'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginResponse } from '@/types/api.types';
import type { LoginInput, RegisterInput } from '@/validators/auth.schema';

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginInput) => api.post<LoginResponse>('/auth/login', data),
    onSuccess: (res, variables) => {
      const user =
        res.user ??
        ({
          id: 'legacy',
          workshopId: '',
          name: variables.email.split('@')[0],
          email: variables.email,
          role: 'owner' as const,
          active: true,
          createdAt: new Date().toISOString(),
        } satisfies LoginResponse['user']);
      setAuth(user, res.token);
      toast.success(`Bienvenido, ${user.name}`);
      router.push('/');
      router.refresh();
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : 'Error al iniciar sesión';
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const { confirmPassword: _, ...payload } = data;
      void _;
      return api.post<LoginResponse>('/auth/signup', {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        workshopName: payload.workshopName,
        workshopNit: payload.workshopNit?.trim() || undefined,
        workshopPhone: payload.workshopPhone?.trim() || undefined,
        workshopAddress: payload.workshopAddress?.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      setAuth(res.user, res.token);
      toast.success(`Taller creado. Bienvenido, ${res.user.name}`);
      router.push('/');
      router.refresh();
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : 'No se pudo crear la cuenta';
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    logout();
    router.push('/login');
    router.refresh();
  };
}
