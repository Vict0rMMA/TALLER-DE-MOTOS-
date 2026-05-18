import 'dotenv/config';
import bcrypt from 'bcrypt';
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

  const workshopName = process.env.WORKSHOP_NAME?.trim() || 'Mi Taller MotoBrain';
  const email = process.env.ADMIN_EMAIL?.trim() ?? 'admin@realestate.com';
  const password = process.env.ADMIN_PASSWORD?.trim() ?? 'Admin123*';

  const workshops = await prisma.workshop.findMany({ select: { id: true, name: true } });
  let renamedCount = 0;
  for (const w of workshops) {
    if (!workshopNameNeedsUpdate(w.name)) continue;
    const nextName = normalizeWorkshopName(w.name);
    await prisma.workshop.update({ where: { id: w.id }, data: { name: nextName } });
    renamedCount++;
    console.log(`  ${w.name} → ${nextName}`);
  }
  if (renamedCount > 0) {
    console.log(`Talleres actualizados: ${renamedCount}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuario admin ya existe: ${email}`);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const workshop = await prisma.workshop.create({
    data: {
      name: workshopName,
      nit: '900123456-1',
      phone: '+573001234567',
      address: 'Bogotá, Colombia',
      plan: 'free',
    },
  });

  await prisma.user.create({
    data: {
      workshopId: workshop.id,
      name: 'Administrador',
      email,
      passwordHash,
      role: 'owner',
      active: true,
    },
  });

  console.log('Seed OK');
  console.log(`  Taller: ${workshop.name} (${workshop.id})`);
  console.log(`  Login:  ${email} / ${password}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
