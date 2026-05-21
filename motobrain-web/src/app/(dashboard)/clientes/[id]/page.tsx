'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { MotorcycleCard, AddMotorcycleCard } from '@/components/customers/MotorcycleCard';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useMotorcyclesByCustomer } from '@/hooks/use-motorcycles';
import { api } from '@/lib/api-client';
import type { CustomerInput } from '@/validators/customer.schema';

function PortalAccessSection({
  customerId,
  portalActive,
  hasCedula,
}: {
  customerId: string;
  portalActive: boolean;
  hasCedula: boolean;
}) {
  const qc = useQueryClient();

  const enable = useMutation({
    mutationFn: () => api.put(`/portal/enable/${customerId}`, {}),
    onSuccess: () => {
      toast.success('Portal activado', { description: 'El cliente entra con su celular y cédula.' });
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
    },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  const disable = useMutation({
    mutationFn: () => api.delete(`/portal/disable/${customerId}`),
    onSuccess: () => {
      toast.success('Acceso desactivado');
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
    },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${portalActive ? 'bg-success/10 text-success' : 'bg-bg-elevated text-text-tertiary'}`}>
          <Smartphone className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="font-semibold text-text-primary">Portal del cliente</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {portalActive
              ? 'Acceso con celular + cédula en /portal'
              : hasCedula
                ? 'Activa el portal para que el cliente entre con su cédula'
                : 'Registra la cédula del cliente para activar el portal'}
          </p>
        </div>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${portalActive ? 'border-success/30 bg-success/10 text-success' : 'border-border text-text-tertiary'}`}>
          {portalActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {portalActive ? (
        <button
          onClick={() => { if (confirm('¿Desactivar el acceso al portal?')) disable.mutate(); }}
          disabled={disable.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
        >
          <ShieldOff className="h-3.5 w-3.5" /> Desactivar acceso
        </button>
      ) : (
        <button
          onClick={() => enable.mutate()}
          disabled={enable.isPending || !hasCedula}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enable.isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          Activar portal
        </button>
      )}
    </div>
  );
}

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: motorcyclesData } = useMotorcyclesByCustomer(id);
  const updateCustomer = useUpdateCustomer(id);

  function handleSubmit(data: CustomerInput) {
    updateCustomer.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
        <div className="h-60 animate-pulse rounded-xl bg-bg-elevated" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-text-secondary">
        <p>Cliente no encontrado.</p>
        <button onClick={() => router.push('/clientes')} className="text-accent hover:underline text-sm">
          Volver a clientes
        </button>
      </div>
    );
  }

  const motorcycles = motorcyclesData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.cedula ? `Cédula: ${customer.cedula}` : customer.phone}
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
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Datos del cliente
        </h2>
        {updateCustomer.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(updateCustomer.error as Error)?.message ?? 'Error al actualizar'}
          </div>
        )}
        {updateCustomer.isSuccess && (
          <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            Cambios guardados correctamente.
          </div>
        )}
        <CustomerForm
          defaultValues={{
            name: customer.name,
            cedula: customer.cedula,
            phone: customer.phone,
            email: customer.email ?? '',
            optInWhatsapp: customer.optInWhatsapp,
          }}
          onSubmit={handleSubmit}
          isLoading={updateCustomer.isPending}
          submitLabel="Guardar cambios"
        />
      </div>

      <PortalAccessSection
        customerId={id}
        portalActive={customer.portalActive ?? false}
        hasCedula={!!customer.cedula?.trim()}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Motocicletas ({motorcycles.length})
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {motorcycles.map((m) => (
            <MotorcycleCard key={m.id} motorcycle={m} />
          ))}
          <AddMotorcycleCard customerId={id} />
        </div>
      </div>
    </div>
  );
}
