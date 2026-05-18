import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variable requerida: ${key}`);
  return value;
};

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
  /** Front público para clientes (recibos por WhatsApp). No uses IP local. */
  PUBLIC_APP_URL: (
    process.env.PUBLIC_APP_URL ??
    process.env.APP_URL ??
    'https://taller-mts.vercel.app'
  ).replace(/\/+$/, ''),
};
