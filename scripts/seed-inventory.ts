import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const WORKSHOP_ID = 'cmp97rhdw0000ewgprhrhxn3v';

const PRODUCTS = [
  // ── ACEITES Y LUBRICANTES ──────────────────────────────────────────────────
  { sku: 'ACE-001', name: 'Aceite Motor 4T 20W-50 1L', brand: 'Castrol', category: 'Aceites y lubricantes', stock: 48, stockMin: 10, cost: 18000, price: 28000, compatibility: ['AKT', 'Bajaj', 'Honda', 'Yamaha', 'Suzuki'] },
  { sku: 'ACE-002', name: 'Aceite Motor 4T 10W-40 1L', brand: 'Motul', category: 'Aceites y lubricantes', stock: 36, stockMin: 8, cost: 24000, price: 38000, compatibility: ['Honda', 'Yamaha', 'KTM', 'Royal Enfield'] },
  { sku: 'ACE-003', name: 'Aceite Motor Sintético 5W-30 1L', brand: 'Shell Helix', category: 'Aceites y lubricantes', stock: 24, stockMin: 6, cost: 30000, price: 48000, compatibility: ['KTM', 'Royal Enfield', 'Honda CBR'] },
  { sku: 'ACE-004', name: 'Aceite Transmisión 80W-90 1L', brand: 'Valvoline', category: 'Aceites y lubricantes', stock: 20, stockMin: 5, cost: 16000, price: 26000, compatibility: ['Bajaj', 'Hero', 'TVS'] },
  { sku: 'ACE-005', name: 'Aceite Horquilla 10W', brand: 'Putoline', category: 'Aceites y lubricantes', stock: 15, stockMin: 4, cost: 22000, price: 35000, compatibility: ['Universal'] },
  { sku: 'ACE-006', name: 'Aceite Frenos DOT 4 500ml', brand: 'ATE', category: 'Aceites y lubricantes', stock: 18, stockMin: 5, cost: 14000, price: 22000, compatibility: ['Universal'] },
  { sku: 'ACE-007', name: 'Grasa Multipropósito 500g', brand: 'WD-40', category: 'Aceites y lubricantes', stock: 12, stockMin: 3, cost: 18000, price: 30000, compatibility: ['Universal'] },
  { sku: 'ACE-008', name: 'Lubricante Cadena Spray 400ml', brand: 'Motul', category: 'Aceites y lubricantes', stock: 25, stockMin: 6, cost: 20000, price: 32000, compatibility: ['Universal'] },

  // ── FILTROS ────────────────────────────────────────────────────────────────
  { sku: 'FIL-001', name: 'Filtro Aceite AKT TTR 150', brand: 'AKT', category: 'Filtros', stock: 30, stockMin: 8, cost: 8000, price: 15000, compatibility: ['AKT TTR 150', 'AKT NKD 125'] },
  { sku: 'FIL-002', name: 'Filtro Aceite Honda CB 125F', brand: 'Honda', category: 'Filtros', stock: 22, stockMin: 6, cost: 9000, price: 16000, compatibility: ['Honda CB 125F', 'Honda CB 150R'] },
  { sku: 'FIL-003', name: 'Filtro Aceite Bajaj Pulsar', brand: 'Bajaj', category: 'Filtros', stock: 28, stockMin: 8, cost: 8500, price: 15000, compatibility: ['Bajaj Pulsar 135', 'Bajaj Pulsar 180', 'Bajaj Pulsar 200'] },
  { sku: 'FIL-004', name: 'Filtro Aire AKT NKD 125', brand: 'AKT', category: 'Filtros', stock: 18, stockMin: 5, cost: 12000, price: 22000, compatibility: ['AKT NKD 125', 'AKT TT 125'] },
  { sku: 'FIL-005', name: 'Filtro Aire Yamaha YBR 125', brand: 'Yamaha', category: 'Filtros', stock: 14, stockMin: 4, cost: 14000, price: 25000, compatibility: ['Yamaha YBR 125', 'Yamaha YBR 125G'] },
  { sku: 'FIL-006', name: 'Filtro Aire Honda CB 125F', brand: 'Honda', category: 'Filtros', stock: 16, stockMin: 4, cost: 13000, price: 23000, compatibility: ['Honda CB 125F'] },
  { sku: 'FIL-007', name: 'Filtro Aire Universal Espuma', brand: 'Genérico', category: 'Filtros', stock: 35, stockMin: 10, cost: 6000, price: 12000, compatibility: ['Universal'] },
  { sku: 'FIL-008', name: 'Filtro Combustible Universal', brand: 'Genérico', category: 'Filtros', stock: 20, stockMin: 5, cost: 5000, price: 10000, compatibility: ['Universal'] },

  // ── FRENOS ─────────────────────────────────────────────────────────────────
  { sku: 'FRE-001', name: 'Pastillas Freno Delantero Honda CB 125F', brand: 'Honda', category: 'Frenos', stock: 15, stockMin: 4, cost: 22000, price: 40000, compatibility: ['Honda CB 125F', 'Honda CB 150R'] },
  { sku: 'FRE-002', name: 'Pastillas Freno Delantero Yamaha YBR', brand: 'Yamaha', category: 'Frenos', stock: 12, stockMin: 3, cost: 20000, price: 36000, compatibility: ['Yamaha YBR 125', 'Yamaha FZ 16'] },
  { sku: 'FRE-003', name: 'Pastillas Freno Trasero Universal', brand: 'Genérico', category: 'Frenos', stock: 25, stockMin: 6, cost: 14000, price: 25000, compatibility: ['Universal'] },
  { sku: 'FRE-004', name: 'Disco Freno Delantero AKT', brand: 'AKT', category: 'Frenos', stock: 8, stockMin: 2, cost: 55000, price: 95000, compatibility: ['AKT NKD 125', 'AKT TTR 150'] },
  { sku: 'FRE-005', name: 'Disco Freno Delantero Honda', brand: 'Honda', category: 'Frenos', stock: 6, stockMin: 2, cost: 65000, price: 115000, compatibility: ['Honda CB 125F', 'Honda CB 150R'] },
  { sku: 'FRE-006', name: 'Zapatas Freno Tambor Trasero', brand: 'Genérico', category: 'Frenos', stock: 30, stockMin: 8, cost: 10000, price: 18000, compatibility: ['Universal'] },
  { sku: 'FRE-007', name: 'Manguera Freno Hidráulico 600mm', brand: 'Genérico', category: 'Frenos', stock: 10, stockMin: 3, cost: 18000, price: 32000, compatibility: ['Universal'] },

  // ── TRANSMISIÓN ────────────────────────────────────────────────────────────
  { sku: 'TRA-001', name: 'Kit Arrastre AKT NKD 125 (Cadena+Piñones)', brand: 'AKT', category: 'Transmisión', stock: 10, stockMin: 3, cost: 65000, price: 120000, compatibility: ['AKT NKD 125'] },
  { sku: 'TRA-002', name: 'Kit Arrastre Honda CB 125F', brand: 'Honda', category: 'Transmisión', stock: 8, stockMin: 2, cost: 72000, price: 130000, compatibility: ['Honda CB 125F'] },
  { sku: 'TRA-003', name: 'Kit Arrastre Bajaj Pulsar 200', brand: 'Bajaj', category: 'Transmisión', stock: 6, stockMin: 2, cost: 85000, price: 155000, compatibility: ['Bajaj Pulsar 200', 'Bajaj Pulsar 220'] },
  { sku: 'TRA-004', name: 'Cadena 428H 120 Eslabones', brand: 'DID', category: 'Transmisión', stock: 20, stockMin: 5, cost: 28000, price: 52000, compatibility: ['Universal 125cc'] },
  { sku: 'TRA-005', name: 'Piñón Corona 125cc 37T', brand: 'Genérico', category: 'Transmisión', stock: 15, stockMin: 4, cost: 22000, price: 38000, compatibility: ['Universal 125cc'] },
  { sku: 'TRA-006', name: 'Kit Embrague Completo Bajaj Boxer', brand: 'Bajaj', category: 'Transmisión', stock: 8, stockMin: 2, cost: 75000, price: 140000, compatibility: ['Bajaj Boxer CT 100', 'Bajaj Boxer BM 150'] },
  { sku: 'TRA-007', name: 'Disco Embrague Universal 125cc', brand: 'Genérico', category: 'Transmisión', stock: 12, stockMin: 3, cost: 18000, price: 32000, compatibility: ['Universal 125cc'] },

  // ── ELÉCTRICO ──────────────────────────────────────────────────────────────
  { sku: 'ELE-001', name: 'Batería 12V 5Ah (Motos 125cc)', brand: 'Yuasa', category: 'Eléctrico', stock: 10, stockMin: 3, cost: 55000, price: 95000, compatibility: ['AKT', 'Honda', 'Yamaha 125cc'] },
  { sku: 'ELE-002', name: 'Batería 12V 9Ah (Motos 150-200cc)', brand: 'Yuasa', category: 'Eléctrico', stock: 8, stockMin: 2, cost: 90000, price: 155000, compatibility: ['Bajaj Pulsar', 'Yamaha FZ', 'KTM Duke 200'] },
  { sku: 'ELE-003', name: 'Bujía NGK CR7HSA (125cc)', brand: 'NGK', category: 'Eléctrico', stock: 50, stockMin: 15, cost: 6500, price: 12000, compatibility: ['Honda', 'Yamaha', 'AKT 125cc'] },
  { sku: 'ELE-004', name: 'Bujía NGK CR8E (150-200cc)', brand: 'NGK', category: 'Eléctrico', stock: 35, stockMin: 10, cost: 9000, price: 16000, compatibility: ['Bajaj Pulsar 180', 'Bajaj Pulsar 200', 'KTM'] },
  { sku: 'ELE-005', name: 'Bujía Iridio NGK CPR7EAIX', brand: 'NGK', category: 'Eléctrico', stock: 20, stockMin: 5, cost: 22000, price: 42000, compatibility: ['Universal'] },
  { sku: 'ELE-006', name: 'Regulador Voltaje AKT Universal', brand: 'Genérico', category: 'Eléctrico', stock: 10, stockMin: 3, cost: 30000, price: 58000, compatibility: ['AKT', 'Bajaj', 'Universal'] },
  { sku: 'ELE-007', name: 'CDI Digital Universal 4T', brand: 'Genérico', category: 'Eléctrico', stock: 8, stockMin: 2, cost: 35000, price: 70000, compatibility: ['Universal 125cc'] },
  { sku: 'ELE-008', name: 'Bobina Encendido Universal', brand: 'Genérico', category: 'Eléctrico', stock: 7, stockMin: 2, cost: 28000, price: 52000, compatibility: ['Universal'] },
  { sku: 'ELE-009', name: 'Faro LED Universal Moto', brand: 'Genérico', category: 'Eléctrico', stock: 12, stockMin: 3, cost: 45000, price: 80000, compatibility: ['Universal'] },
  { sku: 'ELE-010', name: 'Intermitentes LED Par', brand: 'Genérico', category: 'Eléctrico', stock: 15, stockMin: 4, cost: 18000, price: 32000, compatibility: ['Universal'] },

  // ── MOTOR ──────────────────────────────────────────────────────────────────
  { sku: 'MOT-001', name: 'Kit Piston y Aros AKT 125cc STD', brand: 'AKT', category: 'Motor', stock: 6, stockMin: 2, cost: 65000, price: 120000, compatibility: ['AKT NKD 125', 'AKT TT 125'] },
  { sku: 'MOT-002', name: 'Kit Piston y Aros Honda GY6 125cc', brand: 'Genérico', category: 'Motor', stock: 5, stockMin: 2, cost: 55000, price: 100000, compatibility: ['Honda GY6 125cc', 'Universal 125cc'] },
  { sku: 'MOT-003', name: 'Empaque Culata Universal 125cc', brand: 'Genérico', category: 'Motor', stock: 20, stockMin: 5, cost: 8000, price: 15000, compatibility: ['Universal 125cc'] },
  { sku: 'MOT-004', name: 'Kit Empaque Motor Completo 125cc', brand: 'Genérico', category: 'Motor', stock: 12, stockMin: 3, cost: 22000, price: 40000, compatibility: ['Universal 125cc'] },
  { sku: 'MOT-005', name: 'Carburador Completo 26mm', brand: 'Mikuni', category: 'Motor', stock: 8, stockMin: 2, cost: 65000, price: 120000, compatibility: ['Universal 125-150cc'] },
  { sku: 'MOT-006', name: 'Carburador Completo 24mm', brand: 'Keihin', category: 'Motor', stock: 6, stockMin: 2, cost: 55000, price: 105000, compatibility: ['Honda CB 125F', 'AKT NKD 125'] },
  { sku: 'MOT-007', name: 'Kit Reparación Carburador Universal', brand: 'Genérico', category: 'Motor', stock: 25, stockMin: 6, cost: 12000, price: 22000, compatibility: ['Universal'] },
  { sku: 'MOT-008', name: 'Termostato Universal Moto Refrigerada', brand: 'Genérico', category: 'Motor', stock: 5, stockMin: 2, cost: 18000, price: 35000, compatibility: ['Motos refrigeración líquida'] },

  // ── SUSPENSIÓN ─────────────────────────────────────────────────────────────
  { sku: 'SUS-001', name: 'Amortiguador Trasero Universal 335mm', brand: 'YSS', category: 'Otros', stock: 8, stockMin: 2, cost: 75000, price: 140000, compatibility: ['Universal'] },
  { sku: 'SUS-002', name: 'Reten Horquilla 33mm Par', brand: 'Genérico', category: 'Otros', stock: 20, stockMin: 5, cost: 15000, price: 28000, compatibility: ['Universal 33mm'] },
  { sku: 'SUS-003', name: 'Aceite Horquilla Kit Completo', brand: 'Motul', category: 'Otros', stock: 12, stockMin: 3, cost: 25000, price: 45000, compatibility: ['Universal'] },
  { sku: 'SUS-004', name: 'Buje Silencioso Amortiguador', brand: 'Genérico', category: 'Otros', stock: 30, stockMin: 8, cost: 4000, price: 8000, compatibility: ['Universal'] },

  // ── LLANTAS ────────────────────────────────────────────────────────────────
  { sku: 'LLA-001', name: 'Llanta Delantera 2.75-17 Tubeless', brand: 'Pirelli', category: 'Llantas', stock: 10, stockMin: 2, cost: 95000, price: 165000, compatibility: ['125cc standard'] },
  { sku: 'LLA-002', name: 'Llanta Trasera 3.00-17 Tubeless', brand: 'Pirelli', category: 'Llantas', stock: 8, stockMin: 2, cost: 110000, price: 190000, compatibility: ['125cc standard'] },
  { sku: 'LLA-003', name: 'Llanta Delantera 100/80-17', brand: 'Maxxis', category: 'Llantas', stock: 6, stockMin: 2, cost: 120000, price: 210000, compatibility: ['150-200cc sport'] },
  { sku: 'LLA-004', name: 'Llanta Trasera 130/70-17', brand: 'Maxxis', category: 'Llantas', stock: 5, stockMin: 2, cost: 145000, price: 250000, compatibility: ['150-200cc sport'] },
  { sku: 'LLA-005', name: 'Neumático 2.50-17 Con Cámara', brand: 'Mitas', category: 'Llantas', stock: 12, stockMin: 3, cost: 55000, price: 95000, compatibility: ['Universal 125cc con cámara'] },
  { sku: 'LLA-006', name: 'Cámara Aire 2.75-17', brand: 'Genérico', category: 'Llantas', stock: 20, stockMin: 5, cost: 12000, price: 22000, compatibility: ['Universal 17 pulgadas'] },

  // ── VARIOS / OTROS ─────────────────────────────────────────────────────────
  { sku: 'OTR-001', name: 'Espejo Retrovisor Universal Par', brand: 'Genérico', category: 'Otros', stock: 15, stockMin: 4, cost: 15000, price: 28000, compatibility: ['Universal'] },
  { sku: 'OTR-002', name: 'Manillar Completo 22mm', brand: 'Genérico', category: 'Otros', stock: 8, stockMin: 2, cost: 35000, price: 65000, compatibility: ['Universal 22mm'] },
  { sku: 'OTR-003', name: 'Casco Half Face Talla M', brand: 'LS2', category: 'Otros', stock: 5, stockMin: 1, cost: 120000, price: 220000, compatibility: ['Universal'] },
  { sku: 'OTR-004', name: 'Candado Disco 12mm', brand: 'Trelock', category: 'Otros', stock: 10, stockMin: 3, cost: 35000, price: 65000, compatibility: ['Universal'] },
  { sku: 'OTR-005', name: 'Cable Acelerador Universal 125cc', brand: 'Genérico', category: 'Otros', stock: 18, stockMin: 5, cost: 8000, price: 16000, compatibility: ['Universal 125cc'] },
  { sku: 'OTR-006', name: 'Cable Freno Trasero Universal', brand: 'Genérico', category: 'Otros', stock: 20, stockMin: 5, cost: 7000, price: 14000, compatibility: ['Universal'] },
  { sku: 'OTR-007', name: 'Cable Embrague Universal', brand: 'Genérico', category: 'Otros', stock: 16, stockMin: 4, cost: 8000, price: 15000, compatibility: ['Universal'] },
  { sku: 'OTR-008', name: 'Tapón Aceite con Varilla Universal', brand: 'Genérico', category: 'Otros', stock: 25, stockMin: 6, cost: 5000, price: 10000, compatibility: ['Universal'] },
  { sku: 'OTR-009', name: 'Rodamiento Dirección Universal', brand: 'NTN', category: 'Otros', stock: 12, stockMin: 3, cost: 20000, price: 38000, compatibility: ['Universal'] },
  { sku: 'OTR-010', name: 'Cinta Aislante y Kit Electrical', brand: 'Genérico', category: 'Otros', stock: 30, stockMin: 8, cost: 5000, price: 10000, compatibility: ['Universal'] },
];

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim() ?? process.env.DIRECT_URL?.trim();
  if (!connectionString) throw new Error('Falta DATABASE_URL');

  const ssl = connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined;
  const pool = new pg.Pool({ connectionString, ssl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const existing = await (prisma as any).product.findFirst({
      where: { workshopId: WORKSHOP_ID, sku: p.sku },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await (prisma as any).product.create({
      data: {
        workshopId: WORKSHOP_ID,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        compatibility: p.compatibility,
        stock: p.stock,
        stockMin: p.stockMin,
        cost: p.cost,
        price: p.price,
        active: true,
      },
    });
    created++;
    process.stdout.write(`  ✓ ${p.sku} — ${p.name}\n`);
  }

  console.log(`\nInventario seed completado: ${created} creados, ${skipped} ya existían.`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
