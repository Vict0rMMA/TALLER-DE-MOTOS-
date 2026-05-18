import type { ServiceStatus } from '@/types/entities';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ServiceStatus, { label: string; cls: string }> = {
  open: { label: 'Abierto', cls: 'bg-info/10 text-info' },
  in_progress: { label: 'En progreso', cls: 'bg-warning/10 text-warning' },
  closed: { label: 'Cerrado', cls: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelado', cls: 'bg-danger/10 text-danger' },
};

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-bg-elevated text-text-tertiary' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.cls)}>
      {cfg.label}
    </span>
  );
}
