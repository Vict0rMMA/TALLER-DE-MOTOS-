'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  if (!isHydrated || !token) return null;

  return (
    <div className="portal-app min-h-[100dvh] bg-zinc-950 font-sans text-zinc-100">
      <PortalNavbar />
      <div className="portal-container py-6 pb-24 md:py-10 md:pb-10">{children}</div>
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
