'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { productSchema, type ProductInput } from '@/validators/product.schema';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/shared/CurrencyInput';
import { SearchSelect } from '@/components/ui/SearchSelect';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }));

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
  const cost = watch('cost');
  const price = watch('price');
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SectionLabel>Identificación</SectionLabel>
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
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SearchSelect
                id="product-category"
                value={field.value ?? ''}
                onChange={field.onChange}
                options={CATEGORY_OPTIONS}
                placeholder="Seleccionar…"
                emptyMessage="Ninguna categoría coincide"
                aria-invalid={!!errors.category}
              />
            )}
          />
        </Field>
      </div>

      <SectionLabel>Precio y stock</SectionLabel>
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
          {price > 0 && (
            <p className={cn('text-xs font-medium', margin >= 30 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-danger')}>
              Margen: {margin.toFixed(0)}%
            </p>
          )}
        </Field>
        <Field label="Stock actual *" error={errors.stock?.message}>
          <input {...register('stock')} type="number" min="0" className={inputCls} />
        </Field>
        <Field label="Stock mínimo *" error={errors.stockMin?.message}>
          <input {...register('stockMin')} type="number" min="0" className={inputCls} />
          <p className="text-xs text-text-tertiary">Te avisamos cuando el stock baje de aquí</p>
        </Field>
      </div>

      <SectionLabel>Compatibilidad</SectionLabel>
      <Field label="Motos compatibles" error={undefined}>
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
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
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
