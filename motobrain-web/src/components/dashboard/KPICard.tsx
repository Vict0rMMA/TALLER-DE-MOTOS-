'use client';

import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: LucideIcon;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  sub?: string;
}

const VARIANT = {
  default: {
    bar: 'from-zinc-500/60 via-zinc-400/40 to-zinc-500/60',
    iconBg: 'bg-[--bg-elevated] border-[--border]',
    iconColor: 'text-[--text-tertiary]',
    valueColor: 'text-[--text-primary]',
  },
  accent: {
    bar: 'from-emerald-400 via-emerald-500 to-cyan-500',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    valueColor: 'text-[--text-primary]',
  },
  warning: {
    bar: 'from-amber-400 via-amber-500 to-orange-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    valueColor: 'text-amber-400',
  },
  danger: {
    bar: 'from-red-400 via-red-500 to-rose-400',
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconColor: 'text-red-400',
    valueColor: 'text-red-400',
  },
} as const;

export function KPICard({ title, value, icon: Icon, variant = 'default', sub }: KPICardProps) {
  const v = VARIANT[variant];
  const isPrimitive = typeof value === 'string' || typeof value === 'number';

  return (
    <div className="group relative min-h-[92px] overflow-hidden rounded-[14px] border border-[--border] bg-[--bg-card] p-3 pr-10 shadow-sm transition-all duration-200 hover:border-[--border-hover] hover:shadow-md hover:-translate-y-0.5 sm:min-h-[100px] sm:p-4 sm:pr-4">
      {/* Gradient top bar */}
      <span className={cn('absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r', v.bar)} />

      {/* Corner glow for accent */}
      {variant === 'accent' && (
        <span className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/[0.08] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'absolute right-2.5 top-3 flex h-7 w-7 items-center justify-center rounded-lg border sm:right-4 sm:top-4 sm:h-9 sm:w-9',
          v.iconBg,
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', v.iconColor)} strokeWidth={1.75} />
      </div>

      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-[11px] font-medium text-[--text-tertiary] sm:text-[13px]">{title}</p>
        <div
          className={cn(
            'mt-1.5 max-w-full sm:mt-2',
            isPrimitive
              ? cn(
                  'text-[clamp(1.125rem,5.5vw,1.625rem)] font-semibold leading-none tracking-tight tabular-nums',
                  v.valueColor,
                )
              : cn(
                  'kpi-value-slot text-[clamp(0.9375rem,5vw,1.625rem)] font-semibold leading-tight',
                  v.valueColor,
                ),
          )}
        >
          {value}
        </div>
        {sub ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[--text-tertiary] sm:text-xs">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}
