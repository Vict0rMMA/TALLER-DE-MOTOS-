const ENV_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const LOCAL_API = 'http://localhost:4000/api/v1';
/** Proxy en Vercel → evita mixed content HTTPS→HTTP. Ver app/api/backend/[...path]/route.ts */
const VERCEL_PROXY_BASE = '/api/backend';

function useVercelProxy(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (process.env.NEXT_PUBLIC_API_USE_PROXY === 'true') return true;
  if (process.env.NEXT_PUBLIC_API_USE_PROXY === 'false') return false;
  try {
    return new URL(ENV_API).protocol === 'http:';
  } catch {
    return true;
  }
}

/**
 * Local: localhost:4000.
 * Vercel + API en HTTP (VPS sin HTTPS): usa /backend (rewrite en next.config).
 * Producción con API HTTPS: NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
 */
export function resolveApiBase(): string {
  if (typeof window === 'undefined') return ENV_API;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API;
  }
  if (useVercelProxy(host)) return VERCEL_PROXY_BASE;
  return ENV_API;
}

/** true si el front está en internet pero la API sigue en localhost (Vercel sin variable). */
export function isApiMisconfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const isLocalFront = host === 'localhost' || host === '127.0.0.1';
  if (isLocalFront) return false;
  if (useVercelProxy(host)) return false;
  const api = ENV_API;
  return api.includes('localhost') || api.includes('127.0.0.1');
}

export function getApiMisconfigMessage(): string {
  return 'Falta NEXT_PUBLIC_API_URL en Vercel o BACKEND_URL=http://TU_IP (puerto 80, sin :4000) para el proxy /backend.';
}
