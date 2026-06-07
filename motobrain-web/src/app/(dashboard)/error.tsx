'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-text-primary">Algo salió mal</h2>
        <p className="text-sm text-text-tertiary max-w-xs">
          {error.message || 'Ocurrió un error inesperado. Intenta de nuevo.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity"
      >
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
