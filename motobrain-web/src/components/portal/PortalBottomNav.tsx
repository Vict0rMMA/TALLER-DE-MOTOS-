'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, Sparkles, Calendar, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalAI } from '@/components/portal/PortalAIProvider';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { useRouter } from 'next/navigation';

export function PortalBottomNav() {
  const pathname = usePathname();
  const { openAI } = usePortalAI();
  const { logout } = usePortalAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login?tab=cliente');
  }

  const tabs = [
    { href: '/portal', icon: Home, label: 'Inicio' },
    { href: '/portal#servicios', icon: Wrench, label: 'Servicios' },
    null,
    { href: '/portal#citas', icon: Calendar, label: 'Citas' },
    { href: null, icon: LogOut, label: 'Salir', action: handleLogout },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md lg:hidden">
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {tabs.map((tab, i) => {
          if (tab === null) {
            return (
              <button
                key="ai"
                type="button"
                onClick={openAI}
                className="relative -mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                aria-label="Hablar con la IA"
              >
                <Sparkles className="h-6 w-6" strokeWidth={2} />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = tab.href && !tab.href.includes('#')
            ? pathname === tab.href
            : false;

          const inner = (
            <>
              <Icon
                className={cn('h-5 w-5 transition-colors', isActive ? 'text-emerald-400' : 'text-zinc-500')}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={cn(
                  'mt-0.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-emerald-400' : 'text-zinc-600',
                )}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.action) {
            return (
              <button
                key={i}
                type="button"
                onClick={tab.action}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={i}
              href={tab.href!}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
