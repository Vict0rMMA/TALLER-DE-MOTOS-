'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt, Search, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useInvoices } from '@/hooks/use-invoices';
import { useAuthStore } from '@/stores/auth-store';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export default function FacturasPage() {
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useInvoices({ page, limit: 20, q: search || undefined, from: from || undefined, to: to || undefined });
  const invoices = data?.data ?? [];
  const pagination = data?.pagination;
  const totalRevenue = data?.totalRevenue ?? 0;

  if (user && user.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <Receipt className="h-12 w-12 text-text-tertiary/30" strokeWidth={1.5} />
        <p className="text-lg font-semibold text-text-primary">Acceso restringido</p>
        <p className="text-sm text-text-tertiary max-w-xs">
          El historial de facturas es exclusivo para el propietario del taller.
        </p>
      </div>
    );
  }

  function applySearch() {
    setSearch(q.trim());
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Facturas" description={`${pagination?.total ?? 0} facturas emitidas`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <KPICard title="Facturas (filtro actual)" value={pagination?.total ?? 0} icon={FileText} variant="default" />
        <KPICard title="Total facturado" value={<MoneyDisplay value={totalRevenue} responsive={false} />} icon={Receipt} variant="accent" />
      </div>

      <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-text-tertiary">Cliente o placa</label>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
            <button
              onClick={applySearch}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-text-secondary hover:border-accent hover:text-accent transition-colors"
              title="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-elevated" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
          <Receipt className="h-10 w-10 text-text-tertiary/30" strokeWidth={1.5} />
          <p className="text-sm">No hay facturas con los filtros actuales.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/recibo/${inv.id}`}
                className="block rounded-xl border border-border bg-bg-secondary p-4 active:bg-bg-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary leading-snug">{inv.customerName ?? '—'}</p>
                    <p className="font-mono text-xs text-text-tertiary">{inv.placa ?? '—'}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-accent">#{inv.invoiceNumber}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-text-tertiary">Fecha</dt>
                    <dd className="text-text-secondary">
                      {new Date(inv.closedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-tertiary">Pago</dt>
                    <dd className="text-text-secondary">{inv.paymentMethod ? (PAYMENT_LABELS[inv.paymentMethod] ?? inv.paymentMethod) : '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-text-tertiary">Total</dt>
                    <dd className="font-semibold text-text-primary"><MoneyDisplay value={inv.total} /></dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Factura</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Cliente / Moto</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Mecánico</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Pago</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="group cursor-pointer bg-bg-secondary transition-colors hover:bg-bg-elevated"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/recibo/${inv.id}`} className="font-mono text-accent group-hover:underline">
                        #{inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-tertiary">
                      {new Date(inv.closedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{inv.customerName ?? '—'}</div>
                      <div className="font-mono text-xs text-text-tertiary">{inv.placa ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{inv.mechanicName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {inv.paymentMethod ? (PAYMENT_LABELS[inv.paymentMethod] ?? inv.paymentMethod) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right"><MoneyDisplay value={inv.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
