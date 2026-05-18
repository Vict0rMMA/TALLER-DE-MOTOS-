'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductForm } from '@/components/inventory/ProductForm';
import { useCreateProduct } from '@/hooks/use-products';
import type { ProductInput } from '@/validators/product.schema';

export default function NuevoProductoPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  function handleSubmit(data: ProductInput) {
    createProduct.mutate(data, {
      onSuccess: () => {
        toast.success('Producto creado correctamente');
        router.push('/inventario');
      },
      onError: (e) => toast.error('Error al crear producto', { description: (e as Error).message }),
    });
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
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending}
          submitLabel="Crear producto"
        />
      </div>
    </div>
  );
}
