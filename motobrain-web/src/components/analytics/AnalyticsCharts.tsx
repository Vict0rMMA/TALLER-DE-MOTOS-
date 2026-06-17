'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { TrendingUp, Package } from 'lucide-react';
import type { RevenueByMonth, TopProduct } from '@/types/api.types';

function formatTooltipCurrency(value: unknown): [string, string] {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return [`$${n.toLocaleString('es-CO')}`, 'Ingresos'];
}

const tooltipStyle = {
  backgroundColor: 'rgba(17,17,22,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
  padding: '8px 12px',
} as const;

// Paleta para barras: el primero más vivo, va bajando — jerarquía visual.
const BAR_COLORS = ['#10b981', '#14b8a6', '#0ea5a4', '#0d9488', '#0f766e', '#115e59', '#134e4a', '#155e54'];

function ChartHeader({
  icon: Icon,
  title,
  subtitle,
  tint,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="leading-tight">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <p className="text-[11px] text-text-tertiary">{subtitle}</p>
      </div>
    </div>
  );
}

interface AnalyticsChartsProps {
  revenueData?: RevenueByMonth[];
  topProducts?: TopProduct[];
}

export function AnalyticsCharts({ revenueData, topProducts }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card space-y-4 p-5">
        <ChartHeader icon={TrendingUp} title="Ingresos por mes" subtitle="Últimos 6 meses" tint="#10b981" />
        {revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={revenueData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#e4e4e7', fontWeight: 600, marginBottom: 2 }}
                itemStyle={{ color: '#34d399' }}
                cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                formatter={formatTooltipCurrency}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="url(#revStroke)"
                strokeWidth={2.5}
                fill="url(#revFill)"
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#0b0b0e', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[230px] items-center justify-center text-sm text-text-tertiary">
            Sin datos de ingresos aún.
          </div>
        )}
      </div>

      <div className="glass-card space-y-4 p-5">
        <ChartHeader icon={Package} title="Top repuestos más vendidos" subtitle="Por unidades" tint="#14b8a6" />
        {topProducts && topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 12, left: 60, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#e4e4e7', fontWeight: 600, marginBottom: 2 }}
                itemStyle={{ color: '#2dd4bf' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="totalSold" radius={[0, 6, 6, 0]} name="Unidades">
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[230px] items-center justify-center text-sm text-text-tertiary">
            Sin datos de ventas aún.
          </div>
        )}
      </div>
    </div>
  );
}
