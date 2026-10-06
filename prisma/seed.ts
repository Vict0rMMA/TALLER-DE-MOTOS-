import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  normalizeWorkshopName,
  workshopNameNeedsUpdate,
} from '../src/infrastructure/workshop/normalizeWorkshopName';

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim() ?? process.env.DIRECT_URL?.trim();
  if (!connectionString) throw new Error('Falta DATABASE_URL o DIRECT_URL');

  const ssl = connectionString.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined;

  const pool = new pg.Pool({ connectionString, ssl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  // --- 1. Normalizar nombres de talleres existentes ---
  const workshops = await prisma.workshop.findMany({ select: { id: true, name: true } });
  let renamedCount = 0;
  for (const w of workshops) {
    if (!workshopNameNeedsUpdate(w.name)) continue;
    const nextName = normalizeWorkshopName(w.name);
    await prisma.workshop.update({ where: { id: w.id }, data: { name: nextName } });
    renamedCount++;
    console.log(`  ${w.name} → ${nextName}`);
  }
  if (renamedCount > 0) console.log(`Talleres actualizados: ${renamedCount}`);

  // --- 2. Crear taller + admin si no existe ---
  const workshopName = process.env.WORKSHOP_NAME?.trim() || 'Taller MotoBrain';
  const email = process.env.ADMIN_EMAIL?.trim() ?? 'admin@motobrain.co';
  const password = process.env.ADMIN_PASSWORD?.trim() ?? 'Admin123*';

  let adminUser = await prisma.user.findUnique({ where: { email } });

  let workshop: { id: string };

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(password, 10);
    workshop = await prisma.workshop.create({
      data: {
        name: workshopName,
        nit: '900123456-1',
        phone: '+573001234567',
        address: 'Bogotá, Colombia',
        plan: 'free',
      },
    });
    adminUser = await prisma.user.create({
      data: {
        workshopId: workshop.id,
        name: 'Administrador',
        email,
        passwordHash,
        role: 'owner',
        active: true,
      },
    });
    console.log('Admin creado');
    console.log(`  Taller: ${workshopName} (${workshop.id})`);
    console.log(`  Login:  ${email} / ${password}`);
  } else {
    const ws = await prisma.workshop.findFirst({ where: { id: adminUser.workshopId } });
    if (!ws) throw new Error('El admin existe pero su taller no');
    workshop = ws;
    console.log(`Admin ya existe: ${email} → taller ${ws.name} (${ws.id})`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
