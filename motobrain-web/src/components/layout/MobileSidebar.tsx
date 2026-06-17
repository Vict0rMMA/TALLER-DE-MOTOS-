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
  LogOut,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BrandLogo } from './BrandLogo';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { cn } from '@/lib/utils';

const PRINCIPAL = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: Package, stockBadge: true },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicios', label: 'Servicios', icon: Wrench },
] as const;

const TOOLS = [
  { href: '/diagnostico', label: 'Diagnóstico', icon: Brain },
  { href: '/consultas', label: 'Consultas', icon: MessageSquare, consultaBadge: true },
  { href: '/citas', label: 'Citas', icon: Calendar, appointmentBadge: true },
  { href: '/analitica', label: 'Analítica', icon: BarChart3 },
] as const;

export function MobileSidebar() {
  const pathname = usePathname();
  const { isOpen, setOpen } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: badges } = useNavBadges(0);
  const lowStockCount = badges?.lowStock ?? 0;
  const pendingConsultations = badges?.consultations ?? 0;
  const pendingAppointments = badges?.appointments ?? 0;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'MB';

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="sidebar-premium flex h-[100dvh] w-[min(100vw-2rem,280px)] flex-col border-r border-border p-0">
        <div className="sidebar-logo-block">
          <BrandLogo variant="sidebar" />
        </div>
        <nav className="sidebar-nav-block overflow-y-auto">
          <p className="sidebar-section-label">Principal</p>
          {PRINCIPAL.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('sidebar-item', active && 'active')}
              >
                <span className={cn('sidebar-icon-wrap shrink-0', active && 'sidebar-icon-wrap-active')}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.25 : 1.85} />
                </span>
                <span className="flex-1">{item.label}</span>
                {'stockBadge' in item && lowStockCount > 0 && (
                  <span className="sidebar-badge-alert">{lowStockCount}</span>
                )}
              </Link>
            );
          })}
          <p className="sidebar-section-label">Herramientas</p>
          {TOOLS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const badge =
              'consultaBadge' in item && item.consultaBadge
                ? pendingConsultations
                : 'appointmentBadge' in item && item.appointmentBadge
                  ? pendingAppointments
                  : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('sidebar-item', active && 'active')}
              >
                <span className={cn('sidebar-icon-wrap shrink-0', active && 'sidebar-icon-wrap-active')}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.25 : 1.85} />
                </span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="sidebar-badge-alert">{badge > 99 ? '99+' : badge}</span>
                )}
              </Link>
            );
          })}
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            className={cn(
              'sidebar-item',
              pathname.startsWith('/configuracion') && 'active',
            )}
          >
            <span
              className={cn(
                'sidebar-icon-wrap shrink-0',
                pathname.startsWith('/configuracion') && 'sidebar-icon-wrap-active',
              )}
            >
              <Settings className="h-[17px] w-[17px]" strokeWidth={1.85} />
            </span>
            <span>Configuración</span>
          </Link>
        </nav>
        <div className="sidebar-footer-block mt-auto">
          <div className="sidebar-user-card">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="sidebar-avatar">{initials}</span>
              <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{user?.name ?? 'Usuario'}</p>
              <p className="truncate text-xs capitalize text-text-tertiary">{user?.role}</p>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-footer-btn sidebar-footer-btn-inline"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
