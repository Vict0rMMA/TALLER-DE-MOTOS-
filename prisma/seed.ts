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

  // --- 3. Datos demo — solo si el taller no tiene clientes aún ---
  const existingCustomers = await prisma.customer.count({ where: { workshopId: workshop.id } });
  if (existingCustomers > 0) {
    console.log(`Taller ya tiene ${existingCustomers} clientes — saltando datos demo.`);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log('\nCreando datos demo...');

  // Productos / Inventario
  const products = await Promise.all([
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'ACE-10W40-1L',
        name: 'Aceite Motor 10W40 1L',
        brand: 'Castrol',
        category: 'lubricantes',
        stock: 18,
        stockMin: 5,
        cost: 22000,
        price: 28000,
        compatibility: ['Honda', 'Yamaha', 'Suzuki'],
      },
    }),
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'FRE-PAS-HON',
        name: 'Pastillas de Freno Honda',
        brand: 'EBC',
        category: 'frenos',
        stock: 2,
        stockMin: 4,
        cost: 28000,
        price: 38000,
        compatibility: ['Honda CB 125', 'Honda CB 150'],
      },
    }),
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'FIL-AIR-YAM',
        name: 'Filtro de Aire Yamaha FZ',
        brand: 'Yamaha',
        category: 'filtros',
        stock: 6,
        stockMin: 3,
        cost: 15000,
        price: 22000,
        compatibility: ['Yamaha FZ 150', 'Yamaha FZ 250'],
      },
    }),
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'BUJ-NGK-CR7',
        name: 'Bujía NGK CR7HSA',
        brand: 'NGK',
        category: 'electricidad',
        stock: 25,
        stockMin: 8,
        cost: 8000,
        price: 14000,
        compatibility: ['Honda', 'Yamaha', 'Suzuki', 'AKT'],
      },
    }),
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'CAD-SUZ-GS150',
        name: 'Cadena Transmisión Suzuki GS',
        brand: 'DID',
        category: 'transmision',
        stock: 1,
        stockMin: 3,
        cost: 42000,
        price: 62000,
        compatibility: ['Suzuki GS 150', 'Suzuki EN 125'],
      },
    }),
    prisma.product.create({
      data: {
        workshopId: workshop.id,
        sku: 'ACE-GEAR-140',
        name: 'Aceite Caja 140 250ml',
        brand: 'Mobil',
        category: 'lubricantes',
        stock: 12,
        stockMin: 4,
        cost: 9000,
        price: 15000,
        compatibility: ['Honda', 'Yamaha', 'Suzuki', 'AKT', 'TVS'],
      },
    }),
  ]);

  // Clientes y motos
  const c1 = await prisma.customer.create({
    data: {
      workshopId: workshop.id,
      name: 'Carlos Rodríguez',
      cedula: '79845231',
      phone: '3001234567',
      email: 'carlos.rodriguez@gmail.com',
      optInWhatsapp: true,
      portalActive: false,
    },
  });
  const moto1 = await prisma.motorcycle.create({
    data: {
      customerId: c1.id,
      placa: 'ABC123',
      brand: 'Honda',
      model: 'CB 125F',
      cc: 125,
      year: 2022,
      kmCurrent: 18400,
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      workshopId: workshop.id,
      name: 'María López',
      cedula: '52301847',
      phone: '3109876543',
      email: 'maria.lopez@hotmail.com',
      optInWhatsapp: true,
      portalActive: false,
    },
  });
  const moto2 = await prisma.motorcycle.create({
    data: {
      customerId: c2.id,
      placa: 'DEF456',
      brand: 'Yamaha',
      model: 'FZ 150',
      cc: 150,
      year: 2021,
      kmCurrent: 32100,
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      workshopId: workshop.id,
      name: 'Andrés Martínez',
      cedula: '1020345678',
      phone: '3201112233',
      optInWhatsapp: true,
      portalActive: false,
    },
  });
  const moto3 = await prisma.motorcycle.create({
    data: {
      customerId: c3.id,
      placa: 'GHI789',
      brand: 'Suzuki',
      model: 'GS 150R',
      cc: 150,
      year: 2020,
      kmCurrent: 45700,
    },
  });

  const c4 = await prisma.customer.create({
    data: {
      workshopId: workshop.id,
      name: 'Luis Fernando Gómez',
      cedula: '71234567',
      phone: '3152223344',
      optInWhatsapp: false,
      portalActive: false,
    },
  });
  const moto4 = await prisma.motorcycle.create({
    data: {
      customerId: c4.id,
      placa: 'JKL012',
      brand: 'AKT',
      model: 'TTR 125',
      cc: 125,
      year: 2023,
      kmCurrent: 8200,
    },
  });

  // Fechas para este mes (mayo 2026)
  const thisMonth = new Date('2026-05-10T08:00:00Z');
  const thisMonth2 = new Date('2026-05-14T10:30:00Z');
  const thisMonth3 = new Date('2026-05-18T09:00:00Z');
  const today = new Date('2026-05-22T08:00:00Z');
  const yesterday = new Date('2026-05-21T14:00:00Z');

  // Servicios cerrados este mes (para KPIs)
  const s1 = await prisma.service.create({
    data: {
      workshopId: workshop.id,
      motorcycleId: moto1.id,
      mechanicId: adminUser.id,
      type: 'oil_change',
      description: 'Cambio de aceite 10W40 y filtro. Revisión general de nivel de fluidos.',
      laborCost: 20000,
      totalCost: 63000,
      kmAtService: 18400,
      nextMaintenanceKm: 20400,
      status: 'closed',
      serviceDate: thisMonth,
      closedAt: thisMonth,
    },
  });
  await prisma.serviceProduct.createMany({
    data: [
      { serviceId: s1.id, productId: products[0].id, quantity: 1, unitPrice: 28000 },
      { serviceId: s1.id, productId: products[5].id, quantity: 1, unitPrice: 15000 },
    ],
  });

  const s2 = await prisma.service.create({
    data: {
      workshopId: workshop.id,
      motorcycleId: moto2.id,
      mechanicId: adminUser.id,
      type: 'brake_repair',
      description: 'Cambio de pastillas de freno delanteras y traseras. Purgada de líquido de frenos.',
      laborCost: 35000,
      totalCost: 111000,
      kmAtService: 32100,
      status: 'closed',
      serviceDate: thisMonth2,
      closedAt: thisMonth2,
    },
  });
  await prisma.serviceProduct.createMany({
    data: [
      { serviceId: s2.id, productId: products[1].id, quantity: 2, unitPrice: 38000 },
    ],
  });

  const s3 = await prisma.service.create({
    data: {
      workshopId: workshop.id,
      motorcycleId: moto3.id,
      mechanicId: adminUser.id,
      type: 'general_service',
      description: 'Servicio mayor: aceite, filtros, bujía, revisión de frenos y transmisión.',
      laborCost: 45000,
      totalCost: 118000,
      kmAtService: 45700,
      nextMaintenanceKm: 50700,
      status: 'closed',
      serviceDate: thisMonth3,
      closedAt: thisMonth3,
    },
  });
  await prisma.serviceProduct.createMany({
    data: [
      { serviceId: s3.id, productId: products[0].id, quantity: 1, unitPrice: 28000 },
      { serviceId: s3.id, productId: products[2].id, quantity: 1, unitPrice: 22000 },
      { serviceId: s3.id, productId: products[3].id, quantity: 1, unitPrice: 14000 },
      { serviceId: s3.id, productId: products[5].id, quantity: 1, unitPrice: 15000 },
      { serviceId: s3.id, productId: products[4].id, quantity: 0, unitPrice: 62000 },
    ],
  });

  // Servicio en progreso
  const s4 = await prisma.service.create({
    data: {
      workshopId: workshop.id,
      motorcycleId: moto4.id,
      mechanicId: adminUser.id,
      type: 'chain_replacement',
      description: 'Cambio de cadena y piñones. Ajuste de tensión.',
      laborCost: 30000,
      totalCost: 92000,
      kmAtService: 8200,
      status: 'in_progress',
      serviceDate: yesterday,
    },
  });
  await prisma.serviceProduct.create({
    data: { serviceId: s4.id, productId: products[4].id, quantity: 1, unitPrice: 62000 },
  });

  // Servicio abierto (recién ingresó)
  await prisma.service.create({
    data: {
      workshopId: workshop.id,
      motorcycleId: moto1.id,
      type: 'diagnosis',
      description: 'Cliente reporta falla en arranque y ruido en motor. Diagnóstico pendiente.',
      laborCost: 0,
      totalCost: 0,
      kmAtService: 18600,
      status: 'open',
      serviceDate: today,
    },
  });

  // Notificación demo de s2 (cerrado)
  await prisma.notification.create({
    data: {
      workshopId: workshop.id,
      customerId: c2.id,
      serviceId: s2.id,
      type: 'service_update',
      status: 'sent',
      phone: c2.phone,
      message: `Hola María, su moto Yamaha FZ 150 (DEF456) ya está lista. Total: $111.000 COP. ¡Gracias por confiar en ${workshopName}!`,
    },
  });

  console.log('\nDatos demo creados:');
  console.log('  Clientes: 4 (Carlos, María, Andrés, Luis Fernando)');
  console.log('  Motos:    4');
  console.log('  Servicios: 5 (3 cerrados este mes, 1 en progreso, 1 abierto)');
  console.log('  Productos: 6 (2 con stock bajo → alerta dashboard)');
  console.log('  Ingresos del mes: $292.000 COP');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
