'use client';

import Link from 'next/link';
import { Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useFilterStore } from '@/stores/filter-store';
import { useAuthStore } from '@/stores/auth-store';
import { BrandLogo } from './BrandLogo';
import { NotificationPanel } from './NotificationPanel';
import { cn } from '@/lib/utils';

export function TopBar() {
  const toggle = useSidebarStore((s) => s.toggle);
  const { globalSearch, setGlobalSearch } = useFilterStore();
  const user = useAuthStore((s) => s.user);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'MB';

  return (
    <header className="topbar-premium sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={toggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <BrandLogo className="md:hidden shrink-0" />
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Buscar clientes, productos, placas..."
            className="topbar-search"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <div className="md:hidden">
          <NotificationPanel />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <NotificationPanel />
          <Link
            href="/configuracion"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-border',
              'bg-bg-input text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-bg-hover',
            )}
            title={user?.name ?? 'Perfil'}
          >
            {initials}
          </Link>
          <Link
            href="/configuracion"
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Cuenta"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
