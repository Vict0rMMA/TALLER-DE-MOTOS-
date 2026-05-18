'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Service } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { ServiceInput } from '@/validators/service.schema';

export const SERVICES_KEY = ['services'] as const;

interface ServiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  mechanicId?: string;
}

export function useServices(filters: ServiceFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.mechanicId) params.set('mechanicId', filters.mechanicId);

  return useQuery({
    queryKey: [...SERVICES_KEY, filters],
    queryFn: () => api.get<ApiListResponse<Service>>(`/services?${params.toString()}`),
    staleTime: 0,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: [...SERVICES_KEY, id],
    queryFn: () => api.get<Service>(`/services/${id}`),
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceInput) => {
      const { customerId: _, ...payload } = data as any;
      return api.post<Service>('/services', payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useUpdateServiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string }) => api.put<Service>(`/services/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useCloseService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Service>(`/services/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}
