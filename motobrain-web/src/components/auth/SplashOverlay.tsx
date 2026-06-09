'use client';

import { useSplashStore } from '@/stores/splash-store';
import { SplashScreen } from '@/components/auth/SplashScreen';

export function SplashOverlay() {
  const active = useSplashStore((s) => s.active);
  return active ? <SplashScreen /> : null;
}
