'use client';

import { useEffect, useRef } from 'react';

interface UseKeyboardWedgeOptions {
  /** Mientras sea true, escucha el teclado globalmente. */
  active: boolean;
  onScan: (code: string) => void;
  minLength?: number;
  /** Tiempo max. entre teclas para considerarlas parte de una misma lectura (ms). */
  maxIntervalMs?: number;
}

/**
 * Detecta lectores de codigo de barras USB/Bluetooth que funcionan como
 * teclado ("wedge"): escriben el codigo carácter por carácter muy rápido
 * (unos pocos ms entre teclas) y terminan con Enter. No interfiere si el
 * usuario esta escribiendo a mano en un input/textarea normal.
 */
export function useKeyboardWedge({ active, onScan, minLength = 4, maxIntervalMs = 50 }: UseKeyboardWedgeOptions) {
  const bufferRef = useRef('');
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    function isEditableTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    }

    function handleKeyDown(e: KeyboardEvent) {
      // El usuario esta escribiendo a mano en un campo normal: no lo interceptamos.
      if (isEditableTarget(e.target)) return;

      const now = Date.now();
      const elapsed = now - lastKeyAtRef.current;
      lastKeyAtRef.current = now;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        bufferRef.current = '';
        if (code.length >= minLength) {
          e.preventDefault();
          onScan(code);
        }
        return;
      }

      if (e.key.length !== 1) return; // ignora Shift, Tab, flechas, etc.

      // Si paso mucho tiempo desde la tecla anterior, no es una pistola -> reinicia.
      if (bufferRef.current.length > 0 && elapsed > maxIntervalMs) {
        bufferRef.current = '';
      }

      bufferRef.current += e.key;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      bufferRef.current = '';
    };
  }, [active, onScan, minLength, maxIntervalMs]);
}
