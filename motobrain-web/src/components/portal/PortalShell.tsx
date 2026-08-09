'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PortalAIProvider, usePortalAI } from '@/components/portal/PortalAIProvider';
import { PortalNavbar } from '@/components/portal/PortalNavbar';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';
import { PwaRegister } from '@/components/portal/PwaRegister';
import { usePortalAuthStore } from '@/stores/portal-auth-store';

function PortalShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isHydrated } = usePortalAuthStore();
  const { openAI } = usePortalAI();

  useEffect(() => {
    if (isHydrated && !token) router.replace('/login?tab=cliente');
  }, [isHydrated, token, router]);

  useEffect(() => {
    if (searchParams.get('ai') === '1' || searchParams.get('ai') === 'open') {
      openAI();
    }
  }, [searchParams, openAI]);

  // Mientras hidrata, o mientras el redirect al login se hace efectivo, hay que
  // mostrar algo: devolver null dejaba la pantalla en negro sin explicacion.
  if (!isHydrated || !token) {
    return (
      <div className="portal-app flex min-h-[100dvh] items-center justify-center bg-zinc-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-sm text-zinc-500">
            {isHydrated ? 'Llevándote al inicio de sesión…' : 'Cargando tu cuenta…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-app flex min-h-[100dvh] flex-col bg-zinc-950 font-sans text-zinc-100">
      <PortalNavbar />
      <div className="portal-container flex-1 py-6 pb-24 md:py-10 md:pb-10">{children}</div>
      <PortalBottomNav />
      <PwaRegister />
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalAIProvider>
      <PortalShellInner>{children}</PortalShellInner>
    </PortalAIProvider>
  );
}
