import type React from 'react';
import { Clock, Wrench, CheckCircle2, XCircle } from 'lucide-react';

export interface PortalMotorcycle {
  id: string;
  placa: string;
  brand: string;
  model: string;
  cc: number;
  year: number | null;
  kmCurrent: number;
  imageUrl?: string | null;
}

export interface PortalWorkshop {
  name: string;
  phone: string | null;
  address: string | null;
}

export interface PortalService {
  id: string;
  type: string;
  description: string | null;
  status: string;
  serviceDate: string;
  closedAt: string | null;
  laborCost: number;
  totalCost: number;
  motorcycle: { placa: string; brand: string; model: string };
}

export const PORTAL_STATUS: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  open: {
    label: 'Recibida',
    icon: Clock,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  in_progress: {
    label: 'En taller',
    icon: Wrench,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  closed: {
    label: 'Entregado',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-zinc-500',
    bg: 'bg-zinc-800/80 border-zinc-700/60',
  },
};

export function formatCop(n: number) {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

export function formatPortalDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PortalStatusBadge({ status }: { status: string }) {
  const cfg = PORTAL_STATUS[status] ?? PORTAL_STATUS.open;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}
