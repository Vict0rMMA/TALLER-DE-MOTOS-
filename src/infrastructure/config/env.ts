import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variable requerida: ${key}`);
  return value;
};

const PUBLIC_APP_URL_FALLBACK = 'https://taller-mts.vercel.app';

/** localhost o IP privada: sirve en tu PC, pero no en el celular del cliente. */
function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[?::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(
    url,
  );
}

/**
 * URL que se le manda al cliente por correo o WhatsApp. Nunca cae a APP_URL:
 * ese apunta al panel en la red del taller y dejaba enlaces rotos como
 * http://192.168.1.10:3000/login en la bandeja del cliente.
 */
function resolvePublicAppUrl(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
  if (!raw) return PUBLIC_APP_URL_FALLBACK;
  if (isLocalUrl(raw)) {
    console.warn(
      `[env] PUBLIC_APP_URL apunta a una dirección local (${raw}). Se usa ${PUBLIC_APP_URL_FALLBACK} para los enlaces que ve el cliente.`,
    );
    return PUBLIC_APP_URL_FALLBACK;
  }
  return raw;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
  /** Panel en local/LAN (opcional). */
  APP_URL: (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  /** Front público para clientes (correos, recibos por WhatsApp). */
  PUBLIC_APP_URL: resolvePublicAppUrl(),
};
