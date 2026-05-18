'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const WA_NOTIF_KEY = ['wa-notifications'] as const;

export interface WaNotificationRecord {
  id: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  phone: string;
  message: string;
  errorMsg?: string;
  customerId: string;
  customerName: string;
  serviceId?: string;
  createdAt: string;
}

export function useServiceNotifications(serviceId: string) {
  return useQuery({
    queryKey: [...WA_NOTIF_KEY, 'service', serviceId],
    queryFn: () =>
      api.get<{ total: number; data: WaNotificationRecord[] }>(`/notifications?serviceId=${serviceId}`),
    staleTime: 0,
    enabled: !!serviceId,
  });
}

export function useSendServiceNotification(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { templateId: string; extraParams?: Record<string, string> }) =>
      api.post<{ ok: boolean; id: string; status: string }>(`/notifications/service/${serviceId}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: WA_NOTIF_KEY }),
  });
}
