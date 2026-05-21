'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Service } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { ServiceInput } from '@/validators/service.schema';

export const SERVICES_KEY = ['services'] as const;

function matchesListFilter(filters: ServiceFilters | undefined, service: Service): boolean {
  if (!filters?.status) return true;
  return service.status === filters.status;
}

function prependServiceToLists(qc: QueryClient, service: Service) {
  qc.setQueriesData<ApiListResponse<Service>>({
    predicate: (query) => {
      if (query.queryKey[0] !== SERVICES_KEY[0]) return false;
      const filters = query.queryKey[1] as ServiceFilters | undefined;
      const page = filters?.page ?? 1;
      return page === 1 && matchesListFilter(filters, service);
    },
  }, (old) => {
    if (!old?.data) return old;
    if (old.data.some((s) => s.id === service.id)) return old;
    return {
      ...old,
      data: [service, ...old.data],
      pagination: old.pagination
        ? { ...old.pagination, total: old.pagination.total + 1 }
        : old.pagination,
    };
  });
}

async function refreshServices(qc: QueryClient) {
  await qc.invalidateQueries({ queryKey: SERVICES_KEY, refetchType: 'all' });
  void qc.invalidateQueries({ queryKey: ['analytics', 'kpis'] });
}

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
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
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
    onSuccess: (service) => {
      prependServiceToLists(qc, service);
      void refreshServices(qc);
    },
  });
}

export function useUpdateServiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string }) => api.put<Service>(`/services/${id}`, data),
    onSuccess: () => void refreshServices(qc),
  });
}

export function useCloseService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Service>(`/services/${id}/close`, {}),
    onSuccess: () => void refreshServices(qc),
  });
}
