'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceForm } from '@/components/services/ServiceForm';
import { useCreateService } from '@/hooks/use-services';
import type { ServiceInput } from '@/validators/service.schema';

export default function NuevoServicioPage() {
  const router = useRouter();
  const createService = useCreateService();

  async function handleSubmit(data: ServiceInput) {
    try {
      await createService.mutateAsync(data);
      router.replace('/servicios');
    } catch {
      // error shown via createService.isError
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva orden de servicio"
        description="Registra un nuevo trabajo para una moto"
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
        {createService.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(createService.error as Error)?.message ?? 'Error al crear la orden'}
          </div>
        )}
        <ServiceForm
          onSubmit={handleSubmit}
          isLoading={createService.isPending}
          submitLabel="Crear orden"
        />
      </div>
    </div>
  );
}
