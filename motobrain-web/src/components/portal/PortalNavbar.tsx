'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, ChevronDown, LogOut, Sparkles } from 'lucide-react';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { usePortalAI } from '@/components/portal/PortalAIProvider';
import { PortalNotificationsBell } from '@/components/portal/PortalNotificationsBell';

export function PortalNavbar() {
  const router = useRouter();
  const { customer, logout } = usePortalAuthStore();
  const { openAI } = usePortalAI();
  const [profileOpen, setProfileOpen] = useState(false);

  const firstName = customer?.name?.split(' ')[0] ?? 'Cliente';
  const initials =
    customer?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'CL';

  function handleLogout() {
    logout();
    router.replace('/login?tab=cliente');
  }

  return (
    <header className="portal-nav sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="portal-container flex h-14 items-center justify-between gap-4">
        <Link href="/portal" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
            <Wrench className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">MotoBrain</span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={openAI} className="portal-ai-btn">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Hablar con la</span>
            <span className="font-bold tracking-wide">IA</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <PortalNotificationsBell />

          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-1 pl-1 pr-2 transition-colors hover:border-zinc-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300">
                {initials}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-none text-white">{firstName}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Cliente</p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Cerrar menú"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
