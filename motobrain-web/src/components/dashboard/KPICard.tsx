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
    bar: 'bg-[--text-tertiary]/40',
    iconBg: 'bg-[--bg-elevated]',
    iconColor: 'text-[--text-tertiary]',
    valueColor: 'text-[--text-primary]',
  },
  accent: {
    bar: 'bg-[--accent]',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    valueColor: 'text-[--text-primary]',
  },
  warning: {
    bar: 'bg-yellow-500',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    valueColor: 'text-yellow-400',
  },
  danger: {
    bar: 'bg-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    valueColor: 'text-red-400',
  },
} as const;

export function KPICard({ title, value, icon: Icon, variant = 'default', sub }: KPICardProps) {
  const v = VARIANT[variant];
  const isPrimitive = typeof value === 'string' || typeof value === 'number';

  return (
    <div className="relative min-h-[92px] overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] p-3 pr-10 transition-colors hover:border-[--border-hover] sm:min-h-[100px] sm:p-4 sm:pr-4">
      <span className={cn('absolute inset-x-0 top-0 h-[2px]', v.bar)} />

      <div
        className={cn(
          'absolute right-2.5 top-3 flex h-7 w-7 items-center justify-center rounded-lg sm:right-4 sm:top-4 sm:h-9 sm:w-9',
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
