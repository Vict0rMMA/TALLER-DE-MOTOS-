'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { serviceSchema, type ServiceInput } from '@/validators/service.schema';
import { SERVICE_TYPES } from '@/lib/constants';
import { useCustomers } from '@/hooks/use-customers';
import { useMotorcyclesByCustomer } from '@/hooks/use-motorcycles';
import { useProducts } from '@/hooks/use-products';
import { CurrencyInput } from '@/components/shared/CurrencyInput';

interface ServiceFormProps {
  onSubmit: (data: ServiceInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const inputCls =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function ServiceForm({ onSubmit, isLoading, submitLabel = 'Crear servicio' }: ServiceFormProps) {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { products: [], laborCost: 0 },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  const selectedCustomerId = watch('customerId');
  const { data: customersData } = useCustomers({ limit: 100 });
  const { data: motorcyclesData } = useMotorcyclesByCustomer(selectedCustomerId);
  const { data: productsData } = useProducts({ limit: 100 });

  const customers = customersData?.data ?? [];
  const motorcycles = motorcyclesData?.data ?? [];
  const products = productsData?.data ?? [];

  function nextStep(e: React.MouseEvent) {
    e.preventDefault();
    setStep((s) => Math.min(s + 1, 3));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex gap-2">
        {['Cliente y moto', 'Servicio', 'Repuestos'].map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              step === i + 1
                ? 'bg-accent text-bg-primary'
                : step > i + 1
                ? 'bg-success/20 text-success'
                : 'bg-bg-elevated text-text-tertiary'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Cliente *" error={errors.customerId?.message}>
            <select {...register('customerId')} className={inputCls}>
              <option value="">Seleccionar cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.cedula}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Motocicleta *" error={errors.motorcycleId?.message}>
            <select {...register('motorcycleId')} className={inputCls} disabled={!selectedCustomerId}>
              <option value="">
                {selectedCustomerId
                  ? motorcycles.length === 0
                    ? 'Este cliente no tiene motos registradas'
                    : 'Seleccionar moto…'
                  : 'Primero selecciona un cliente'}
              </option>
              {motorcycles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.placa} — {m.brand} {m.model}
                </option>
              ))}
            </select>
            {selectedCustomerId && motorcycles.length === 0 && (
              <a
                href={`/clientes/${selectedCustomerId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                + Ir al perfil del cliente para registrar una moto
              </a>
            )}
          </Field>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Tipo de servicio *" error={errors.type?.message}>
            <select {...register('type')} className={inputCls}>
              <option value="">Seleccionar…</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" error={errors.description?.message}>
            <textarea
              {...register('description')}
              className={inputCls}
              rows={3}
              placeholder="Detalles del servicio, síntomas reportados…"
            />
          </Field>
          <Field label="Mano de obra (COP)" error={errors.laborCost?.message}>
            <Controller
              control={control}
              name="laborCost"
              render={({ field }) => (
                <CurrencyInput value={field.value ?? 0} onChange={field.onChange} placeholder="0" />
              )}
            />
          </Field>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-5 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">Repuestos usados</h3>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar repuesto
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-4">
              Sin repuestos — servicio solo de mano de obra.
            </p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <select
                    {...register(`products.${index}.productId`)}
                    className={inputCls}
                  >
                    <option value="">Producto…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  {...register(`products.${index}.quantity`)}
                  type="number"
                  min="1"
                  placeholder="Cant."
                  className={inputCls}
                />
                <Controller
                  control={control}
                  name={`products.${index}.unitPrice`}
                  render={({ field }) => (
                    <CurrencyInput value={field.value ?? 0} onChange={field.onChange} placeholder="Precio" />
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-0.5 rounded p-2 text-text-tertiary hover:text-danger transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-border px-5 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? 'Creando…' : submitLabel}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
