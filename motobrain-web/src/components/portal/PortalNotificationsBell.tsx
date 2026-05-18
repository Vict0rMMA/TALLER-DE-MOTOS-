'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, MessageSquare } from 'lucide-react';
import { usePortalAI } from '@/components/portal/PortalAIProvider';
import { usePortalUnreadReplies } from '@/hooks/use-portal-unread';
import { cn } from '@/lib/utils';

function fmtWhen(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PortalNotificationsBell() {
  const { openAI } = usePortalAI();
  const [open, setOpen] = useState(false);
  const { workshopReplies, unreadCount, markRepliesSeen } = usePortalUnreadReplies();

  function openChat() {
    markRepliesSeen();
    setOpen(false);
    openAI();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) markRepliesSeen();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="text-sm font-semibold text-white">Notificaciones</p>
              <p className="mt-0.5 text-xs text-zinc-500">Respuestas del taller</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {workshopReplies.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-zinc-600" />
                  <p className="mt-2 text-sm text-zinc-500">Sin respuestas nuevas</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800/80">
                  {workshopReplies.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={openChat} className="w-full px-4 py-3 text-left hover:bg-zinc-800/60">
                        <div className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm text-zinc-200">{c.mechanicResponse}</p>
                            {c.respondedAt && (
                              <p className="mt-1 text-[11px] text-zinc-500">{fmtWhen(c.respondedAt)}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {workshopReplies.length > 0 && (
              <div className="border-t border-zinc-800 p-2">
                <button
                  type="button"
                  onClick={openChat}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-center text-sm font-medium text-emerald-400',
                    'hover:bg-emerald-500/10',
                  )}
                >
                  Ver en Hablar con la IA
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
