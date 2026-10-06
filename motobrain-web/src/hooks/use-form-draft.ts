'use client';

import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Guarda el formulario en localStorage mientras se escribe y lo restaura si
 * la página se recarga a medias (ej: se le dio F5 sin querer). Se borra con
 * clearFormDraft(key) cuando el formulario se envía con éxito.
 */
export function useFormDraft<T extends FieldValues>(key: string, form: UseFormReturn<T>) {
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) form.reset(JSON.parse(raw));
    } catch {
      // localStorage puede fallar (modo privado, datos corruptos); sin drama, no se restaura.
    }
    // Solo al montar: restaurar de nuevo cada vez que cambie `form` lo pisaría mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(key, JSON.stringify(values));
      } catch {
        // noop
      }
    });
    return () => subscription.unsubscribe();
  }, [form, key]);
}

export function clearFormDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}
