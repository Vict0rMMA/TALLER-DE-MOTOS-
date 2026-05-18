'use client';

import type React from 'react';
import {
  ArrowRight,
  Wrench,
  DollarSign,
  Users,
  AlertTriangle,
  Plus,
  Brain,
  BarChart3,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { KPICard } from '@/components/dashboard/KPICard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useDashboardKPIs } from '@/hooks/use-analytics';
import { useLowStockProducts } from '@/hooks/use-products';
import { useServices } from '@/hooks/use-services';
import { useAuthStore } from '@/stores/auth-store';
import { cn, formatDisplayName, formatReadableText, formatServiceLabel } from '@/lib/utils';
import type { Service } from '@/types/entities';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayFull() {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  open: { label: 'Abierto', icon: Circle, cls: 'text-blue-400' },
  in_progress: { label: 'En progreso', icon: Loader2, cls: 'text-yellow-400' },
  closed: { label: 'Cerrado', icon: CheckCircle2, cls: 'text-emerald-400' },
  cancelled: { label: 'Cancelado', icon: Circle, cls: 'text-[--text-tertiary]' },
};

function PanelHeader({
  icon: Icon,
  iconClassName,
  title,
  href,
  linkLabel,
  badge,
}: {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  href: string;
  linkLabel: string;
  badge?: number;
}) {
  return (
    <div className="dashboard-panel-header">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className={cn('h-4 w-4 shrink-0', iconClassName ?? 'text-[--text-tertiary]')} strokeWidth={1.75} />
        <h2 className="dashboard-panel-title">{title}</h2>
        {badge != null && badge > 0 ? (
          <span className="rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-yellow-400">
            {badge}
          </span>
        ) : null}
      </div>
      <Link href={href} className="dashboard-panel-link">
        {linkLabel}
      </Link>
    </div>
  );
}

function ServiceRow({ s }: { s: Service }) {
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.open;
  const Icon = cfg.icon;
  const placa = s.placa ?? s.motorcycleId.slice(-6).toUpperCase();
  const date = new Date(s.openedAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Link href={`/servicios/${s.id}`} className="dashboard-list-row group">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cfg.cls)} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="dashboard-list-primary min-w-0 truncate">
            <span className="dashboard-list-placa">{placa}</span>
            <span className="font-normal text-[--text-tertiary]"> · </span>
            {formatServiceLabel(s.type)}
          </p>
          <MoneyDisplay value={s.total} className="dashboard-list-amount" />
        </div>
        <p className="dashboard-list-meta truncate">
          {formatDisplayName(s.customerName)}
          <span className="text-[--text-tertiary]"> · </span>
          {date}
        </p>
      </div>
      <ArrowRight
        className="mt-1 h-3.5 w-3.5 shrink-0 text-[--text-tertiary] opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  );
}

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: lowStockData } = useLowStockProducts(6);
  const { data: recentData } = useServices({ limit: 5 });

  const lowStock = lowStockData?.data ?? [];
  const recentServices = recentData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-[--text-primary] sm:text-[22px]">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'bienvenido'} 👋
          </h1>
          <p className="mt-0.5 text-xs capitalize text-[--text-tertiary] sm:text-[13px]">{todayFull()}</p>
        </div>
        <Link
          href="/servicios/nuevo"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[--accent] px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Link>
      </div>

      <div className="kpi-grid">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[108px] animate-pulse rounded-xl border border-[--border] bg-[--bg-card]" />
          ))
        ) : (
          <>
            <KPICard
              title="Servicios del mes"
              value={kpis?.closedThisMonth ?? 0}
              icon={Wrench}
              variant="default"
              sub="servicios cerrados"
            />
            <KPICard
              title="Ingresos del mes"
              value={<MoneyDisplay value={kpis?.revenueThisMonth ?? 0} />}
              icon={DollarSign}
              variant="accent"
              sub="ingresos netos COP"
            />
            <KPICard
              title="Clientes registrados"
              value={kpis?.totalCustomers ?? 0}
              icon={Users}
              variant="default"
              sub="en la plataforma"
            />
            <KPICard
              title="Stock bajo"
              value={kpis?.lowStockCount ?? 0}
              icon={AlertTriangle}
              variant={kpis && kpis.lowStockCount > 0 ? 'warning' : 'default'}
              sub={kpis?.lowStockCount ? 'requiere atención' : 'todo en orden'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 min-[400px]:gap-3">
        {[
          { href: '/clientes/nuevo', icon: Users, label: 'Nuevo cliente', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { href: '/diagnostico', icon: Brain, label: 'Diagnóstico IA', color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { href: '/analitica', icon: BarChart3, label: 'Ver analítica', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ href, icon: Icon, label, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl border border-[--border] bg-[--bg-card] px-3 py-3 transition-all hover:border-[--border-hover] hover:bg-[--bg-elevated] min-[400px]:gap-3 min-[400px]:px-4 min-[400px]:py-3.5"
          >
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
              <Icon className={cn('h-4 w-4', color)} strokeWidth={1.75} />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[--text-secondary]">{label}</span>
            <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-[--text-tertiary] min-[400px]:block" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card]">
          <PanelHeader icon={Clock} title="Servicios recientes" href="/servicios" linkLabel="Ver todos" />

          <div className="dashboard-list">
            {recentServices.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Wrench className="mb-2 h-8 w-8 text-[--text-tertiary]" strokeWidth={1.5} />
                <p className="text-sm text-[--text-secondary]">Aún no hay servicios registrados</p>
                <Link href="/servicios/nuevo" className="dashboard-panel-link mt-3">
                  Crear el primero →
                </Link>
              </div>
            ) : (
              recentServices.map((s) => <ServiceRow key={s.id} s={s} />)
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[--border] bg-[--bg-card]">
          <PanelHeader
            icon={AlertTriangle}
            iconClassName={lowStock.length > 0 ? 'text-yellow-400' : 'text-[--text-tertiary]'}
            title="Stock bajo"
            href="/inventario"
            linkLabel="Ver inventario"
            badge={lowStock.length > 0 ? lowStock.length : undefined}
          />

          <div className="dashboard-list">
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" strokeWidth={1.5} />
                <p className="text-sm text-[--text-secondary]">Todo el inventario está al día</p>
              </div>
            ) : (
              lowStock.slice(0, 6).map((p) => {
                const pct = Math.min(100, Math.round((p.stock / (p.stockMin * 2)) * 100));
                const barColor =
                  p.stock === 0 ? 'bg-red-500' : p.stock < p.stockMin ? 'bg-yellow-500' : 'bg-emerald-500';

                return (
                  <Link key={p.id} href={`/inventario/${p.id}`} className="dashboard-list-row group">
                    <div className="min-w-0 flex-1">
                      <p className="dashboard-list-primary truncate leading-snug">
                        {formatReadableText(p.name)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 max-w-[88px] overflow-hidden rounded-full bg-[--bg-hover]">
                          <div
                            className={cn('h-full rounded-full transition-all', barColor)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 tabular-nums">
                          <span className={cn('text-xs font-semibold', p.stock <= 0 ? 'text-red-400' : 'text-yellow-400')}>
                            {p.stock} u
                          </span>
                          <span className="text-[10px] text-[--text-tertiary]">·</span>
                          <span className="text-[10px] text-[--text-tertiary]">mín {p.stockMin}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        p.stock === 0
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-yellow-500/15 text-yellow-400',
                      )}
                    >
                      {p.stock === 0 ? 'Agotado' : 'Bajo'}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
