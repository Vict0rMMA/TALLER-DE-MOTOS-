'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Wrench, CheckCircle2, ArrowLeft } from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';
import {
  type PortalService,
  PortalStatusBadge,
  formatCop,
  formatPortalDate,
} from '@/components/portal/portal-shared';
import { formatServiceLabel } from '@/lib/utils';

const SERVICE_STEPS = ['open', 'in_progress', 'closed'];

interface DashData {
  services: PortalService[];
}

export default function PortalServiciosPage() {
  const [historyLimit, setHistoryLimit] = useState(5);

  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['portal-dashboard'],
    queryFn: () => portalApi.get<DashData>('/dashboard'),
    staleTime: 30_000,
  });

  const services = data?.services ?? [];
  const active = services.filter((s) => s.status === 'open' || s.status === 'in_progress');
  const history = services.filter((s) => s.status === 'closed' || s.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/portal"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Servicios</h1>
          <p className="text-xs text-zinc-500">Tus servicios en el taller e historial</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-12 text-center">
          <Wrench className="mx-auto mb-3 h-8 w-8 text-zinc-600" strokeWidth={1.5} />
          <p className="font-medium text-zinc-300">Aún no tienes servicios</p>
          <p className="mt-1 text-sm text-zinc-600">Cuando lleves tu moto al taller, aparecerán aquí.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-white">En el taller ahora</h2>
              <div className="space-y-3">
                {active.map((s) => {
                  const stepIdx = SERVICE_STEPS.indexOf(s.status);
                  return (
                    <Link
                      key={s.id}
                      href={`/portal/servicios/${s.id}`}
                      className="block overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 p-4 transition-all hover:border-amber-500/35 active:scale-[.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{formatServiceLabel(s.type)}</p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {s.motorcycle.placa} · {s.motorcycle.brand} {s.motorcycle.model}
                          </p>
                        </div>
                        <PortalStatusBadge status={s.status} />
                      </div>
                      <div className="mt-3 flex gap-1">
                        {SERVICE_STEPS.slice(0, -1).map((step, i) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-amber-400' : 'bg-zinc-700/80'}`}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-zinc-600">
                        <span>Recibida</span><span>En taller</span><span>Lista</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Historial de servicios</h2>
                <span className="text-xs text-zinc-500">{history.length} en total</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
                {history.slice(0, historyLimit).map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/portal/servicios/${s.id}`}
                    className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800 ${i !== 0 ? 'border-t border-zinc-800/80' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400/70" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{formatServiceLabel(s.type)}</p>
                        <p className="text-[11px] text-zinc-500">
                          {s.motorcycle.placa} · {formatPortalDate(s.closedAt ?? s.serviceDate)}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-white">{formatCop(s.totalCost)}</p>
                  </Link>
                ))}
                {history.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setHistoryLimit((n) => (n >= history.length ? 5 : n + 5))}
                    className="flex w-full items-center justify-center border-t border-zinc-800/80 px-4 py-3 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-800/40"
                  >
                    {historyLimit >= history.length
                      ? 'Ver menos'
                      : `Ver ${Math.min(5, history.length - historyLimit)} más`}
                  </button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
