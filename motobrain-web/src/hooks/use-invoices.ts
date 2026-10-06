'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ApiListResponse } from '@/types/api.types';

export interface Invoice {
  id: string;
  invoiceNumber: number;
  closedAt: string;
  customerName?: string;
  placa?: string;
  mechanicName?: string;
  mechanicId?: string;
  total: number;
  discount: number;
  laborCost?: number;
  paymentMethod?: string;
  paymentReference?: string;
  warranty?: string;
  notes?: string;
}

export interface InvoiceEditPayload {
  mechanicId?: string;
  paymentMethod?: string;
  paymentReference?: string;
  warranty?: string;
  notes?: string;
  discount?: number;
  laborCost?: number;
}

async function refreshInvoices(qc: ReturnType<typeof useQueryClient>) {
  await qc.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' });
  void qc.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceEditPayload) => api.put(`/services/${id}`, data),
    onSuccess: () => refreshInvoices(qc),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/services/${id}`),
    onSuccess: () => refreshInvoices(qc),
  });
}

interface InvoiceListResponse extends ApiListResponse<Invoice> {
  totalRevenue: number;
}

interface InvoiceFilters {
  page?: number;
  limit?: number;
  q?: string;
  from?: string;
  to?: string;
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.q) params.set('q', filters.q);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => api.get<InvoiceListResponse>(`/services/invoices?${params.toString()}`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });
}
