'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/hooks/use-customers';
import type { CustomerInput } from '@/validators/customer.schema';

export default function NuevoClientePage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  function handleSubmit(data: CustomerInput) {
    createCustomer.mutate(data, {
      onSuccess: () => router.push('/clientes'),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo cliente"
        description="Registra un cliente y sus datos de contacto"
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
        {createCustomer.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(createCustomer.error as Error)?.message ?? 'Error al crear cliente'}
          </div>
        )}
        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={createCustomer.isPending}
          submitLabel="Crear cliente"
        />
      </div>
    </div>
  );
}
