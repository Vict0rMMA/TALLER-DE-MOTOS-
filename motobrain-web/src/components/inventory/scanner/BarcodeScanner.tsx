'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CameraOff, ShieldAlert, Keyboard, Flashlight, FlashlightOff } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useKeyboardWedge } from '@/hooks/use-keyboard-wedge';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  active: boolean;
  onDetect: (code: string) => void;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Contenido extra debajo de la camara (p. ej. la lista del escaneo rapido). */
  children?: React.ReactNode;
}

function vibrate() {
  try {
    if ('vibrate' in navigator) navigator.vibrate(100);
  } catch {
    // algunos navegadores lo bloquean si no hubo interaccion del usuario
  }
}

/** Pitido corto sintetizado — no requiere ningun archivo de audio. */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1400;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio bloqueado o no soportado: no es critico, el vibrate ya dio feedback
  }
}

export function BarcodeScanner({ active, onDetect, onClose, title, subtitle, children }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleDetect = (code: string) => {
    vibrate();
    beep();
    onDetect(code);
  };

  const { videoRef, status, torchSupported, torchOn, toggleTorch } = useBarcodeScanner({ active, onDetect: handleDetect });

  // Lector USB/Bluetooth: funciona aunque el foco no este en ningun input.
  useKeyboardWedge({ active, onScan: handleDetect });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function submitManual() {
    const code = manualCode.trim();
    if (code.length < 4) return;
    handleDetect(code);
    setManualCode('');
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black sm:inset-6 sm:rounded-2xl sm:border sm:border-border">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          {subtitle && <p className="truncate text-xs text-white/60">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              aria-pressed={torchOn}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                torchOn ? 'bg-accent text-bg-primary' : 'bg-white/10 text-white hover:bg-white/20',
              )}
            >
              {torchOn ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
            <div className="aspect-[3/1.4] w-full max-w-sm rounded-2xl border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {(status === 'starting' || status === 'idle') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm">Activando cámara…</p>
          </div>
        )}

        {status === 'error-permission' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <ShieldAlert className="h-10 w-10 text-warning" />
            <p className="font-medium">Permiso de cámara denegado</p>
            <p className="text-sm text-white/60">
              Actívalo en los ajustes del navegador para este sitio y vuelve a intentar.
            </p>
          </div>
        )}

        {status === 'error-no-camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <CameraOff className="h-10 w-10 text-text-tertiary" />
            <p className="font-medium">No encontramos una cámara</p>
            <p className="text-sm text-white/60">Puedes escribir el código manualmente abajo.</p>
          </div>
        )}

        {status === 'error-insecure' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <ShieldAlert className="h-10 w-10 text-warning" />
            <p className="font-medium">Conexión no segura</p>
            <p className="text-sm text-white/60">
              La cámara solo funciona en sitios con HTTPS. Escribe el código manualmente abajo.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-white/10 bg-bg-secondary p-4 sm:p-5">
        <label className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
          <Keyboard className="h-3.5 w-3.5" /> Código manual (teclado, lector USB o pistola)
        </label>
        <div className="flex gap-2">
          <input
            autoFocus
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submitManual())}
            placeholder="Escribe o escanea con lector USB…"
            className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={submitManual}
            disabled={manualCode.trim().length < 4}
            className={cn(
              'rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-primary transition-opacity',
              manualCode.trim().length < 4 ? 'opacity-40' : 'hover:opacity-90',
            )}
          >
            Buscar
          </button>
        </div>
      </div>

      {children}
    </div>,
    document.body,
  );
}
