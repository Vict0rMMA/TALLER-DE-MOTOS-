'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerInput } from '@/validators/customer.schema';
import { ColombiaPhoneInput } from '@/components/ui/ColombiaPhoneInput';

interface CustomerFormProps {
  defaultValues?: Partial<CustomerInput>;
  onSubmit: (data: CustomerInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

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

const inputCls =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

export function CustomerForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Guardar cliente',
}: CustomerFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      cedula: '',
      phone: '',
      email: '',
      optInWhatsapp: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Nombre completo *" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="Carlos Rodríguez" />
        </Field>
        <Field label="Cédula *" error={errors.cedula?.message}>
          <input {...register('cedula')} className={inputCls} placeholder="1234567890" />
        </Field>
        <Field label="Teléfono / WhatsApp *" error={errors.phone?.message}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <ColombiaPhoneInput
                id="customer-phone"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.phone}
              />
            )}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className={inputCls}
            placeholder="cliente@email.com (opcional)"
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          {...register('optInWhatsapp')}
          type="checkbox"
          className="h-4 w-4 rounded accent-[--accent-primary]"
        />
        <span className="text-sm text-text-secondary">
          Acepta notificaciones por WhatsApp
        </span>
      </label>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
