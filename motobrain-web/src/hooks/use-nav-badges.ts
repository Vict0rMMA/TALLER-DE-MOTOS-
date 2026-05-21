'use client';

import { useEffect, useState } from 'react';
import { useDashboardKPIs } from '@/hooks/use-analytics';

export interface NavBadges {
  lowStock: number;
  consultations: number;
  appointments: number;
}

const selectBadges = (d: {
  lowStockCount: number;
  pendingConsultations?: number;
  pendingAppointments?: number;
}): NavBadges => ({
  lowStock: d.lowStockCount ?? 0,
  consultations: d.pendingConsultations ?? 0,
  appointments: d.pendingAppointments ?? 0,
});

/** Badges del menú — reutiliza KPIs cacheados; carga diferida para no competir con la página. */
export function useNavBadges(deferMs = 1200) {
  const [ready, setReady] = useState(deferMs <= 0);

  useEffect(() => {
    if (deferMs <= 0) return;
    const id = window.setTimeout(() => setReady(true), deferMs);
    return () => clearTimeout(id);
  }, [deferMs]);

  return useDashboardKPIs({
    enabled: ready,
    select: selectBadges,
  });
}
