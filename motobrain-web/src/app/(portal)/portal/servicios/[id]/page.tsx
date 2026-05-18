'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, Wrench, CheckCircle2, XCircle, User,
  Bike, Calendar, Gauge, AlertCircle, Package,
} from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';
import { usePortalAuthStore } from '@/stores/portal-auth-store';

interface ServiceProduct { name: string; brand: string | null; quantity: number; unitPrice: number; subtotal: number; }
interface ServiceDetail {
  id: string; type: string; description: string | null; status: string;
  serviceDate: string; closedAt: string | null;
  laborCost: number; totalCost: number; kmAtService: number;
  nextMaintenanceKm: number | null; nextMaintenanceDate: string | null;
  motorcycle: { placa: string; brand: string; model: string };
  mechanic: string | null;
  products: ServiceProduct[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  open:        { label: 'Recibida',          icon: Clock,         color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  in_progress: { label: 'En taller',         icon: Wrench,        color: 'text-warning',     bg: 'bg-warning/10 border-warning/20' },
  closed:      { label: 'Lista / Entregada', icon: CheckCircle2,  color: 'text-success',     bg: 'bg-success/10 border-success/20' },
  cancelled:   { label: 'Cancelada',         icon: XCircle,       color: 'text-text-tertiary', bg: 'bg-bg-elevated border-border' },
};

const STEPS = [
  { key: 'open', label: 'Recibida' },
  { key: 'in_progress', label: 'En taller' },
  { key: 'closed', label: 'Lista' },
];

function cop(n: number) {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PortalServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, isHydrated } = usePortalAuthStore();

  useEffect(() => {
    if (isHydrated && !token) router.replace('/login?tab=cliente');
  }, [isHydrated, token, router]);

  const { data: service, isLoading, isError } = useQuery<ServiceDetail>({
    queryKey: ['portal-service', params.id],
    queryFn: () => portalApi.get<ServiceDetail>(`/services/${params.id}`),
    enabled: !!token,
  });

  if (!isHydrated || !token) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
        <div className="portal-card h-48 animate-pulse" />
        <div className="portal-card h-32 animate-pulse" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <AlertCircle className="h-12 w-12 text-red-400/50" strokeWidth={1.5} />
        <p className="text-sm text-zinc-400">Servicio no encontrado.</p>
        <Link href="/portal" className="text-sm text-emerald-400 hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.open;
  const Icon = cfg.icon;
  const stepIdx = service.status === 'cancelled' ? -1 : STEPS.findIndex((s) => s.key === service.status);
  const partsTotal = service.products.reduce((s, p) => s + p.subtotal, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/portal#servicios"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

        <div className="portal-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-text-primary">{service.type}</h1>
              <p className="text-sm text-text-tertiary mt-0.5">
                {service.motorcycle.placa} · {service.motorcycle.brand} {service.motorcycle.model}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${cfg.color} ${cfg.bg}`}>
              <Icon className="h-3.5 w-3.5" /> {cfg.label}
            </span>
          </div>

          {service.status !== 'cancelled' && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {STEPS.map((step, i) => (
                  <div key={step.key} className="flex-1">
                    <div className={`h-2 rounded-full transition-colors ${i <= stepIdx ? 'bg-accent' : 'bg-bg-elevated'}`} />
                    <p className={`mt-1.5 text-center text-[10px] font-medium ${i <= stepIdx ? 'text-accent' : 'text-text-tertiary'}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="portal-card p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Detalles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-text-tertiary shrink-0" />
              <div>
                <p className="text-xs text-text-tertiary">Fecha de ingreso</p>
                <p className="text-sm font-medium text-text-primary capitalize">{fmtDate(service.serviceDate)}</p>
              </div>
            </div>
            {service.closedAt && (
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div>
                  <p className="text-xs text-text-tertiary">Fecha de entrega</p>
                  <p className="text-sm font-medium text-text-primary capitalize">{fmtDate(service.closedAt)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Gauge className="h-4 w-4 text-text-tertiary shrink-0" />
              <div>
                <p className="text-xs text-text-tertiary">Kilometraje al ingreso</p>
                <p className="text-sm font-medium text-text-primary">{service.kmAtService.toLocaleString('es-CO')} km</p>
              </div>
            </div>
            {service.mechanic && (
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-text-tertiary shrink-0" />
                <div>
                  <p className="text-xs text-text-tertiary">Mecánico</p>
                  <p className="text-sm font-medium text-text-primary">{service.mechanic}</p>
                </div>
              </div>
            )}
          </div>
          {service.description && (
            <div className="rounded-lg bg-bg-elevated px-3.5 py-3 mt-2">
              <p className="text-xs text-text-tertiary mb-1">Descripción</p>
              <p className="text-sm text-text-primary">{service.description}</p>
            </div>
          )}
        </div>

        {(service.nextMaintenanceKm || service.nextMaintenanceDate) && (
          <div className="portal-card p-4 border-accent/20 bg-accent/5 space-y-1">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Próximo mantenimiento</p>
            <div className="flex flex-wrap gap-4 mt-1">
              {service.nextMaintenanceKm && (
                <p className="text-sm text-text-primary">
                  <span className="text-text-tertiary">Km: </span>
                  <span className="font-semibold">{service.nextMaintenanceKm.toLocaleString('es-CO')} km</span>
                </p>
              )}
              {service.nextMaintenanceDate && (
                <p className="text-sm text-text-primary">
                  <span className="text-text-tertiary">Fecha: </span>
                  <span className="font-semibold capitalize">
                    {new Date(service.nextMaintenanceDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {service.products.length > 0 && (
          <div className="portal-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <Package className="h-4 w-4 text-text-tertiary" />
              <h2 className="text-sm font-semibold text-text-primary">Repuestos utilizados</h2>
            </div>
            <div className="divide-y divide-border">
              {service.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 bg-bg-secondary">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium">{p.name}</p>
                    {p.brand && <p className="text-xs text-text-tertiary">{p.brand}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-text-primary">{cop(p.subtotal)}</p>
                    <p className="text-xs text-text-tertiary">{p.quantity} × {cop(p.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {((service as any).photos as string[] | undefined)?.length ? (
          <div className="portal-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-text-primary">Fotos del servicio</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {((service as any).photos as string[]).map((url: string) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg bg-zinc-800">
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="portal-card p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Resumen de costos</h2>
          <div className="space-y-2">
            {service.products.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Repuestos</span>
                <span className="font-medium text-text-primary">{cop(partsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Mano de obra</span>
              <span className="font-medium text-text-primary">{cop(service.laborCost)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-base font-bold text-accent">{cop(service.totalCost)}</span>
            </div>
          </div>
        </div>

    </div>
  );
}
