'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Package, Wrench, MessageCircle, X } from 'lucide-react';
import { useNotifications, type AppNotification } from '@/hooks/use-notifications';

const SEVERITY_STYLES: Record<AppNotification['severity'], string> = {
  error: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-accent/20 bg-accent/5',
};

const SEVERITY_ICON_STYLES: Record<AppNotification['severity'], string> = {
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-accent',
};

const TYPE_ICONS: Record<AppNotification['type'], React.ElementType> = {
  whatsapp: MessageCircle,
  stock: Package,
  maintenance: Wrench,
};

function NotificationItem({ n }: { n: AppNotification }) {
  const Icon = TYPE_ICONS[n.type];
  return (
    <div className={`flex gap-3 rounded-lg border p-3 ${SEVERITY_STYLES[n.severity]}`}>
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${SEVERITY_ICON_STYLES[n.severity]}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{n.title}</p>
        <p className="mt-0.5 text-xs text-text-tertiary leading-relaxed">{n.body}</p>
      </div>
    </div>
  );
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unread } = useNotifications();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-bg-elevated transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-text-secondary" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[10px] font-medium text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-bg-secondary shadow-xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">Notificaciones</span>
            {unread > 0 && (
              <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                {unread} alerta{unread > 1 ? 's' : ''}
              </span>
            )}
            <button onClick={() => setOpen(false)} className="ml-auto text-text-tertiary hover:text-text-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="h-8 w-8 text-text-tertiary/40" />
                <p className="text-sm text-text-tertiary">Todo en orden — sin alertas</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} n={n} />)
            )}
          </div>

          {notifications.some((n) => n.type === 'whatsapp') && (
            <div className="border-t border-border px-4 py-3">
              <a
                href="/configuracion"
                onClick={() => setOpen(false)}
                className="block w-full rounded-lg bg-accent/10 px-3 py-2 text-center text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                Ir a Configuración → conectar WhatsApp
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
