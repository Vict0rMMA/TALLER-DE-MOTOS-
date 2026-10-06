import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Borra TODOS los datos operativos (clientes, motos, servicios, inventario, citas, etc.).
 * Conserva Workshop y User (para poder iniciar sesión).
 * Uso: CONFIRM=yes npx ts-node-dev --transpile-only scripts/clean-test-data.ts
 */
async function main() {
  if (process.env.CONFIRM !== 'yes') throw new Error('Define CONFIRM=yes para ejecutar la limpieza.');
  const url = process.env.DATABASE_URL?.trim() ?? process.env.DIRECT_URL?.trim();
  if (!url) throw new Error('Falta DATABASE_URL o DIRECT_URL');

  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tables = [
    'Notification', 'WorkshopAppointment', 'ClientConsultation', 'StockMovement',
    'Reminder', 'DiagnosisSession', 'ServiceProduct', 'Service', 'Motorcycle',
    'Customer', 'Product', 'RepairCatalogItem',
  ];
  await prisma.$transaction(
    tables.map((t) => prisma.$executeRawUnsafe(`DELETE FROM "${t}"`)),
  );
  for (const t of tables) {
    const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) n FROM "${t}"`);
    console.log(`${t}: ${n}`);
  }
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
