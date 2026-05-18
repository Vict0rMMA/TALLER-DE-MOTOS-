'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { productSchema, type ProductInput } from '@/validators/product.schema';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/shared/CurrencyInput';

interface ProductFormProps {
  defaultValues?: Partial<ProductInput>;
  onSubmit: (data: ProductInput) => void;
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
      <label className="input-label">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

const inputCls = 'input-premium';

export function ProductForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Guardar producto',
}: ProductFormProps) {
  const [compatInput, setCompatInput] = useState('');
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      sku: '',
      name: '',
      brand: '',
      category: '',
      cost: 0,
      price: 0,
      stock: 0,
      stockMin: 5,
      barcode: '',
      compatibility: [],
      ...defaultValues,
    },
  });

  const compatibility = watch('compatibility');

  function addCompat() {
    const val = compatInput.trim();
    if (val && !compatibility.includes(val)) {
      setValue('compatibility', [...compatibility, val]);
    }
    setCompatInput('');
  }

  function removeCompat(item: string) {
    setValue(
      'compatibility',
      compatibility.filter((c) => c !== item),
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="SKU *" error={errors.sku?.message}>
          <input {...register('sku')} className={inputCls} placeholder="ACE-0W40-1L" />
        </Field>
        <Field label="Código de barras" error={errors.barcode?.message}>
          <input {...register('barcode')} className={inputCls} placeholder="7702011234567" />
        </Field>
        <Field label="Nombre del producto *" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} placeholder="Aceite 0W-40 sintético 1L" />
        </Field>
        <Field label="Marca" error={errors.brand?.message}>
          <input {...register('brand')} className={inputCls} placeholder="Mobil, Castrol… (opcional)" />
        </Field>
        <Field label="Categoría *" error={errors.category?.message}>
          <select {...register('category')} className={inputCls}>
            <option value="">Seleccionar…</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Field label="Costo (COP) *" error={errors.cost?.message}>
          <Controller
            control={control}
            name="cost"
            render={({ field }) => (
              <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
        </Field>
        <Field label="Precio venta (COP) *" error={errors.price?.message}>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
            )}
          />
        </Field>
        <Field label="Stock actual *" error={errors.stock?.message}>
          <input {...register('stock')} type="number" min="0" className={inputCls} />
        </Field>
        <Field label="Stock mínimo *" error={errors.stockMin?.message}>
          <input {...register('stockMin')} type="number" min="0" className={inputCls} />
        </Field>
      </div>

      <Field label="Compatibilidad (motos)" error={undefined}>
        <div className="flex gap-2">
          <input
            value={compatInput}
            onChange={(e) => setCompatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompat())}
            className={cn(inputCls, 'flex-1')}
            placeholder="Honda CB 125F — Enter para agregar"
          />
          <button
            type="button"
            onClick={addCompat}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            +
          </button>
        </div>
        {compatibility.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {compatibility.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCompat(c)}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
