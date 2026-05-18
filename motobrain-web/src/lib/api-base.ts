const ENV_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const LOCAL_API = 'http://localhost:4000/api/v1';

/**
 * En el PC (localhost:3000) usa siempre la API en localhost:4000.
 * En el celular (IP:3000) usa NEXT_PUBLIC_API_URL (IP de la PC en la red).
 */
export function resolveApiBase(): string {
  if (typeof window === 'undefined') return ENV_API;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API;
  }
  return ENV_API;
}
