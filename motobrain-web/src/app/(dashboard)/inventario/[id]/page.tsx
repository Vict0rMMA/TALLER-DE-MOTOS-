'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductForm } from '@/components/inventory/ProductForm';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import type { ProductInput } from '@/validators/product.schema';

export default function EditarProductoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  function handleSubmit(data: ProductInput) {
    updateProduct.mutate(data, {
      onSuccess: () => {
        toast.success('Producto actualizado');
        router.push('/inventario');
      },
      onError: (e) => toast.error('Error al guardar', { description: (e as Error).message }),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
        <div className="h-80 animate-pulse rounded-xl bg-bg-elevated" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-text-secondary">
        <p>Producto no encontrado.</p>
        <button onClick={() => router.push('/inventario')} className="text-accent hover:underline text-sm">
          Volver al inventario
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar — ${product.name}`}
        description={`SKU: ${product.sku}`}
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
        {updateProduct.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(updateProduct.error as Error)?.message ?? 'Error al actualizar producto'}
          </div>
        )}
        <ProductForm
          defaultValues={{
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            category: product.category,
            cost: product.cost,
            price: product.price,
            stock: product.stock,
            stockMin: product.stockMin,
            barcode: product.barcode,
            compatibility: product.compatibility ?? [],
          }}
          onSubmit={handleSubmit}
          isLoading={updateProduct.isPending}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
