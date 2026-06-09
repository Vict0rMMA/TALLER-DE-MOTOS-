'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Customer } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { CustomerInput } from '@/validators/customer.schema';

export const CUSTOMERS_KEY = ['customers'] as const;

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export function useCustomers(filters: CustomerFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);

  return useQuery({
    queryKey: [...CUSTOMERS_KEY, filters],
    queryFn: () => api.get<ApiListResponse<Customer>>(`/customers?${params.toString()}`),
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerInput) => api.post<Customer>('/customers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerInput>) => api.put<Customer>(`/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

