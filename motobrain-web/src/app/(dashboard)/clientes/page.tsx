'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { useCustomers } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';

export default function ClientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = useCustomers({ page, limit: 20, search: debouncedSearch });

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${pagination?.total ?? 0} clientes registrados`}
        actions={
          <button
            onClick={() => router.push('/clientes/nuevo')}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, cédula o teléfono…"
          className="w-full rounded-lg border border-border bg-bg-elevated py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <CustomerTable customers={customers} isLoading={isLoading} />

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
