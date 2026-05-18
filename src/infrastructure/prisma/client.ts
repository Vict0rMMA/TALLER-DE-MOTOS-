import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function resolveDatabaseUrl(): string {
  const pooled = process.env.DATABASE_URL?.trim();
  if (pooled) return pooled;
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  throw new Error('Definí DATABASE_URL en .env (pooler 6543 en Supabase)');
}

const connectionString = resolveDatabaseUrl();
const ssl =
  process.env.DATABASE_SSL === '1' || connectionString.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined;

const pool = new pg.Pool({ connectionString, ssl });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
