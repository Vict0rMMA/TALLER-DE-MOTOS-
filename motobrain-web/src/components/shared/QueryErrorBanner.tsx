'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryErrorBannerProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryErrorBanner({ title, message, onRetry, className }: QueryErrorBannerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      role="alert"
    >
      <div className="flex gap-3 min-w-0">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-200">{title}</p>
          {message ? <p className="mt-1 text-sm leading-relaxed text-red-300/90">{message}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
