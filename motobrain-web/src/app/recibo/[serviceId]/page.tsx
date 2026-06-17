'use client';

import { useEffect, useState } from 'react';
import { Wrench, Bike, User, Package, CheckCircle2, Clock, Printer, ShieldCheck, CreditCard, Download } from 'lucide-react';
import { resolveApiBase } from '@/lib/api-base';

interface ReceiptProduct { name: string; brand: string | null; quantity: number; unitPrice: number; subtotal: number; }
interface Receipt {
  id: string; type: string; description: string | null; status: string;
  photos: string[]; serviceDate: string; closedAt: string | null;
  kmAtService: number; nextMaintenanceKm: number | null; nextMaintenanceDate: string | null;
  laborCost: number; totalCost: number;
  invoiceNumber: number | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  warranty: string | null;
  notes: string | null;
  partsTotal?: number;
  subtotal?: number;
  discount?: number;
  total?: number;
  workshop: { name: string; nit: string | null; phone: string | null; address: string | null };
  motorcycle: { placa: string; brand: string; model: string; year: number | null; cc: number };
  customer: { name: string; phone: string; cedula: string | null; email: string | null };
  mechanic: string | null;
  products: ReceiptProduct[];
}

const SERVICE_LABELS: Record<string, string> = {
  oil_change: 'Cambio de aceite', brakes: 'Frenos', chain_kit: 'Kit de arrastre',
  maintenance: 'Mantenimiento', other: 'Otro',
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', tarjeta: 'Tarjeta', otro: 'Otro',
};

function cop(n: number) {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ReciboDePage({ params }: { params: { serviceId: string } }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const base = resolveApiBase();
    fetch(`${base}/services/${params.serviceId}/receipt`)
      .then((r) => r.ok ? r.json() : r.json().then((b: { error?: string }) => Promise.reject(b.error ?? 'Error')))
      .then((data: Receipt) => setReceipt(data))
      .catch((e: string) => setError(typeof e === 'string' ? e : 'No se pudo cargar el recibo'));
  }, [params.serviceId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-white">Recibo no encontrado</p>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const partsTotal = receipt.partsTotal ?? receipt.products.reduce((s, p) => s + p.subtotal, 0);
  const subtotal = receipt.subtotal ?? partsTotal + receipt.laborCost;
  const discount = receipt.discount ?? 0;
  const total = receipt.total ?? subtotal - discount;
  const invoiceLabel = receipt.invoiceNumber != null
    ? `FACTURA #${String(receipt.invoiceNumber).padStart(4, '0')}`
    : `ORDEN #${receipt.id.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white print:bg-white print:text-black">
      <div className="mx-auto max-w-2xl px-4 py-8 print:py-4">

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 print:border-emerald-600 print:bg-emerald-100">
                <Wrench className="h-4 w-4 text-emerald-400 print:text-emerald-700" strokeWidth={1.75} />
              </div>
              <span className="text-lg font-bold">{receipt.workshop.name}</span>
            </div>
            {receipt.workshop.nit && (
              <p className="mt-1 text-sm text-zinc-400 print:text-zinc-600">NIT: {receipt.workshop.nit}</p>
            )}
            {receipt.workshop.address && (
              <p className="mt-1 text-sm text-zinc-400 print:text-zinc-600">{receipt.workshop.address}</p>
            )}
            {receipt.workshop.phone && (
              <p className="text-sm text-zinc-400 print:text-zinc-600">{receipt.workshop.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold tracking-wide text-emerald-400 print:text-emerald-700">{invoiceLabel}</p>
            <div className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              receipt.status === 'closed'
                ? 'bg-emerald-500/10 text-emerald-400 print:bg-emerald-100 print:text-emerald-700'
                : 'bg-amber-500/10 text-amber-400 print:bg-amber-100 print:text-amber-700'
            }`}>
              {receipt.status === 'closed'
                ? <><CheckCircle2 className="h-3 w-3" /> Entregado</>
                : <><Clock className="h-3 w-3" /> En proceso</>}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 print:border-zinc-200 print:bg-zinc-50">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <User className="h-3.5 w-3.5" /> Cliente
            </div>
            <p className="font-semibold text-white print:text-black">{receipt.customer.name}</p>
            {receipt.customer.cedula && (
              <p className="text-sm text-zinc-400 print:text-zinc-600">C.C. {receipt.customer.cedula}</p>
            )}
            <p className="text-sm text-zinc-400 print:text-zinc-600">{receipt.customer.phone}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 print:border-zinc-200 print:bg-zinc-50">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Bike className="h-3.5 w-3.5" /> Moto
            </div>
            <p className="font-mono text-base font-bold text-white print:text-black">{receipt.motorcycle.placa}</p>
            <p className="text-sm text-zinc-400 print:text-zinc-600">
              {receipt.motorcycle.brand} {receipt.motorcycle.model}
              {receipt.motorcycle.year ? ` · ${receipt.motorcycle.year}` : ''}
              {` · ${receipt.motorcycle.cc}cc`}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 print:border-zinc-200 print:bg-zinc-50">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Wrench className="h-3.5 w-3.5" /> Servicio realizado
          </div>
          <p className="text-lg font-semibold text-white print:text-black">
            {SERVICE_LABELS[receipt.type] ?? receipt.type}
          </p>
          {receipt.description && (
            <p className="mt-2 text-sm text-zinc-400 print:text-zinc-600">{receipt.description}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-zinc-500 print:text-zinc-400">Fecha</p>
              <p className="font-medium text-zinc-200 print:text-zinc-700">{fmtDate(receipt.serviceDate)}</p>
            </div>
            {receipt.kmAtService > 0 && (
              <div>
                <p className="text-zinc-500 print:text-zinc-400">Km al ingreso</p>
                <p className="font-medium text-zinc-200 print:text-zinc-700">{receipt.kmAtService.toLocaleString('es-CO')} km</p>
              </div>
            )}
            {receipt.mechanic && (
              <div>
                <p className="text-zinc-500 print:text-zinc-400">Mecánico</p>
                <p className="font-medium text-zinc-200 print:text-zinc-700">{receipt.mechanic}</p>
              </div>
            )}
            {receipt.nextMaintenanceKm && (
              <div>
                <p className="text-zinc-500 print:text-zinc-400">Próximo mantenimiento</p>
                <p className="font-medium text-emerald-400 print:text-emerald-700">{receipt.nextMaintenanceKm.toLocaleString('es-CO')} km</p>
              </div>
            )}
            {receipt.nextMaintenanceDate && (
              <div>
                <p className="text-zinc-500 print:text-zinc-400">Próxima fecha</p>
                <p className="font-medium text-emerald-400 print:text-emerald-700">{fmtDate(receipt.nextMaintenanceDate)}</p>
              </div>
            )}
          </div>
        </div>

        {receipt.products.length > 0 && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden print:border-zinc-200 print:bg-zinc-50">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3 print:border-zinc-200">
              <Package className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Repuestos</p>
            </div>
            <div className="grid grid-cols-[1fr_2.25rem_4.75rem_5.25rem] gap-2 border-b border-zinc-800/70 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 print:border-zinc-200">
              <span>Repuesto</span>
              <span className="text-center">Cant.</span>
              <span className="text-right">Precio U.</span>
              <span className="text-right">Subtotal</span>
            </div>
            <div className="divide-y divide-zinc-800 print:divide-zinc-200">
              {receipt.products.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_2.25rem_4.75rem_5.25rem] items-center gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200 print:text-zinc-800">{p.name}</p>
                    {p.brand && <p className="truncate text-xs text-zinc-500">{p.brand}</p>}
                  </div>
                  <p className="text-center text-sm text-zinc-300 print:text-zinc-700">{p.quantity}</p>
                  <p className="text-right text-sm text-zinc-300 print:text-zinc-700">{cop(p.unitPrice)}</p>
                  <p className="text-right text-sm font-semibold text-white print:text-black">{cop(p.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 print:border-emerald-300 print:bg-emerald-50">
          <div className="space-y-2 text-sm">
            {receipt.products.length > 0 && (
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>Subtotal repuestos</span>
                <span>{cop(partsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400 print:text-zinc-600">
              <span>Mano de obra</span>
              <span>{cop(receipt.laborCost)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-700/70 pt-2 text-zinc-300 print:border-zinc-300 print:text-zinc-700">
              <span>Subtotal</span>
              <span>{cop(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-amber-400 print:text-amber-700">
                <span>Descuento</span>
                <span>-{cop(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-700 pt-2 text-base font-bold print:border-zinc-300">
              <span className="text-white print:text-black">TOTAL</span>
              <span className="text-emerald-400 print:text-emerald-700">{cop(total)}</span>
            </div>
            {receipt.paymentMethod && (
              <div className="flex items-center justify-between pt-1 text-zinc-400 print:text-zinc-600">
                <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Método de pago</span>
                <span className="font-medium text-zinc-200 print:text-zinc-700">{PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}</span>
              </div>
            )}
            {receipt.paymentReference && (
              <div className="flex justify-between text-zinc-500">
                <span>Ref.</span>
                <span className="font-mono">{receipt.paymentReference}</span>
              </div>
            )}
          </div>
        </div>

        {receipt.warranty && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 print:border-emerald-300 print:bg-emerald-50">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 print:text-emerald-700" strokeWidth={1.75} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Garantía</p>
              <p className="text-sm font-medium text-zinc-200 print:text-zinc-800">{receipt.warranty}</p>
            </div>
          </div>
        )}

        {receipt.notes && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 print:border-zinc-200 print:bg-zinc-50">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Notas</p>
            <p className="whitespace-pre-line text-sm text-zinc-400 print:text-zinc-600">{receipt.notes}</p>
          </div>
        )}

        {receipt.photos.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Fotos del servicio</p>
            <div className="grid grid-cols-3 gap-2">
              {receipt.photos.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg bg-zinc-800">
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-6 print:border-zinc-200">
          <p className="text-xs text-zinc-600">Generado por MotoBrain AI · {new Date().getFullYear()}</p>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15"
            >
              <Download className="h-3.5 w-3.5" /> Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
