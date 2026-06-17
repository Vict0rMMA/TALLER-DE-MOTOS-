'use client';

import Link from 'next/link';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { BrandLogo } from './BrandLogo';
import { NotificationPanel } from './NotificationPanel';
import { cn } from '@/lib/utils';

export function TopBar() {
  const setOpen = useSidebarStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'MB';

  return (
    <header className="topbar-premium sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <BrandLogo className="shrink-0 md:hidden" />
      </div>

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <div className="md:hidden">
          <NotificationPanel />
        </div>
        <div className="hidden items-center gap-2 md:flex">
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
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary lg:flex"
            title="Cuenta"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
