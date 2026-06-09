'use client';

import { useState } from 'react';
import { Edit, Trash2, Bike, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/types/entities';
import { useDeleteCustomer, useApprovePortal } from '@/hooks/use-customers';
import { cn } from '@/lib/utils';

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
}

export function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  const router = useRouter();
  const deleteCustomer = useDeleteCustomer();
  const approvePortal = useApprovePortal();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteCustomer.mutate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
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

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
        <p className="text-sm">No hay clientes registrados.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3 md:hidden">
      {customers.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-border bg-bg-secondary p-4 active:bg-bg-elevated"
          onClick={() => router.push(`/clientes/${c.id}`)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary leading-snug">{c.name}</p>
              {c.email && <p className="mt-0.5 truncate text-xs text-text-tertiary">{c.email}</p>}
            </div>
            <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => router.push(`/clientes/${c.id}`)}
                className="rounded-lg p-2 text-text-secondary hover:text-accent"
                aria-label="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className={cn(
                  'rounded-lg p-2',
                  confirmDelete === c.id ? 'bg-danger text-white' : 'text-text-secondary',
                )}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-text-tertiary">Cédula</dt>
              <dd className="font-mono text-text-secondary">{c.cedula ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Teléfono</dt>
              <dd className="flex items-center gap-1 text-text-secondary">
                {c.phone}
                {c.optInWhatsapp && <MessageCircle className="h-3 w-3 text-success" />}
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Motos</dt>
              <dd className="text-text-secondary">{c.motorcycleCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Último servicio</dt>
              <dd className="text-text-secondary">
                {c.lastServiceAt
                  ? new Date(c.lastServiceAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>

    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-bg-elevated">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Cliente</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Cédula</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Teléfono</th>
            <th className="px-4 py-3 text-center font-medium text-text-secondary">Motos</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Último servicio</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {customers.map((c) => (
            <tr
              key={c.id}
              className="bg-bg-secondary transition-colors hover:bg-bg-elevated"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{c.name}</span>
                  {!c.portalActive && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                      Pendiente
                    </span>
                  )}
                </div>
                {c.email && <div className="text-xs text-text-tertiary">{c.email}</div>}
              </td>
              <td className="px-4 py-3 font-mono text-text-tertiary">{c.cedula ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  {c.phone}
                  {c.optInWhatsapp && (
                    <MessageCircle className="h-3.5 w-3.5 text-success" aria-label="WhatsApp activo" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1 text-text-secondary">
                  <Bike className="h-3.5 w-3.5" />
                  {c.motorcycleCount ?? 0}
                </span>
              </td>
              <td className="px-4 py-3 text-text-tertiary">
                {c.lastServiceAt
                  ? new Date(c.lastServiceAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {!c.portalActive && (
                    <button
                      onClick={() => approvePortal.mutate(c.id)}
                      disabled={approvePortal.isPending}
                      className="rounded px-2 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                      title="Aprobar acceso al portal"
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aprobar
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/clientes/${c.id}`)}
                    className="rounded p-1.5 text-text-secondary hover:bg-bg-primary hover:text-accent transition-colors"
                    title="Ver / editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className={cn(
                      'rounded p-1.5 transition-colors',
                      confirmDelete === c.id
                        ? 'bg-danger text-white'
                        : 'text-text-secondary hover:bg-bg-primary hover:text-danger',
                    )}
                    title={confirmDelete === c.id ? 'Confirmar' : 'Eliminar'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
