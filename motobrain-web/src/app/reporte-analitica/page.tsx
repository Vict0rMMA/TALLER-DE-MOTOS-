'use client';

import { Wrench, DollarSign, Users, AlertTriangle, Printer } from 'lucide-react';
import { useDashboardKPIs, useTopProducts, useRevenueByMonth } from '@/hooks/use-analytics';

function cop(n: number) {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function KpiBox({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 print:border-zinc-200 print:bg-zinc-50">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-xl font-bold text-white print:text-black">{value}</p>
    </div>
  );
}

export default function ReporteAnaliticaPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: topProducts, isLoading: topLoading } = useTopProducts(10);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueByMonth(6);

  const loading = kpisLoading || topLoading || revenueLoading;
  const totalUnits = topProducts?.reduce((s, p) => s + p.totalSold, 0) ?? 0;
  const totalRevenueProducts = topProducts?.reduce((s, p) => s + p.revenue, 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white print:bg-white print:text-black">
      <div className="mx-auto max-w-3xl px-4 py-8 print:py-4">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 print:border-emerald-600 print:bg-emerald-100">
              <Wrench className="h-4 w-4 text-emerald-400 print:text-emerald-700" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-lg font-bold">Reporte de analítica</p>
              <p className="text-sm text-zinc-400 print:text-zinc-600">Generado el {todayLabel()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 print:hidden"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / Guardar PDF
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Resumen del mes</p>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiBox icon={Wrench} label="Servicios" value={kpis?.closedThisMonth ?? 0} />
              <KpiBox icon={DollarSign} label="Ingresos" value={cop(kpis?.revenueThisMonth ?? 0)} />
              <KpiBox icon={Users} label="Clientes" value={kpis?.totalCustomers ?? 0} />
              <KpiBox icon={AlertTriangle} label="Stock bajo" value={kpis?.lowStockCount ?? 0} />
            </div>

            {revenueData && revenueData.length > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden print:border-zinc-200 print:bg-zinc-50">
                <div className="border-b border-zinc-800 px-5 py-3 print:border-zinc-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ingresos por mes</p>
                </div>
                <div className="grid grid-cols-[1fr_6rem_6rem] gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Mes</span>
                  <span className="text-right">Servicios</span>
                  <span className="text-right">Ingresos</span>
                </div>
                <div className="divide-y divide-zinc-800 print:divide-zinc-200">
                  {revenueData.map((r) => (
                    <div key={r.month} className="grid grid-cols-[1fr_6rem_6rem] items-center gap-2 px-5 py-3">
                      <p className="text-sm font-medium capitalize text-zinc-200 print:text-zinc-800">{r.monthLabel}</p>
                      <p className="text-right text-sm text-zinc-400 print:text-zinc-600">{r.serviceCount}</p>
                      <p className="text-right text-sm font-semibold text-white print:text-black">{cop(r.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topProducts && topProducts.length > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden print:border-zinc-200 print:bg-zinc-50">
                <div className="border-b border-zinc-800 px-5 py-3 print:border-zinc-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Top repuestos más vendidos</p>
                </div>
                <div className="grid grid-cols-[1.5rem_1fr_5rem_6rem] gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <span>#</span>
                  <span>Producto</span>
                  <span className="text-right">Unidades</span>
                  <span className="text-right">Ingresos</span>
                </div>
                <div className="divide-y divide-zinc-800 print:divide-zinc-200">
                  {topProducts.map((p, i) => (
                    <div key={p.productId} className="grid grid-cols-[1.5rem_1fr_5rem_6rem] items-center gap-2 px-5 py-3">
                      <p className="text-sm text-zinc-500">{i + 1}</p>
                      <p className="truncate text-sm font-medium text-zinc-200 print:text-zinc-800">{p.productName}</p>
                      <p className="text-right text-sm text-zinc-400 print:text-zinc-600">{p.totalSold}</p>
                      <p className="text-right text-sm font-semibold text-white print:text-black">{cop(p.revenue)}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1.5rem_1fr_5rem_6rem] gap-2 border-t border-emerald-500/20 bg-emerald-500/5 px-5 py-3 print:border-emerald-300 print:bg-emerald-50">
                  <span />
                  <p className="text-sm font-bold text-white print:text-black">Total</p>
                  <p className="text-right text-sm font-bold text-zinc-200 print:text-zinc-800">{totalUnits}</p>
                  <p className="text-right text-sm font-bold text-emerald-400 print:text-emerald-700">{cop(totalRevenueProducts)}</p>
                </div>
              </div>
            )}
          </>
        )}

        <p className="border-t border-zinc-800 pt-6 text-xs text-zinc-600 print:border-zinc-200">
          Generado por MotoBrain AI · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
