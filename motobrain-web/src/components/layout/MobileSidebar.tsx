'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  X,
} from 'lucide-react';
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
  const isOpen = useSidebarStore((s) => s.isOpen);
  const setOpen = useSidebarStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: badges } = useNavBadges(0);
  const lowStockCount = badges?.lowStock ?? 0;
  const pendingConsultations = badges?.consultations ?? 0;
  const pendingAppointments = badges?.appointments ?? 0;

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'MB';

  // Renderizar solo en cliente (el drawer va por portal a document.body)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Bloquear el scroll del fondo cuando el menú está abierto
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const close = () => setOpen(false);
  const roleLabel =
    user?.role === 'owner' ? 'Propietario' : user?.role === 'mechanic' ? 'Mecánico' : (user?.role ?? '');

  if (!mounted) return null;

  return createPortal(
    <div className="md:hidden">
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={close}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={cn(
          'sidebar-premium fixed left-0 top-0 z-[61] flex h-[100dvh] w-[min(86vw,300px)] flex-col border-r border-border transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="sidebar-logo-block">
          <BrandLogo variant="sidebar" />
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-nav-block overflow-y-auto">
          <p className="sidebar-section-label">Principal</p>
          {PRINCIPAL.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
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
                onClick={close}
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
            onClick={close}
            className={cn('sidebar-item', pathname.startsWith('/configuracion') && 'active')}
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

        <div className="sidebar-footer-block mt-auto space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-3 py-2.5">
            <span className="sidebar-avatar">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{user?.name ?? 'Usuario'}</p>
              <p className="truncate text-xs text-text-tertiary">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 active:scale-[.99]"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
