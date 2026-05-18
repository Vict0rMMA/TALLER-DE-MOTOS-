'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Wrench,
  Brain,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BrandLogo } from './BrandLogo';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useDashboardKPIs } from '@/hooks/use-analytics';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PRINCIPAL = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: Package, stockBadge: true },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicios', label: 'Servicios', icon: Wrench },
] as const;

const TOOLS_ALL = [
  { href: '/diagnostico', label: 'Diagnóstico', icon: Brain, ownerOnly: false },
  { href: '/consultas', label: 'Consultas', icon: MessageSquare, ownerOnly: false, consultaBadge: true },
  { href: '/citas', label: 'Citas', icon: Calendar, ownerOnly: false, appointmentBadge: true },
  { href: '/analitica', label: 'Analítica', icon: BarChart3, ownerOnly: true },
] as const;

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  mechanic: 'Mecánico',
  seller: 'Vendedor',
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
  alertCount,
  style,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  badge?: string;
  alertCount?: number;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={cn(
        'sidebar-item',
        active && 'active',
        collapsed && 'sidebar-item-collapsed',
      )}
      title={collapsed ? label : undefined}
    >
      <span className="relative shrink-0">
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
        {collapsed && alertCount !== undefined && alertCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && <span className="sidebar-badge">{badge}</span>}
          {alertCount !== undefined && alertCount > 0 && (
            <span className="sidebar-badge-alert">{alertCount > 99 ? '99+' : alertCount}</span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const isOwner = user?.role === 'owner';
  const TOOLS = TOOLS_ALL.filter((t) => !t.ownerOnly || isOwner);

  const { data: lowStockCount = 0 } = useDashboardKPIs({
    select: (d) => d?.lowStockCount ?? 0,
  });

  const { data: pendingConsultations = 0 } = useQuery({
    queryKey: ['consultations-count'],
    queryFn: () => api.get<{ count: number }>('/consultations/pending-count').then((r: { count: number }) => r.count),
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000,
    refetchIntervalInBackground: false,
  });

  const { data: pendingAppointments = 0 } = useQuery({
    queryKey: ['appointments-count'],
    queryFn: () => api.get<{ count: number }>('/appointments/pending-count').then((r: { count: number }) => r.count),
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000,
    refetchIntervalInBackground: false,
  });

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'MB';

  return (
    <aside
      className={cn(
        'sidebar-premium sidebar-dock shrink-0 transition-all duration-200',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      <div className={cn('sidebar-logo-block', isCollapsed && 'flex-col justify-center gap-2 px-2')}>
        <BrandLogo collapsed={isCollapsed} variant="sidebar" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0 text-text-tertiary hover:text-text-primary',
            !isCollapsed && 'ml-auto',
          )}
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className={cn('sidebar-nav-block', isCollapsed && 'sidebar-nav-block-collapsed')}>
        {!isCollapsed && <p className="sidebar-section-label">Principal</p>}
        {PRINCIPAL.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={isCollapsed}
              alertCount={'stockBadge' in item && item.stockBadge ? lowStockCount : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          );
        })}

        {!isCollapsed && <p className="sidebar-section-label">Herramientas</p>}
        {TOOLS.map((item, i) => {
          const active = pathname.startsWith(item.href);
          const alertCount =
            'consultaBadge' in item && item.consultaBadge
              ? pendingConsultations
              : 'appointmentBadge' in item && item.appointmentBadge
                ? pendingAppointments
                : undefined;
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={isCollapsed}
              alertCount={alertCount}
            />
          );
        })}
      </nav>

      <div className="sidebar-footer-block">
        {isCollapsed ? (
          <div className="sidebar-footer-collapsed">
            <Link
              href="/configuracion"
              className={cn(
                'sidebar-footer-btn',
                pathname.startsWith('/configuracion') && 'sidebar-footer-btn-active',
              )}
              title="Configuración"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
            <Link href="/configuracion" className="sidebar-footer-btn" title={user?.name ?? 'Perfil'}>
              <span className="sidebar-avatar sidebar-avatar-sm">{initials}</span>
            </Link>
            <button
              type="button"
              className="sidebar-footer-btn sidebar-footer-btn-danger"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/configuracion"
              className={cn('sidebar-item', pathname.startsWith('/configuracion') && 'active')}
            >
              <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span>Configuración</span>
            </Link>
            <div className="sidebar-user-card">
              <Link href="/configuracion" className="flex min-w-0 flex-1 items-center gap-3">
                <span className="sidebar-avatar">{initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {user?.name ?? 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-text-tertiary">{ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}</p>
                </div>
              </Link>
              <button
                type="button"
                className="sidebar-footer-btn sidebar-footer-btn-inline"
                onClick={logout}
                title="Cerrar sesión"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
