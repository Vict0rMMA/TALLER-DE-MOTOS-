'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, PackageX, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { findProductByBarcode, ProductNotFoundError, useRegisterStockMovement } from '@/hooks/use-products';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

interface ScanResultDialogProps {
  code: string;
  onClose: () => void;
  onAdded?: () => void;
}

export function ScanResultDialog({ code, onClose, onAdded }: ScanResultDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const registerMovement = useRegisterStockMovement();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['inventory', 'barcode', code],
    queryFn: () => findProductByBarcode(code),
    retry: false,
    staleTime: 0,
  });

  const notFound = error instanceof ProductNotFoundError;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setQuantity(1);
  }, [code]);

  async function handleConfirm() {
    if (!product) return;
    try {
      await registerMovement.mutateAsync({ productId: product.id, type: 'purchase', quantity });
      const newStock = product.stock + quantity;
      toast.success('✓ Producto agregado correctamente', { description: `Stock actual: ${newStock}` });
      void qc.invalidateQueries({ queryKey: ['inventory', 'barcode', code] });
      onAdded?.();
      onClose();
    } catch (e) {
      toast.error('No se pudo agregar', { description: (e as Error).message });
    }
  }

  function goCreate() {
    router.push(`/inventario/nuevo?barcode=${encodeURIComponent(code)}`);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-bg-secondary p-5 sm:rounded-2xl sm:border sm:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-sm text-text-tertiary">Buscando “{code}”…</p>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <PackageX className="h-10 w-10 text-text-tertiary/40" />
            <p className="font-semibold text-text-primary">Producto no encontrado</p>
            <p className="font-mono text-xs text-text-tertiary">{code}</p>
            <div className="mt-2 flex w-full gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={goCreate}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
              >
                + Crear nuevo producto
              </button>
            </div>
          </div>
        ) : product ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-bg-elevated">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-7 w-7 text-text-tertiary/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{product.name}</p>
                <p className="font-mono text-xs text-text-tertiary">{product.sku} · {product.category}</p>
                <p className="text-sm font-medium text-accent"><MoneyDisplay value={product.price} responsive={false} /></p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-secondary">
              Stock actual: <span className="font-semibold text-text-primary">{product.stock}</span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-tertiary">Cantidad a agregar</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(10000, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-center text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10000, q + 1))}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={registerMovement.isPending}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {registerMovement.isPending ? 'Agregando…' : 'Agregar al inventario'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-danger">No se pudo conectar con el servidor.</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
