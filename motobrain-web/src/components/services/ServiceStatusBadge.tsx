import type { ServiceStatus } from '@/types/entities';
import { cn } from '@/lib/utils';

// Colores literales (no bg-info/10 ni similares): los tokens de color del
// tema son variables CSS en hex, y Tailwind no les puede aplicar opacidad
// con /10 — el fondo de la píldora quedaba invisible, solo se veía el texto.
const STATUS_CONFIG: Record<ServiceStatus, { label: string; dot: string; bg: string; text: string }> = {
  open: { label: 'Abierto', dot: 'bg-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.12)]', text: 'text-[#60a5fa]' },
  in_progress: { label: 'En progreso', dot: 'bg-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#fbbf24]' },
  closed: { label: 'Cerrado', dot: 'bg-[#22c55e]', bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#4ade80]' },
  cancelled: { label: 'Cancelado', dot: 'bg-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.12)]', text: 'text-[#f87171]' },
};

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-text-tertiary',
    bg: 'bg-bg-elevated',
    text: 'text-text-tertiary',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
