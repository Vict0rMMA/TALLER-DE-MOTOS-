const PROD_API = 'https://moto-taller-app.vercel.app/api/v1';
const LOCAL_API = 'http://localhost:4000/api/v1';
const ENV_API = process.env.NEXT_PUBLIC_API_URL?.trim() || PROD_API;

/** Proxy interno de Next.js — solo para llamadas HTTP en producción */
const VERCEL_PROXY_BASE = '/api/backend';

export function resolveApiBase(): string {
  if (typeof window === 'undefined') return ENV_API;
  const host = window.location.hostname;

  if (host === 'localhost' || host === '127.0.0.1') return LOCAL_API;

  // En producción: si la URL es HTTPS llama directo (CORS permitido en moto-taller-app)
  // Si es HTTP usa el proxy interno para evitar mixed-content
  try {
    return new URL(ENV_API).protocol === 'https:' ? ENV_API : VERCEL_PROXY_BASE;
  } catch {
    return VERCEL_PROXY_BASE;
  }
}

export function isApiMisconfigured(): boolean {
  return false;
}

export function getApiMisconfigMessage(): string {
  return '';
}
