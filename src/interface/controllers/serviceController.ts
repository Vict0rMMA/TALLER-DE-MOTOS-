import { Request, Response, NextFunction } from 'express';
import { PrismaServiceRepository } from '../../infrastructure/repositories/PrismaServiceRepository';
import { PrismaMotorcycleRepository } from '../../infrastructure/repositories/PrismaMotorcycleRepository';
import { PrismaProductRepository } from '../../infrastructure/repositories/PrismaProductRepository';
import { CreateService } from '../../application/usecases/services/CreateService';
import { UpdateService } from '../../application/usecases/services/UpdateService';
import { CloseService } from '../../application/usecases/services/CloseService';
import { GetUpcomingMaintenance } from '../../application/usecases/services/GetUpcomingMaintenance';
import { WhatsAppWebService } from '../../infrastructure/whatsapp/WhatsAppWebService';
import { DomainError } from '../../domain/errors/DomainError';
import { env } from '../../infrastructure/config/env';
import prisma from '../../infrastructure/prisma/client';

const serviceRepo = new PrismaServiceRepository();
const motorcycleRepo = new PrismaMotorcycleRepository();
const productRepo = new PrismaProductRepository();

function mapServiceRow(r: any) {
  return {
    id: r.id,
    workshopId: r.workshopId,
    motorcycleId: r.motorcycleId,
    mechanicId: r.mechanicId ?? undefined,
    mechanicName: r.mechanic?.name ?? undefined,
    type: r.type,
    status: r.status,
    description: r.description ?? undefined,
    diagnosis: r.diagnosis ?? undefined,
    laborCost: Number(r.laborCost ?? 0),
    total: Number(r.totalCost ?? 0),
    openedAt: r.serviceDate ?? r.createdAt,
    closedAt: r.closedAt ?? undefined,
    createdAt: r.createdAt,
    customerName: r.motorcycle?.customer?.name ?? undefined,
    placa: r.motorcycle?.placa ?? undefined,
    products: (r.products ?? []).map((p: any) => ({
      productId: p.productId,
      productName: p.product?.name ?? 'Producto',
      quantity: p.quantity,
      unitPrice: Number(p.unitPrice),
      subtotal: Number(p.unitPrice) * p.quantity,
    })),
  };
}

export const listServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Number(q.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { workshopId: req.workshopId! };
    if (q.status) where.status = q.status;

    const [rows, total] = await Promise.all([
      (prisma as any).service.findMany({
        where,
        orderBy: { serviceDate: 'desc' },
        skip,
        take: limit,
        include: {
          motorcycle: { include: { customer: { select: { name: true } } } },
          mechanic: { select: { name: true } },
          products: { include: { product: { select: { name: true } } } },
        },
      }),
      (prisma as any).service.count({ where }),
    ]);

    res.json({
      data: rows.map(mapServiceRow),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
};

export const getService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await (prisma as any).service.findFirst({
      where: { id: String(req.params.id), workshopId: req.workshopId! },
      include: {
        motorcycle: { include: { customer: { select: { name: true } } } },
        mechanic: { select: { name: true } },
        products: { include: { product: { select: { name: true } } } },
      },
    });
    if (!r) throw new DomainError('Servicio no encontrado', 404);
    res.json(mapServiceRow(r));
  } catch (e) {
    next(e);
  }
};

export const getUpcomingMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Number((req.query as any).days ?? 30);
    res.json(await new GetUpcomingMaintenance(serviceRepo).execute(req.workshopId!, days));
  } catch (e) {
    next(e);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new CreateService(serviceRepo, motorcycleRepo, productRepo).execute({
      ...req.body,
      workshopId: req.workshopId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await new UpdateService(serviceRepo).execute({
        id: String(req.params.id),
        workshopId: req.workshopId!,
        data: req.body,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const closeService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = String(req.params.id);
    const result = await new CloseService(serviceRepo).execute({
      id: serviceId,
      workshopId: req.workshopId!,
      ...req.body,
    });

    (async () => {
      try {
        const row = await (prisma as any).service.findFirst({
          where: { id: serviceId },
          include: {
            motorcycle: {
              include: { customer: { select: { name: true, phone: true, optInWhatsapp: true } } },
            },
          },
        });
        const customer = row?.motorcycle?.customer;
        if (customer?.optInWhatsapp && customer?.phone) {
          const wa = new WhatsAppWebService();
          const total = Number(result.totalCost ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
          const receiptUrl = `${env.APP_URL}/recibo/${serviceId}`;
          await wa.sendMessage(
            customer.phone,
            `✅ *${customer.name ?? 'Cliente'}*, tu moto *${row?.motorcycle?.placa ?? ''}* ya está lista en el taller.\n\n` +
            `🔧 ${row?.description ?? 'Servicio completado'}\n💰 Total: $${total} COP\n\n` +
            `📄 Ver tu recibo completo:\n${receiptUrl}`,
          );
        }
      } catch (waErr) {
        console.warn('[closeService] WhatsApp notification failed:', (waErr as Error).message);
      }
    })();

    res.json(result);
  } catch (e) {
    next(e);
  }
};
