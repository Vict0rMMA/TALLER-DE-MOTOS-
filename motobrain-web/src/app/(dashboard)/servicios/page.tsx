'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceTable } from '@/components/services/ServiceTable';
import { useServices } from '@/hooks/use-services';
import { SERVICE_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ServiciosPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useServices({ page, limit: 20, status: status || undefined });
  const services = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios"
        description={`${pagination?.total ?? 0} órdenes de trabajo`}
        actions={
          <button
            onClick={() => router.push('/servicios/nuevo')}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nueva orden
          </button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setStatus(''); setPage(1); }}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
            status === '' ? 'bg-accent text-bg-primary border-accent' : 'border-border text-text-secondary hover:border-accent hover:text-accent',
          )}
        >
          Todos
        </button>
        {SERVICE_STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setStatus(s.id); setPage(1); }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
              status === s.id
                ? `bg-${s.color}/20 border-${s.color} text-${s.color}`
                : 'border-border text-text-secondary hover:border-accent hover:text-accent',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ServiceTable services={services} isLoading={isLoading} />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-text-secondary">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
