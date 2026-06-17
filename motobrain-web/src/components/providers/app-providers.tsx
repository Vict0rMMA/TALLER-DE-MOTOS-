'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ServiceWorkerRegister } from '@/components/providers/ServiceWorkerRegister';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3 * 60_000,
            gcTime: 15 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
            refetchInterval: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <NuqsAdapter>
          {children}
          <ServiceWorkerRegister />
          <Toaster
            theme="dark"
            position="top-center"
            richColors
            closeButton
            gap={10}
            toastOptions={{
              classNames: {
                toast: 'rounded-xl border shadow-lg',
                title: 'text-sm font-semibold',
                description: 'text-xs opacity-90',
                closeButton: 'border-border',
              },
            }}
          />
        </NuqsAdapter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
