'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Motorcycle } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { MotorcycleInput } from '@/validators/motorcycle.schema';

export const MOTORCYCLES_KEY = ['motorcycles'] as const;

export function useMotorcyclesByCustomer(customerId: string) {
  return useQuery({
    queryKey: [...MOTORCYCLES_KEY, 'customer', customerId],
    queryFn: () =>
      api.get<ApiListResponse<Motorcycle>>(`/motorcycles/customer/${customerId}`),
    enabled: !!customerId,
  });
}

export function useMotorcycle(id: string) {
  return useQuery({
    queryKey: [...MOTORCYCLES_KEY, id],
    queryFn: () => api.get<Motorcycle>(`/motorcycles/${id}`),
    enabled: !!id,
  });
}

export function useCreateMotorcycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MotorcycleInput) => api.post<Motorcycle>('/motorcycles', data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: MOTORCYCLES_KEY });
      qc.invalidateQueries({ queryKey: ['customers', variables.customerId] });
    },
  });
}

export function useUpdateMotorcycle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MotorcycleInput>) =>
      api.put<Motorcycle>(`/motorcycles/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOTORCYCLES_KEY }),
  });
}

export function useDeleteMotorcycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/motorcycles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: MOTORCYCLES_KEY }),
  });
}
