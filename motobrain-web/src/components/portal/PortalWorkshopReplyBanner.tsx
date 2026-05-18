'use client';

import { CheckCircle2, ChevronRight, X } from 'lucide-react';
import { usePortalAI } from '@/components/portal/PortalAIProvider';
import { usePortalUnreadReplies } from '@/hooks/use-portal-unread';
import { formatCop } from '@/components/portal/portal-shared';

export function PortalWorkshopReplyBanner() {
  const { openAI } = usePortalAI();
  const { latestUnread, unreadCount, markRepliesSeen } = usePortalUnreadReplies();

  if (!latestUnread?.mechanicResponse) return null;

  function openAndRead() {
    markRepliesSeen();
    openAI();
  }

  function dismiss() {
    markRepliesSeen();
  }

  return (
    <div className="portal-card relative overflow-hidden border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Ocultar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-400">
            El taller respondió tu consulta
            {unreadCount > 1 ? ` (+${unreadCount - 1} más)` : ''}
          </p>
          <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-zinc-200">
            {latestUnread.mechanicResponse}
          </p>
          {latestUnread.mechanicPrice != null && (
            <p className="mt-2 text-sm font-semibold text-white">
              Precio confirmado: {formatCop(latestUnread.mechanicPrice)}
            </p>
          )}
          <button
            type="button"
            onClick={openAndRead}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Ver conversación completa
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
