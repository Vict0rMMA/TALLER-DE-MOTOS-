'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { Product } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';
import type { ProductInput } from '@/validators/product.schema';

export const PRODUCTS_KEY = ['products'] as const;

const PRODUCTS_STALE = 2 * 60_000;
const PRODUCTS_GC = 5 * 60_000;

function useAuthReady() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  return isHydrated && !!token;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

function productsQueryKey(filters: ProductFilters) {
  return [
    ...PRODUCTS_KEY,
    filters.page ?? 1,
    filters.limit ?? 20,
    filters.search ?? '',
    filters.category ?? '',
    filters.lowStock ?? false,
  ] as const;
}

export function useProducts(filters: ProductFilters = {}) {
  const authReady = useAuthReady();
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.lowStock) params.set('lowStock', 'true');

  return useQuery({
    queryKey: productsQueryKey(filters),
    queryFn: () =>
      api.get<ApiListResponse<Product>>(`/inventory?${params.toString()}`),
    staleTime: PRODUCTS_STALE,
    gcTime: PRODUCTS_GC,
    placeholderData: (prev) => prev,
    enabled: authReady,
  });
}

/** Resumen para KPIs de inventario — se cachea varios minutos */
export function useProductStatsSummary(enabled = true) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: [...PRODUCTS_KEY, 'stats-summary'],
    queryFn: () => api.get<ApiListResponse<Product>>('/inventory?limit=50&page=1'),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: authReady && enabled,
  });
}

export function useProduct(id: string) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => api.get<Product>(`/inventory/${id}`),
    enabled: authReady && !!id,
    staleTime: PRODUCTS_STALE,
  });
}

export function useLowStockProducts(limit = 50, enabled = true) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: [...PRODUCTS_KEY, 'low-stock', limit],
    queryFn: () => api.get<ApiListResponse<Product>>(`/inventory?lowStock=true&limit=${limit}`),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: authReady && enabled,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductInput) => api.post<Product>('/inventory', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductInput>) => api.put<Product>(`/inventory/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/inventory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
