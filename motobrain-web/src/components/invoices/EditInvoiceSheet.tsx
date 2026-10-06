'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { CurrencyInput } from '@/components/shared/CurrencyInput';
import { useUpdateInvoice, type Invoice } from '@/hooks/use-invoices';

const PAYMENT_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
];

const WARRANTY_OPTIONS = ['Sin garantía', '1 mes', '3 meses', '6 meses', '12 meses'].map((w) => ({
  value: w,
  label: w,
}));

const inputCls =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

interface EditInvoiceSheetProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function EditInvoiceSheet({ invoice, onClose }: EditInvoiceSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const updateInvoice = useUpdateInvoice(invoice?.id ?? '');

  const { data: workshopUsers = [] } = useQuery({
    queryKey: ['workshop-users'],
    queryFn: () => api.get<{ id: string; name: string; role: string; active: boolean }[]>('/auth/users'),
    staleTime: 5 * 60_000,
    enabled: !!invoice,
  });

  const [mechanicId, setMechanicId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [warranty, setWarranty] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [laborCost, setLaborCost] = useState(0);

  useEffect(() => {
    if (!invoice) return;
    setMechanicId(invoice.mechanicId ?? '');
    setPaymentMethod(invoice.paymentMethod ?? '');
    setWarranty(invoice.warranty ?? '');
    setNotes(invoice.notes ?? '');
    setDiscount(invoice.discount ?? 0);
    setLaborCost(invoice.laborCost ?? 0);
  }, [invoice]);

  if (!mounted || !invoice) return null;

  function handleSave() {
    if (!invoice) return;
    updateInvoice.mutate(
      {
        mechanicId: mechanicId || undefined,
        paymentMethod: paymentMethod || undefined,
        warranty: warranty || undefined,
        notes: notes.trim() || undefined,
        discount,
        laborCost,
      },
      {
        onSuccess: () => {
          toast.success('Factura actualizada');
          onClose();
        },
        onError: (e) => toast.error('No se pudo guardar', { description: (e as Error).message }),
      },
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-bg-secondary shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="font-semibold text-text-primary">Editar factura #{invoice.invoiceNumber}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{invoice.customerName} · {invoice.placa}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-elevated hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {workshopUsers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Mecánico</label>
              <SearchSelect
                id="edit-invoice-mechanic"
                value={mechanicId}
                onChange={setMechanicId}
                options={workshopUsers.filter((u) => u.active).map((u) => ({ value: u.id, label: u.name }))}
                placeholder="Sin asignar"
                emptyMessage="Ningún mecánico coincide"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Método de pago</label>
              <SearchSelect
                id="edit-invoice-payment"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={PAYMENT_OPTIONS}
                placeholder="Seleccionar…"
                emptyMessage="Ningún método coincide"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Garantía</label>
              <SearchSelect
                id="edit-invoice-warranty"
                value={warranty}
                onChange={setWarranty}
                options={WARRANTY_OPTIONS}
                placeholder="Seleccionar…"
                emptyMessage="Ninguna coincide"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Mano de obra</label>
              <CurrencyInput value={laborCost} onChange={setLaborCost} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Descuento</label>
              <CurrencyInput value={discount} onChange={setDiscount} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Notas de la factura…"
            />
          </div>

          <p className="text-xs text-text-tertiary">
            Los repuestos y el tipo de servicio ya no se pueden cambiar porque la factura quedó cerrada —
            solo estos datos.
          </p>
        </div>

        <div className="flex gap-2 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateInvoice.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {updateInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
