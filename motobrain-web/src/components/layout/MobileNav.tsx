'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Brain,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { MOBILE_NAV_ITEMS } from '@/lib/constants';

const ICONS = {
  LayoutDashboard,
  Wrench,
  Brain,
  MessageSquare,
  Calendar,
} as const;

export function MobileNav() {
  const pathname = usePathname();

  const { data: badges } = useNavBadges(1500);
  const pendingConsultations = badges?.consultations ?? 0;
  const pendingAppointments = badges?.appointments ?? 0;

  const centerIndex = Math.floor(MOBILE_NAV_ITEMS.length / 2);

  return (
    <nav className="mobile-nav-bar fixed bottom-0 left-0 right-0 z-50 flex items-end border-t border-border bg-bg-secondary pb-safe md:hidden">
      {MOBILE_NAV_ITEMS.map((item, i) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const badge =
          'consultaBadge' in item && item.consultaBadge
            ? pendingConsultations
            : 'appointmentBadge' in item && item.appointmentBadge
              ? pendingAppointments
              : 0;

        if (i === centerIndex) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative -mt-5 flex flex-1 flex-col items-center"
              aria-label={item.label}
            >
              <span
                className={cn(
                  'flex h-14 w-14 flex-col items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95',
                  active
                    ? 'bg-emerald-400 shadow-emerald-400/40'
                    : 'bg-emerald-500 shadow-emerald-500/30',
                )}
              >
                <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
              </span>
              <span className="mt-1 pb-1 text-[10px] font-medium text-emerald-400">{item.label.split(' ')[0]}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              active ? 'text-accent' : 'text-text-tertiary',
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span className="truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
