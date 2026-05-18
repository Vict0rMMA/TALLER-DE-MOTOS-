'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { motorcycleSchema, type MotorcycleInput } from '@/validators/motorcycle.schema';
import { useCreateMotorcycle } from '@/hooks/use-motorcycles';

const inputCls =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function NuevaMotocicletaPage({ params }: { params: { id: string } }) {
  const { id: customerId } = params;
  const router = useRouter();
  const createMoto = useCreateMotorcycle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MotorcycleInput>({
    resolver: zodResolver(motorcycleSchema) as any,
    defaultValues: { customerId, kmCurrent: 0 },
  });

  function onSubmit(data: MotorcycleInput) {
    createMoto.mutate(data, {
      onSuccess: () => router.push(`/clientes/${customerId}`),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agregar motocicleta"
        description="Registra una moto para este cliente"
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
        {createMoto.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {(createMoto.error as Error)?.message ?? 'Error al crear motocicleta'}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Placa *" error={errors.placa?.message}>
              <input
                {...register('placa')}
                className={inputCls}
                placeholder="ABC123"
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Marca *" error={errors.brand?.message}>
              <input {...register('brand')} className={inputCls} placeholder="Honda, Yamaha, AKT…" />
            </Field>
            <Field label="Modelo *" error={errors.model?.message}>
              <input {...register('model')} className={inputCls} placeholder="CB 125F" />
            </Field>
            <Field label="Año" error={errors.year?.message}>
              <input
                {...register('year')}
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                className={inputCls}
                placeholder={String(new Date().getFullYear())}
              />
            </Field>
            <Field label="Cilindrada (cc)" error={errors.cc?.message}>
              <input {...register('cc')} type="number" min="50" max="2000" className={inputCls} placeholder="125" />
            </Field>
            <Field label="Kilometraje actual *" error={errors.kmCurrent?.message}>
              <input {...register('kmCurrent')} type="number" min="0" className={inputCls} placeholder="15000" />
            </Field>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMoto.isPending}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {createMoto.isPending ? 'Guardando…' : 'Registrar moto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}