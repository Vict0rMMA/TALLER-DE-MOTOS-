'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Package, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductTable } from '@/components/inventory/ProductTable';
import { KPICard } from '@/components/dashboard/KPICard';
import { useProducts } from '@/hooks/use-products';
import { useDashboardKPIs } from '@/hooks/use-analytics';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { useDebounce } from '@/hooks/use-debounce';
import { QueryErrorBanner } from '@/components/shared/QueryErrorBanner';
import { cn } from '@/lib/utils';

export default function InventarioPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 450);
  const {
    data,
    isPending: productsPending,
    isError: productsError,
    error: productsErr,
    refetch: refetchProducts,
  } = useProducts({
    page,
    limit: 20,
    search: debouncedSearch,
    category,
    lowStock,
  });
  const { data: kpis, isPending: kpisPending, isError: kpisError, error: kpisErr, refetch: refetchKpis } =
    useDashboardKPIs();

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const lowStockCount = kpis?.lowStockCount ?? 0;
  const totalProducts = kpis?.totalProducts ?? pagination?.total ?? 0;
  const kpiLoading = kpisPending && !kpis;
  const productsLoading = productsPending && !data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description={`${totalProducts} productos registrados`}
        actions={
          <button type="button" onClick={() => router.push('/inventario/nuevo')} className="btn-accent inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        }
      />

      {(kpisError || productsError) && (
        <QueryErrorBanner
          title="Error al cargar inventario"
          message={(productsErr ?? kpisErr)?.message}
          onRetry={() => {
            void refetchProducts();
            void refetchKpis();
          }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {kpiLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="kpi-card h-[88px] skeleton" />
          ))
        ) : (
          <>
            <KPICard title="Productos totales" value={totalProducts} icon={Package} />
            <KPICard
              title="Stock bajo"
              value={lowStockCount}
              icon={AlertTriangle}
              variant={lowStockCount > 0 ? 'danger' : 'default'}
            />
          </>
        )}
      </div>

      <div className="filter-bar">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre, SKU o marca…"
            className="filter-input w-full"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="filter-select appearance-none pr-8"
          >
            <option value="">Todas las categorías</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setLowStock(!lowStock);
            setPage(1);
          }}
          className={cn('filter-chip', lowStock && 'active')}
        >
          Stock bajo
        </button>
      </div>

      <ProductTable products={products} isLoading={productsLoading} />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="btn-outline disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-text-secondary">
            {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn-outline disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
