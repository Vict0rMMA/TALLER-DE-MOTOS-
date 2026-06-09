'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PortalAIChatSheet } from '@/components/portal/PortalAIChatSheet';

interface PortalAIContextValue {
  open: boolean;
  openAI: (initialMessage?: string) => void;
  closeAI: () => void;
  setOpen: (open: boolean) => void;
}

const PortalAIContext = createContext<PortalAIContextValue | null>(null);

export function PortalAIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const openAI = useCallback((msg?: string) => {
    setInitialMessage(msg);
    setOpen(true);
  }, []);
  const closeAI = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openAI, closeAI, setOpen }),
    [open, openAI, closeAI],
  );

  return (
    <PortalAIContext.Provider value={value}>
      {children}
      <PortalAIChatSheet open={open} onOpenChange={setOpen} initialMessage={initialMessage} />
    </PortalAIContext.Provider>
  );
}

export function usePortalAI() {
  const ctx = useContext(PortalAIContext);
  if (!ctx) throw new Error('usePortalAI must be used within PortalAIProvider');
  return ctx;
}
