'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardKPIs, TopProduct, RevenueByMonth } from '@/types/api.types';

function useAuthReady() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  return isHydrated && !!token;
}

export function useDashboardKPIs<TData = DashboardKPIs>(
  options?: Omit<UseQueryOptions<DashboardKPIs, Error, TData>, 'queryKey' | 'queryFn'>,
) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => api.get<DashboardKPIs>('/analytics/kpis'),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: authReady,
    ...options,
  });
}

export function useTopProducts(limit = 5) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: ['analytics', 'top-products', limit],
    queryFn: () => api.get<TopProduct[]>(`/analytics/top-products?limit=${limit}`),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: authReady,
  });
}

export function useRevenueByMonth(months = 6) {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: ['analytics', 'revenue', months],
    queryFn: () => api.get<RevenueByMonth[]>(`/analytics/revenue?months=${months}`),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: authReady,
  });
}
