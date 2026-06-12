'use client';

import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';

export function PwaRegister() {
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Mostrar hint de instalación en iOS Safari (solo si no está instalada aún)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    const dismissed = sessionStorage.getItem('pwa-ios-hint');

    if (isIos && !isInStandalone && !dismissed) {
      // Mostrar después de 3 segundos para no interrumpir la carga
      const t = setTimeout(() => setShowIosHint(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem('pwa-ios-hint', '1');
    setShowIosHint(false);
  }

  if (!showIosHint) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Share className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Instala la app</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
            Toca <Share className="inline h-3.5 w-3.5 align-middle" strokeWidth={2} /> y luego{' '}
            <strong className="text-zinc-300">"Agregar a pantalla de inicio"</strong> para acceder
            rápido sin abrir el navegador.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
