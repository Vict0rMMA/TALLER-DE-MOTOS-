'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { DashboardKPIs } from '@/types/api.types';

export interface AppNotification {
  id: string;
  type: 'whatsapp' | 'stock' | 'maintenance';
  title: string;
  body: string;
  severity: 'warning' | 'error' | 'info';
}

interface WhatsAppStatus {
  isReady: boolean;
  hasQr: boolean;
  qr: string | null;
  error: string | null;
}

interface UpcomingService {
  id: string;
  motorcycleId: string;
  nextMaintenanceDate?: string;
  nextMaintenanceKm?: number;
  placa?: string;
  customerName?: string;
}

const WHATSAPP_KEY = ['whatsapp', 'status'] as const;

type WhatsAppQueryOptions = {
  /** Polling activo (p. ej. pantalla de configuración con QR) */
  poll?: boolean;
  pollMs?: number;
};

export function useWhatsAppStatus(options?: WhatsAppQueryOptions) {
  return useQuery({
    queryKey: WHATSAPP_KEY,
    queryFn: () => api.get<WhatsAppStatus>('/whatsapp/status'),
    staleTime: 30_000,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      if (!options?.poll) return false;
      const interval = options.pollMs ?? 8_000;
      return query.state.data?.isReady ? false : interval;
    },
  });
}

export async function restartWhatsAppClient(deleteSession = false): Promise<void> {
  await api.post(`/whatsapp/restart${deleteSession ? '?force=true' : ''}`, {});
}

/** Alertas del panel — sin polling agresivo de WhatsApp */
export function useNotifications(enabled = true) {
  const { data: kpis } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => api.get<DashboardKPIs>('/analytics/kpis'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
    enabled,
  });

  const { data: whatsapp } = useQuery({
    queryKey: WHATSAPP_KEY,
    queryFn: () => api.get<WhatsAppStatus>('/whatsapp/status'),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    enabled,
    refetchInterval: false,
    refetchOnMount: false,
  });

  const { data: maintenance } = useQuery({
    queryKey: ['services', 'upcoming-maintenance'],
    queryFn: () => api.get<UpcomingService[]>('/services/upcoming-maintenance?days=7'),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    enabled,
    refetchInterval: false,
    refetchOnMount: false,
  });

  const notifications: AppNotification[] = [];

  if (whatsapp && !whatsapp.isReady) {
    notifications.push({
      id: 'whatsapp-disconnected',
      type: 'whatsapp',
      title: 'WhatsApp desconectado',
      body: whatsapp.hasQr
        ? 'Hay un QR listo — ve a Configuración para escanearlo.'
        : 'El cliente no está activo. Reinicia el backend.',
      severity: 'warning',
    });
  }

  if (kpis && kpis.lowStockCount > 0) {
    notifications.push({
      id: 'low-stock',
      type: 'stock',
      title: `${kpis.lowStockCount} producto${kpis.lowStockCount > 1 ? 's' : ''} con stock bajo`,
      body: 'Revisa el inventario y reabastecer antes de quedarte sin repuestos.',
      severity: kpis.lowStockCount >= 5 ? 'error' : 'warning',
    });
  }

  const upcoming = Array.isArray(maintenance) ? maintenance : [];
  upcoming.slice(0, 3).forEach((s) => {
    const label = s.placa ?? s.motorcycleId.slice(-6);
    notifications.push({
      id: `maint-${s.id}`,
      type: 'maintenance',
      title: `Mantenimiento próximo — ${label}`,
      body: `${s.customerName ?? 'Cliente'} tiene servicio programado en los próximos 7 días.`,
      severity: 'info',
    });
  });

  return { notifications, unread: notifications.length };
}
