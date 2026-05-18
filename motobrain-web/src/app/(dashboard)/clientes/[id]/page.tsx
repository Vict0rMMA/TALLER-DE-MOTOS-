'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Eye, EyeOff, Check, X, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { MotorcycleCard, AddMotorcycleCard } from '@/components/customers/MotorcycleCard';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useMotorcyclesByCustomer } from '@/hooks/use-motorcycles';
import { api } from '@/lib/api-client';
import type { CustomerInput } from '@/validators/customer.schema';

function PortalAccessSection({ customerId, portalActive }: { customerId: string; portalActive: boolean }) {
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const enable = useMutation({
    mutationFn: () => api.put(`/portal/enable/${customerId}`, { password }),
    onSuccess: () => {
      toast.success('Portal activado', { description: `El cliente puede ingresar con su teléfono y esta contraseña.` });
      setShowForm(false);
      setPassword('');
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
            {portalActive ? 'El cliente puede ver sus servicios en /portal' : 'Sin acceso al portal aún'}
          </p>
        </div>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${portalActive ? 'border-success/30 bg-success/10 text-success' : 'border-border text-text-tertiary'}`}>
          {portalActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {portalActive ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Cambiar contraseña
          </button>
          <button
            onClick={() => { if (confirm('¿Desactivar el acceso al portal?')) disable.mutate(); }}
            disabled={disable.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" /> Desactivar acceso
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg-primary hover:opacity-90 transition-opacity"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Activar portal
        </button>
      )}

      {showForm && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-text-tertiary">
            El cliente usará su <strong className="text-text-secondary">teléfono</strong> + esta contraseña para entrar a{' '}
            <code className="text-accent bg-accent/10 px-1 rounded text-[11px]">/portal</code>
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 pr-9 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              onClick={() => enable.mutate()}
              disabled={enable.isPending || password.length < 6}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg-primary disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {enable.isPending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" /> : <Check className="h-3.5 w-3.5" />}
              Guardar
            </button>
            <button
              onClick={() => { setShowForm(false); setPassword(''); }}
              className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
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

      <PortalAccessSection customerId={id} portalActive={customer.portalActive ?? false} />

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
