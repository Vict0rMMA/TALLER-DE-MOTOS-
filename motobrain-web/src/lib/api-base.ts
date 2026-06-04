const PROD_API = 'https://moto-taller-app.vercel.app/api/v1';
const LOCAL_API = 'http://localhost:4000/api/v1';

export function resolveApiBase(): string {
  if (typeof window === 'undefined') return PROD_API;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' ? LOCAL_API : PROD_API;
}

export function isApiMisconfigured(): boolean { return false; }
export function getApiMisconfigMessage(): string { return ''; }
