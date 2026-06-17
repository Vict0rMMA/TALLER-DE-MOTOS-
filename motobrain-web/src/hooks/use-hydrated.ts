'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve true solo después del montaje en cliente.
 * Evita desincronización entre el render del servidor (SSR) y el
 * estado hidratado de stores persistidos (Zustand) que provoca que
 * controles como el menú móvil queden sin responder.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
