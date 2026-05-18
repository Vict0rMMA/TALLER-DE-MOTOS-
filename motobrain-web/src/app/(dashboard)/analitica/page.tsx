'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Wrench, DollarSign, Users, AlertTriangle, Download, Loader2, BarChart3 } from 'lucide-react';
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

async function downloadRevenueXlsx(token: string | null, months = 6): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${API_BASE}/analytics/revenue/export?months=${months}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `No se pudo generar el Excel (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? `motobrain-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function col(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function copCol(n: unknown): string {
  const num = typeof n === 'number' ? n : Number(n ?? 0);
  return `"$${num.toLocaleString('es-CO', { maximumFractionDigits: 0 })}"`;
}

function downloadCSV(rows: string[][], filename: string) {
  const sep = ';';
  const body = rows.map((r) => r.join(sep)).join('\r\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function todayLabel() {
  return new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function exportTopProducts(data: { productName: string; totalSold: number; revenue: number }[]) {
  if (!data.length) return;
  const totalUnits = data.reduce((s, r) => s + r.totalSold, 0);
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const rows: string[][] = [
    [col('MOTOBRAIN — TOP REPUESTOS MÁS VENDIDOS'), '', '', ''],
    [col(`Generado el: ${todayLabel()}`), '', '', ''],
    ['', '', '', ''],
    [col('#'), col('PRODUCTO'), col('UNIDADES VENDIDAS'), col('INGRESOS (COP)')],
    ...data.map((r, i) => [col(i + 1), col(r.productName), col(r.totalSold), copCol(r.revenue)]),
    ['', '', '', ''],
    [col('TOTAL'), col(''), col(totalUnits), copCol(totalRevenue)],
  ];
  downloadCSV(rows, `top-repuestos-motobrain-${new Date().toISOString().slice(0, 10)}`);
}

export default function AnaliticaPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: topProducts } = useTopProducts(8);
  const { data: revenueData } = useRevenueByMonth(6);
  const { token, user } = useAuthStore();
  const [exporting, setExporting] = useState(false);

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

  async function handleExportXlsx() {
    setExporting(true);
    try {
      await downloadRevenueXlsx(token, 6);
      toast.success('Excel descargado', {
        description: '3 hojas: Resumen, Ingresos y Top Repuestos. Abre el archivo en Excel.',
      });
    } catch (e) {
      toast.error('Error al exportar', {
        description: e instanceof Error ? e.message : 'Revisa que la API esté en marcha.',
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica"
        description="KPIs y gráficos del taller — últimos 30 días"
        actions={
          <button
            type="button"
            onClick={handleExportXlsx}
            disabled={exporting}
            className="btn-outline"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Generando...' : 'Descargar reporte Excel'}
          </button>
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
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary">Detalle top repuestos</h2>
            <button
              type="button"
              onClick={() => exportTopProducts(topProducts)}
              className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
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
