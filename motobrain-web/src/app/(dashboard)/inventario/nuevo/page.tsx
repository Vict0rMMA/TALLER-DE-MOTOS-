'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductForm } from '@/components/inventory/ProductForm';
import { useCreateProduct } from '@/hooks/use-products';
import type { ProductInput } from '@/validators/product.schema';

function NuevoProductoForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: ProductInput) => void;
  isLoading: boolean;
}) {
  const [barcodeFromUrl] = useQueryState('barcode');
  return (
    <ProductForm
      defaultValues={barcodeFromUrl ? { barcode: barcodeFromUrl } : undefined}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitLabel="Crear producto"
    />
  );
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  async function handleSubmit(data: ProductInput) {
    try {
      await createProduct.mutateAsync(data);
      toast.success('Producto creado correctamente');
      router.push('/inventario');
    } catch (e) {
      toast.error('Error al crear producto', { description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo producto"
        description="Agrega un repuesto o insumo al inventario"
        actions={
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        }
      />
      <div className="glass-card p-6">
        {createProduct.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(createProduct.error as Error)?.message ?? 'Error al crear producto'}
          </div>
        )}
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-bg-elevated" />}>
          <NuevoProductoForm onSubmit={handleSubmit} isLoading={createProduct.isPending} />
        </Suspense>
      </div>
    </div>
  );
}
