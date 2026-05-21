const ENV_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const LOCAL_API = 'http://localhost:4000/api/v1';

/**
 * En el PC (localhost:3000) usa siempre la API en localhost:4000.
 * En producción (Vercel) debe existir NEXT_PUBLIC_API_URL apuntando al VPS con HTTPS.
 */
export function resolveApiBase(): string {
  if (typeof window === 'undefined') return ENV_API;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API;
  }
  return ENV_API;
}

/** true si el front está en internet pero la API sigue en localhost (Vercel sin variable). */
export function isApiMisconfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const isLocalFront = host === 'localhost' || host === '127.0.0.1';
  if (isLocalFront) return false;
  const api = ENV_API;
  return api.includes('localhost') || api.includes('127.0.0.1');
}

export function getApiMisconfigMessage(): string {
  return 'Falta NEXT_PUBLIC_API_URL en Vercel. Debe ser la URL HTTPS de tu API (ej. https://api.tudominio.com/api/v1).';
}
