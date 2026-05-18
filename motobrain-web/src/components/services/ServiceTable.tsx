'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Service } from '@/types/entities';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { ServiceStatusBadge } from './ServiceStatusBadge';
import { SERVICE_TYPES } from '@/lib/constants';

interface ServiceTableProps {
  services: Service[];
  isLoading?: boolean;
}

export function ServiceTable({ services, isLoading }: ServiceTableProps) {
  const router = useRouter();

  function getServiceLabel(type: string) {
    return SERVICE_TYPES.find((s) => s.id === type)?.label ?? type;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-elevated" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
        <p className="text-sm">No hay servicios con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-border bg-bg-secondary p-4 active:bg-bg-elevated"
            onClick={() => router.push(`/servicios/${s.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary leading-snug">{s.customerName ?? '—'}</p>
                <p className="font-mono text-xs text-text-tertiary">{s.placa ?? '—'}</p>
              </div>
              <ServiceStatusBadge status={s.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-text-tertiary">Tipo</dt>
                <dd className="text-text-secondary">{getServiceLabel(s.type)}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Mecánico</dt>
                <dd className="text-text-secondary">{s.mechanicName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Fecha</dt>
                <dd className="text-text-secondary">
                  {new Date(s.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Total</dt>
                <dd className="font-semibold text-text-primary"><MoneyDisplay value={s.total} /></dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-bg-elevated">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Cliente / Moto</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">Mecánico</th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((s) => (
              <tr key={s.id} className="bg-bg-secondary transition-colors hover:bg-bg-elevated">
                <td className="px-4 py-3 text-text-tertiary">
                  {new Date(s.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{s.customerName ?? '—'}</div>
                  <div className="font-mono text-xs text-text-tertiary">{s.placa ?? '—'}</div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{getServiceLabel(s.type)}</td>
                <td className="px-4 py-3"><ServiceStatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-text-secondary">{s.mechanicName ?? '—'}</td>
                <td className="px-4 py-3 text-right"><MoneyDisplay value={s.total} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/servicios/${s.id}`)}
                    className="rounded p-1.5 text-text-secondary hover:bg-bg-primary hover:text-accent transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
