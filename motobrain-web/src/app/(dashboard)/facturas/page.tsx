'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useInvoices } from '@/hooks/use-invoices';
import { useAuthStore } from '@/stores/auth-store';
import { formatCOP } from '@/lib/utils';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

function InvoiceTag({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
      #{n}
    </span>
  );
}

function PaymentTag({ method }: { method?: string }) {
  if (!method) return <span className="text-text-tertiary">—</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      {PAYMENT_LABELS[method] ?? method}
    </span>
  );
}

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
  const totalCount = pagination?.total ?? 0;
  const average = totalCount > 0 ? totalRevenue / totalCount : 0;
  const hasFilters = Boolean(search || from || to);

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

  function clearFilters() {
    setQ('');
    setSearch('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Facturas" description={`${totalCount} ${totalCount === 1 ? 'factura emitida' : 'facturas emitidas'}`} />

      <div className="glass-card-glow relative overflow-hidden rounded-[14px] p-5 sm:p-6">
        <Receipt
          className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-accent opacity-[0.07] sm:-right-4 sm:-top-4 sm:h-28 sm:w-28"
          strokeWidth={1}
        />
        <div className="relative grid grid-cols-3 divide-x divide-border">
          <div className="pr-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Facturas</p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">{totalCount}</p>
          </div>
          <div className="px-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Total facturado</p>
            <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums text-accent sm:text-3xl">
              {formatCOP(totalRevenue)}
            </p>
          </div>
          <div className="pl-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Promedio</p>
            <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">{formatCOP(average)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            onBlur={applySearch}
            placeholder="Buscar por cliente o placa"
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            aria-label="Desde"
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-text-tertiary">—</span>
          <input
            type="date"
            value={to}
            aria-label="Hasta"
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
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
                  <InvoiceTag n={inv.invoiceNumber} />
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
                    <dd><PaymentTag method={inv.paymentMethod} /></dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-text-tertiary">Total</dt>
                    <dd className="font-semibold text-text-primary"><MoneyDisplay value={inv.total} /></dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Factura</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Fecha</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Cliente / Moto</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Mecánico</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Pago</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group bg-bg-secondary transition-colors hover:bg-bg-elevated">
                    <td className="px-4 py-3.5">
                      <Link href={`/recibo/${inv.id}`} className="inline-block transition-transform group-hover:scale-[1.03]">
                        <InvoiceTag n={inv.invoiceNumber} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-text-tertiary">
                      {new Date(inv.closedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-text-primary">{inv.customerName ?? '—'}</div>
                      <div className="font-mono text-xs text-text-tertiary">{inv.placa ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">{inv.mechanicName ?? '—'}</td>
                    <td className="px-4 py-3.5"><PaymentTag method={inv.paymentMethod} /></td>
                    <td className="px-4 py-3.5 text-right"><MoneyDisplay value={inv.total} /></td>
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
