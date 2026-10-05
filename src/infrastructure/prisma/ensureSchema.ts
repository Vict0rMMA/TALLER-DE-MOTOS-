import prisma from './client';

/**
 * Aplica, una sola vez por proceso, columnas que el código ya usa pero que la BD
 * de producción podría no tener todavía (migraciones manuales). Idempotente.
 */
const STATEMENTS = [
  'ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "optInEmail" BOOLEAN NOT NULL DEFAULT true',
];

let pending: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  pending ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    pending = null; // reintentar en la próxima petición
    console.error('[ensureSchema] Error:', err?.message ?? err);
  });
  return pending;
}
