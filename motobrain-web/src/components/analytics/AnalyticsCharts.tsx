'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { RevenueByMonth, TopProduct } from '@/types/api.types';

function formatTooltipCurrency(value: unknown): [string, string] {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return [`$${n.toLocaleString('es-CO')}`, 'Ingresos'];
}

interface AnalyticsChartsProps {
  revenueData?: RevenueByMonth[];
  topProducts?: TopProduct[];
}

export function AnalyticsCharts({ revenueData, topProducts }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-text-primary">Ingresos por mes</h2>
        {revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#10b981' }}
                formatter={formatTooltipCurrency}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-text-tertiary">
            Sin datos de ingresos aún.
          </div>
        )}
      </div>

      <div className="glass-card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-text-primary">Top repuestos más vendidos</h2>
        {topProducts && topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 8, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 10, fill: '#71717a' }} width={55} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="totalSold" fill="#10b981" radius={[0, 4, 4, 0]} name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-text-tertiary">
            Sin datos de ventas aún.
          </div>
        )}
      </div>
    </div>
  );
}
