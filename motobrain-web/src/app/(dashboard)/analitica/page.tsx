'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Wrench, DollarSign, Users, AlertTriangle, FileBarChart, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useDashboardKPIs, useTopProducts, useRevenueByMonth } from '@/hooks/use-analytics';
import { useAuthStore } from '@/stores/auth-store';

const AnalyticsCharts = dynamic(
  () => import('@/components/analytics/AnalyticsCharts').then((m) => m.AnalyticsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card h-[280px] skeleton" />
        <div className="glass-card h-[280px] skeleton" />
      </div>
    ),
  },
);

export default function AnaliticaPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: topProducts } = useTopProducts(8);
  const { data: revenueData } = useRevenueByMonth(1);
  const { user } = useAuthStore();

  if (user && user.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <BarChart3 className="h-12 w-12 text-text-tertiary/30" strokeWidth={1.5} />
        <p className="text-lg font-semibold text-text-primary">Acceso restringido</p>
        <p className="text-sm text-text-tertiary max-w-xs">
          La sección de Analítica es exclusiva para el propietario del taller.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica"
        description="KPIs y gráficos del taller — últimos 30 días"
        actions={
          <Link href="/reporte-analitica" target="_blank" className="btn-outline">
            <FileBarChart className="h-4 w-4" />
            Ver reporte
          </Link>
        }
      />

      <div className="kpi-grid">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card h-[88px] skeleton" />
          ))
        ) : (
          <>
            <KPICard title="Servicios del mes" value={kpis?.closedThisMonth ?? 0} icon={Wrench} />
            <KPICard
              title="Ingresos del mes"
              value={<MoneyDisplay value={kpis?.revenueThisMonth ?? 0} />}
              icon={DollarSign}
            />
            <KPICard title="Clientes registrados" value={kpis?.totalCustomers ?? 0} icon={Users} />
            <KPICard title="Stock bajo" value={kpis?.lowStockCount ?? 0} icon={AlertTriangle} variant="warning" />
          </>
        )}
      </div>

      <AnalyticsCharts revenueData={revenueData} topProducts={topProducts} />

      {topProducts && topProducts.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary">Detalle top repuestos</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Producto</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Unidades</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.map((p) => (
                <tr key={p.productId} className="bg-bg-secondary hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 text-text-primary">{p.productName}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-secondary">{p.totalSold}</td>
                  <td className="px-4 py-3 text-right">
                    <MoneyDisplay value={p.revenue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
