'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal-api-client';
import { usePortalAuthStore } from '@/stores/portal-auth-store';

export const PORTAL_SEEN_KEY = 'portal-consultations-seen-at';

export interface PortalConsultation {
  id: string;
  symptom: string;
  aiResponse?: string;
  mechanicResponse: string | null;
  mechanicPrice?: number | null;
  respondedAt: string | null;
  status?: string;
  createdAt: string;
}

export function usePortalConsultations() {
  const { token } = usePortalAuthStore();

  return useQuery<PortalConsultation[]>({
    queryKey: ['portal-consultations'],
    queryFn: () => portalApi.get<PortalConsultation[]>('/consultations'),
    enabled: !!token,
    staleTime: 60_000,
    refetchInterval: 90_000,
    refetchIntervalInBackground: false,
  });
}

export function usePortalUnreadReplies() {
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const { data: consultations = [] } = usePortalConsultations();

  useEffect(() => {
    setSeenAt(localStorage.getItem(PORTAL_SEEN_KEY));
  }, []);

  const workshopReplies = useMemo(
    () => consultations.filter((c) => c.mechanicResponse && c.respondedAt),
    [consultations],
  );

  const unread = useMemo(() => {
    if (!seenAt) return workshopReplies;
    const seen = new Date(seenAt).getTime();
    return workshopReplies.filter((c) => new Date(c.respondedAt!).getTime() > seen);
  }, [workshopReplies, seenAt]);

  const latestUnread = unread[0] ?? null;

  function markRepliesSeen() {
    const now = new Date().toISOString();
    localStorage.setItem(PORTAL_SEEN_KEY, now);
    setSeenAt(now);
  }

  return { workshopReplies, unread, latestUnread, markRepliesSeen, unreadCount: unread.length };
}
