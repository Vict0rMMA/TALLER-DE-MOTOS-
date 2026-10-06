'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCreateCustomer } from '@/hooks/use-customers';
import { useCreateMotorcycle } from '@/hooks/use-motorcycles';
import { clearFormDraft } from '@/hooks/use-form-draft';
import { motorcycleSchema } from '@/validators/motorcycle.schema';
import type { CustomerInput } from '@/validators/customer.schema';

const CUSTOMER_DRAFT_KEY = 'draft:cliente-nuevo';
const MOTO_DRAFT_KEY = 'draft:cliente-nuevo:moto';

/** Formatea con puntos de miles mientras se escribe (ej. 160000 -> 160.000). */
function formatThousands(digits: string): string {
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

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

interface MotoDraft {
  placa: string;
  brand: string;
  model: string;
  year: string;
  cc: string;
  kmCurrent: number;
}

const emptyMoto: MotoDraft = { placa: '', brand: '', model: '', year: '', cc: '', kmCurrent: 0 };

export default function NuevoClientePage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const createMoto = useCreateMotorcycle();

  const [moto, setMoto] = useState<MotoDraft>(emptyMoto);
  const [motoError, setMotoError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOTO_DRAFT_KEY);
      if (raw) setMoto(JSON.parse(raw));
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MOTO_DRAFT_KEY, JSON.stringify(moto));
    } catch {
      // noop
    }
  }, [moto]);

  const motoStarted = moto.placa.trim() || moto.brand.trim() || moto.model.trim();

  async function handleSubmit(data: CustomerInput) {
    setMotoError(null);
    try {
      const customer = await createCustomer.mutateAsync(data);

      if (motoStarted) {
        const parsed = motorcycleSchema.safeParse({
          customerId: customer.id,
          placa: moto.placa.trim().toUpperCase(),
          brand: moto.brand.trim(),
          model: moto.model.trim(),
          year: moto.year ? Number(moto.year) : undefined,
          cc: moto.cc ? Number(moto.cc) : undefined,
          kmCurrent: moto.kmCurrent,
        });
        if (!parsed.success) {
          setMotoError(parsed.error.issues[0]?.message ?? 'Revisa los datos de la moto');
          router.push(`/clientes/${customer.id}`);
          return;
        }
        await createMoto.mutateAsync(parsed.data);
      }

      clearFormDraft(MOTO_DRAFT_KEY);
      router.push(`/clientes/${customer.id}`);
    } catch {
      // error del cliente se muestra via createCustomer.isError; si falló la
      // moto, el cliente ya quedó creado — se puede agregar luego desde su ficha.
    }
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
        {createMoto.isError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            El cliente se creó, pero la moto no se pudo registrar:{' '}
            {(createMoto.error as Error)?.message ?? 'Error desconocido'}. Agrégala desde su ficha.
          </div>
        )}

        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={createCustomer.isPending || createMoto.isPending}
          submitLabel="Crear cliente"
          draftKey={CUSTOMER_DRAFT_KEY}
        >
          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Bike className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Su moto</h3>
                <p className="text-xs text-text-tertiary">Opcional — la puedes agregar después si no la tienes a mano</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={motoStarted ? 'Placa *' : 'Placa'} error={motoStarted && !moto.placa.trim() ? motoError ?? undefined : undefined}>
                <input
                  value={moto.placa}
                  onChange={(e) => setMoto((m) => ({ ...m, placa: e.target.value }))}
                  className={inputCls}
                  placeholder="ABC123"
                  style={{ textTransform: 'uppercase' }}
                />
              </Field>
              <Field label={motoStarted ? 'Marca *' : 'Marca'}>
                <input
                  value={moto.brand}
                  onChange={(e) => setMoto((m) => ({ ...m, brand: e.target.value }))}
                  className={inputCls}
                  placeholder="Honda, Yamaha, AKT…"
                />
              </Field>
              <Field label={motoStarted ? 'Modelo *' : 'Modelo'}>
                <input
                  value={moto.model}
                  onChange={(e) => setMoto((m) => ({ ...m, model: e.target.value }))}
                  className={inputCls}
                  placeholder="CB 125F"
                />
              </Field>
              <Field label="Año">
                <input
                  value={moto.year}
                  onChange={(e) => setMoto((m) => ({ ...m, year: e.target.value.replace(/\D/g, '') }))}
                  type="text"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder={String(new Date().getFullYear())}
                />
              </Field>
              <Field label="Cilindrada (cc)">
                <input
                  value={moto.cc}
                  onChange={(e) => setMoto((m) => ({ ...m, cc: e.target.value.replace(/\D/g, '') }))}
                  type="text"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="125"
                />
              </Field>
              <Field label="Kilometraje actual">
                <input
                  type="text"
                  inputMode="numeric"
                  value={moto.kmCurrent ? formatThousands(String(moto.kmCurrent)) : ''}
                  onChange={(e) =>
                    setMoto((m) => ({ ...m, kmCurrent: Number(e.target.value.replace(/\D/g, '')) || 0 }))
                  }
                  className={inputCls}
                  placeholder="15.000"
                />
              </Field>
            </div>
            {motoError && <p className="text-xs text-danger">{motoError}</p>}
          </div>
        </CustomerForm>
      </div>
    </div>
  );
}
