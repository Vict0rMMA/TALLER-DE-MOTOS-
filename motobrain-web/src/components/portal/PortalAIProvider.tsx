'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PortalAIChatSheet } from '@/components/portal/PortalAIChatSheet';

interface PortalAIContextValue {
  open: boolean;
  openAI: () => void;
  closeAI: () => void;
  setOpen: (open: boolean) => void;
}

const PortalAIContext = createContext<PortalAIContextValue | null>(null);

export function PortalAIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openAI = useCallback(() => setOpen(true), []);
  const closeAI = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openAI, closeAI, setOpen }),
    [open, openAI, closeAI],
  );

  return (
    <PortalAIContext.Provider value={value}>
      {children}
      <PortalAIChatSheet open={open} onOpenChange={setOpen} />
    </PortalAIContext.Provider>
  );
}

export function usePortalAI() {
  const ctx = useContext(PortalAIContext);
  if (!ctx) throw new Error('usePortalAI must be used within PortalAIProvider');
  return ctx;
}
