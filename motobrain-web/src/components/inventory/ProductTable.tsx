'use client';

import { useState } from 'react';
import { Edit, Trash2, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/entities';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useDeleteProduct } from '@/hooks/use-products';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
}

function stockBarPercent(stock: number, stockMin: number) {
  const target = Math.max(stockMin * 2, 1);
  return Math.min(100, Math.round((stock / target) * 100));
}

function stockBarClass(stock: number, stockMin: number) {
  if (stock <= stockMin) return 'critical';
  if (stock <= stockMin * 1.5) return 'low';
  if (stock <= stockMin * 3) return 'ok';
  return 'full';
}

export function ProductTable({ products, isLoading }: ProductTableProps) {
  const router = useRouter();
  const deleteProduct = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteProduct.mutate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 skeleton" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-state-icon">
          <Package className="h-7 w-7" />
        </div>
        <p className="empty-state-title">Sin productos</p>
        <p className="empty-state-description">
          No hay resultados con estos filtros. Agrega tu primer repuesto o ajusta la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3 md:hidden">
      {products.map((p) => {
        const barClass = stockBarClass(p.stock, p.stockMin);
        const barWidth = stockBarPercent(p.stock, p.stockMin);
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/inventario/${p.id}`)}
            className="rounded-xl border border-border bg-bg-secondary p-4 active:bg-bg-elevated"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[10px] text-text-tertiary">{p.sku}</p>
                <p className="mt-0.5 font-medium leading-snug text-text-primary">{p.name}</p>
                <p className="truncate text-xs text-text-tertiary">{p.brand} · {p.category}</p>
              </div>
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => router.push(`/inventario/${p.id}`)} className="rounded-lg p-2 text-text-secondary">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className={cn('rounded-lg p-2', confirmDelete === p.id ? 'bg-danger text-white' : 'text-text-secondary')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] text-text-tertiary">Precio</p>
                <MoneyDisplay value={p.price} className="text-sm" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-tertiary">Stock</p>
                <p className={cn('font-mono text-sm', p.isLowStock ? 'text-warning' : 'text-text-primary')}>
                  {p.stock} <span className="text-text-tertiary">/ {p.stockMin}</span>
                </p>
              </div>
            </div>
            <div className="stock-bar mt-2">
              <div className={cn('stock-bar-fill', barClass)} style={{ width: `${barWidth}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-text-tertiary">{p.margin.toFixed(1)}% margen</span>
              {p.isLowStock ? (
                <span className="badge-stock-low">Stock bajo</span>
              ) : (
                <span className="badge-stock-ok text-xs">OK</span>
              )}
            </div>
          </div>
        );
      })}
    </div>

    <div className="glass-card hidden overflow-hidden md:block">
      <div className="overflow-x-auto">
        <table className="premium-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Margen</th>
              <th className="text-right">Estado</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const barClass = stockBarClass(p.stock, p.stockMin);
              const barWidth = stockBarPercent(p.stock, p.stockMin);
              const marginNegative = p.margin < 0;

              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/inventario/${p.id}`)}
                  className="group"
                >
                  <td className="mono max-w-[5.5rem] truncate" title={p.sku}>
                    {p.sku}
                  </td>
                  <td>
                    <div className="font-medium text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-tertiary">{p.brand}</div>
                  </td>
                  <td className="text-text-secondary">{p.category}</td>
                  <td className="text-right">
                    <span className="mono-accent">
                      <MoneyDisplay value={p.price} />
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className={cn(
                          'font-mono text-sm font-medium',
                          p.isLowStock ? 'text-warning' : 'text-text-primary',
                        )}
                      >
                        {p.stock}
                        <span className="text-text-tertiary font-normal"> / {p.stockMin}</span>
                      </span>
                      <div className="stock-bar">
                        <div
                          className={cn('stock-bar-fill', barClass)}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    <span
                      className={cn(
                        'text-sm tabular-nums',
                        marginNegative
                          ? 'text-danger'
                          : p.margin >= 20
                            ? 'text-text-secondary'
                            : 'text-warning',
                      )}
                    >
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right">
                    {p.isLowStock ? (
                      <span className="badge-stock-low">Stock bajo</span>
                    ) : (
                      <span className="badge-stock-ok">Disponible</span>
                    )}
                  </td>
                  <td>
                    <div
                      className="row-actions flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/inventario/${p.id}`)}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover hover:text-accent transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className={cn(
                          'rounded-lg p-1.5 transition-colors',
                          confirmDelete === p.id
                            ? 'bg-danger text-white'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-danger',
                        )}
                        title={confirmDelete === p.id ? 'Confirmar' : 'Eliminar'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
