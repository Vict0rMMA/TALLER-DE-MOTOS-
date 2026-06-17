'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Service } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { ServiceInput } from '@/validators/service.schema';

export const SERVICES_KEY = ['services'] as const;

/** La API a veces devuelve totalCost; el panel espera total. */
export function normalizeService(raw: Service & { totalCost?: number }): Service {
  const opened =
    raw.openedAt ??
    (raw as { serviceDate?: string }).serviceDate ??
    raw.createdAt;
  return {
    ...raw,
    total: Number(raw.total ?? raw.totalCost ?? 0),
    laborCost: Number(raw.laborCost ?? 0),
    openedAt: typeof opened === 'string' ? opened : new Date(opened as string).toISOString(),
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : new Date(raw.createdAt as string).toISOString(),
    products: raw.products ?? [],
  };
}

function matchesListFilter(filters: ServiceFilters | undefined, service: Service): boolean {
  if (!filters?.status) return true;
  return service.status === filters.status;
}

function prependServiceToLists(qc: QueryClient, service: Service) {
  const normalized = normalizeService(service as Service & { totalCost?: number });
  qc.setQueriesData<ApiListResponse<Service>>({
    predicate: (query) => {
      if (query.queryKey[0] !== SERVICES_KEY[0]) return false;
      const filters = query.queryKey[1] as ServiceFilters | undefined;
      const page = filters?.page ?? 1;
      return page === 1 && matchesListFilter(filters, normalized);
    },
  }, (old) => {
    if (!old?.data) return old;
    if (old.data.some((s) => s.id === normalized.id)) return old;
    return {
      ...old,
      data: [normalized, ...old.data],
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
    mutationFn: async (data: ServiceInput) => {
      const { customerId: _, ...payload } = data as any;
      const created = await api.post<Service & { totalCost?: number }>('/services', payload);
      return normalizeService(created);
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

export interface CloseServicePayload {
  laborCost?: number;
  mechanicId?: string;
  paymentMethod?: string;
  paymentReference?: string;
  warranty?: string;
  notes?: string;
  discount?: number;
}

export function useCloseService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CloseServicePayload = {}) =>
      api.post<Service>(`/services/${id}/close`, payload),
    onSuccess: () => void refreshServices(qc),
  });
}
