import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim() ?? process.env.DIRECT_URL?.trim();
  if (!connectionString) throw new Error('Falta DATABASE_URL');

  const ssl = connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined;
  const pool = new pg.Pool({ connectionString, ssl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const workshop = await (prisma as any).workshop.findFirst({ select: { id: true, name: true } });
  if (!workshop) throw new Error('No hay ningún taller en la base de datos');
  console.log(`Taller: ${workshop.name} (${workshop.id})`);

  const existing = await (prisma as any).product.count({ where: { workshopId: workshop.id } });
  if (existing > 0) {
    console.log(`Ya hay ${existing} productos — sin cambios.`);
    await prisma.$disconnect(); await pool.end(); return;
  }

  await (prisma as any).product.createMany({
    data: [
      { workshopId: workshop.id, sku: 'ACE-10W40-1L',  name: 'Aceite Motor 10W40 1L',        brand: 'Castrol', category: 'lubricantes',  stock: 18, stockMin: 5,  cost: 22000, price: 28000, compatibility: ['Honda','Yamaha','Suzuki'] },
      { workshopId: workshop.id, sku: 'FRE-PAS-HON',   name: 'Pastillas de Freno Honda',      brand: 'EBC',     category: 'frenos',       stock: 2,  stockMin: 4,  cost: 28000, price: 38000, compatibility: ['Honda CB 125','Honda CB 150'] },
      { workshopId: workshop.id, sku: 'FIL-AIR-YAM',   name: 'Filtro de Aire Yamaha FZ',      brand: 'Yamaha',  category: 'filtros',      stock: 6,  stockMin: 3,  cost: 15000, price: 22000, compatibility: ['Yamaha FZ 150','Yamaha FZ 250'] },
      { workshopId: workshop.id, sku: 'BUJ-NGK-CR7',   name: 'Bujía NGK CR7HSA',              brand: 'NGK',     category: 'electricidad', stock: 25, stockMin: 8,  cost: 8000,  price: 14000, compatibility: ['Honda','Yamaha','Suzuki','AKT'] },
      { workshopId: workshop.id, sku: 'CAD-SUZ-GS150',  name: 'Cadena Transmisión Suzuki GS',  brand: 'DID',     category: 'transmision',  stock: 1,  stockMin: 3,  cost: 42000, price: 62000, compatibility: ['Suzuki GS 150','Suzuki EN 125'] },
      { workshopId: workshop.id, sku: 'ACE-GEAR-140',  name: 'Aceite Caja 140 250ml',         brand: 'Mobil',   category: 'lubricantes',  stock: 12, stockMin: 4,  cost: 9000,  price: 15000, compatibility: ['Honda','Yamaha','Suzuki','AKT','TVS'] },
      { workshopId: workshop.id, sku: 'LLA-DEL-UNI',   name: 'Llanta Delantera Universal',    brand: 'Pirelli', category: 'llantas',      stock: 4,  stockMin: 2,  cost: 85000, price: 120000, compatibility: ['Honda','Yamaha','Suzuki'] },
      { workshopId: workshop.id, sku: 'FRE-LIQ-DOT4',  name: 'Líquido de Frenos DOT4',        brand: 'Bosch',   category: 'frenos',       stock: 8,  stockMin: 3,  cost: 12000, price: 18000, compatibility: ['Universal'] },
    ],
  });

  console.log('8 productos creados (2 con stock bajo → alerta en dashboard)');
  await prisma.$disconnect(); await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
