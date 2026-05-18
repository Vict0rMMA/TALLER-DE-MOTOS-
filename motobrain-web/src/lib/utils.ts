import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SERVICE_TYPES } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Nombre legible (evita TODO MAYÚSCULAS de la BD). */
export function formatDisplayName(name: string | null | undefined, fallback = 'Cliente'): string {
  const raw = name?.trim();
  if (!raw) return fallback;
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Título legible: solo transforma si viene todo en mayúsculas. */
export function formatReadableText(text: string): string {
  const raw = text.trim();
  if (!raw) return raw;
  const letters = raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
  if (letters.length > 2 && letters === letters.toUpperCase()) {
    return formatDisplayName(raw, raw);
  }
  return raw;
}

export function formatServiceLabel(type: string): string {
  return SERVICE_TYPES.find((t) => t.id === type)?.label ?? type.replace(/_/g, ' ');
}

export function formatCOP(value: number): string {
  return `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

/** Formato corto para KPIs en pantallas estrechas (ej. $2,4 M, $50 M). */
export function formatCOPCompact(value: number): string {
  const n = Math.round(value);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    if (m >= 100) return `$${Math.round(m)} M`;
    const s = m.toLocaleString('es-CO', {
      maximumFractionDigits: m >= 10 ? 0 : 1,
      minimumFractionDigits: 0,
    });
    return `$${s} M`;
  }
  if (n >= 100_000) {
    return `$${Math.round(n / 1000).toLocaleString('es-CO')} mil`;
  }
  return formatCOP(n);
}

export function formatPlaca(value: string): string {
  const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}${clean.slice(5)}`;
}

export function formatDateEs(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: es });
}

export function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `motobrain_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'motobrain_token=; path=/; max-age=0';
}
