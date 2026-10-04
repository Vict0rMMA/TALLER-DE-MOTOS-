'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { findProductByBarcode, ProductNotFoundError, useRegisterStockMovement } from '@/hooks/use-products';
import type { Product } from '@/types/entities';

interface SessionRow {
  key: string;
  productName: string;
  quantity: number;
  newStock: number;
}

interface PendingScan {
  code: string;
  product: Product;
  quantity: number;
}

interface QuickScanPanelProps {
  /** Codigo recien detectado por la camara (cambia en cada lectura nueva). */
  scannedCode: string | null;
  onConsumed: () => void;
}

export function QuickScanPanel({ scannedCode, onConsumed }: QuickScanPanelProps) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [pending, setPending] = useState<PendingScan | null>(null);
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const registerMovement = useRegisterStockMovement();

  // Dispara la busqueda cuando llega un codigo nuevo de la camara. Si ya hay
  // uno pendiente de confirmar, se ignoran lecturas nuevas hasta resolverlo.
  if (scannedCode && !pending && scannedCode !== loadingCode) {
    setLoadingCode(scannedCode);
    findProductByBarcode(scannedCode)
      .then((product) => setPending({ code: scannedCode, product, quantity: 1 }))
      .catch((e) => {
        if (e instanceof ProductNotFoundError) {
          toast.error('Producto no encontrado', { description: scannedCode });
        } else {
          toast.error('Error al buscar el producto', { description: (e as Error).message });
        }
      })
      .finally(() => {
        setLoadingCode(null);
        onConsumed();
      });
  }

  async function confirmPending() {
    if (!pending) return;
    try {
      await registerMovement.mutateAsync({ productId: pending.product.id, type: 'purchase', quantity: pending.quantity });
      setRows((r) => [
        {
          key: `${pending.code}-${Date.now()}`,
          productName: pending.product.name,
          quantity: pending.quantity,
          newStock: pending.product.stock + pending.quantity,
        },
        ...r,
      ]);
      setPending(null);
    } catch (e) {
      toast.error('No se pudo agregar', { description: (e as Error).message });
    }
  }

  return (
    <div className="border-t border-white/10 bg-bg-secondary">
      {loadingCode && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-text-tertiary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando {loadingCode}…
        </div>
      )}

      {pending && (
        <div className="flex items-center gap-3 border-b border-border bg-accent/5 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{pending.product.name}</p>
            <p className="text-xs text-text-tertiary">Stock actual: {pending.product.stock}</p>
          </div>
          <input
            type="number"
            min={1}
            max={10000}
            autoFocus
            value={pending.quantity}
            onChange={(e) => setPending((p) => (p ? { ...p, quantity: Math.min(10000, Math.max(1, Number(e.target.value) || 1)) } : p))}
            onKeyDown={(e) => e.key === 'Enter' && confirmPending()}
            className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-center text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={confirmPending}
            disabled={registerMovement.isPending}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Agregar
          </button>
        </div>
      )}

      <div className="max-h-40 overflow-y-auto px-4 py-2">
        {rows.length === 0 && !pending && !loadingCode ? (
          <p className="py-2 text-center text-xs text-text-tertiary">
            Apunta la cámara a un código — se van a sumar al inventario uno por uno.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-text-primary">{r.productName}</span>
                <span className="shrink-0 text-xs text-text-tertiary">+{r.quantity} → {r.newStock}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
