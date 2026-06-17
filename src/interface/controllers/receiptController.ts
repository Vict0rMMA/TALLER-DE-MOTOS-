import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { DomainError } from '../../domain/errors/DomainError';

export const getReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = String(req.params.id);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        workshop: { select: { name: true, nit: true, phone: true, address: true } },
        motorcycle: {
          select: {
            placa: true, brand: true, model: true, year: true, cc: true,
            customer: { select: { name: true, phone: true, cedula: true, email: true } },
          },
        },
        mechanic: { select: { name: true } },
        products: { include: { product: { select: { name: true, brand: true } } } },
      },
    });

    if (!service) return next(new DomainError('Recibo no encontrado', 404));

    const laborCost = Number(service.laborCost);
    const partsTotal = service.products.reduce(
      (s, p) => s + Number(p.unitPrice) * p.quantity,
      0,
    );
    const discount = Number(service.discount);
    const subtotal = laborCost + partsTotal;
    const total = subtotal - discount;

    res.json({
      id: service.id,
      type: service.type,
      description: service.description,
      status: service.status,
      photos: service.photos,
      serviceDate: service.serviceDate,
      closedAt: service.closedAt,
      kmAtService: service.kmAtService,
      nextMaintenanceKm: service.nextMaintenanceKm,
      nextMaintenanceDate: service.nextMaintenanceDate,
      laborCost,
      totalCost: Number(service.totalCost),
      // --- Factura ---
      invoiceNumber: service.invoiceNumber,
      paymentMethod: service.paymentMethod,
      paymentReference: service.paymentReference,
      warranty: service.warranty,
      notes: service.notes,
      partsTotal,
      subtotal,
      discount,
      total,
      workshop: service.workshop,
      motorcycle: {
        placa: service.motorcycle.placa,
        brand: service.motorcycle.brand,
        model: service.motorcycle.model,
        year: service.motorcycle.year,
        cc: service.motorcycle.cc,
      },
      customer: service.motorcycle.customer,
      mechanic: service.mechanic?.name ?? null,
      products: service.products.map((p) => ({
        name: p.product.name,
        brand: p.product.brand ?? null,
        quantity: p.quantity,
        unitPrice: Number(p.unitPrice),
        subtotal: Number(p.unitPrice) * p.quantity,
      })),
    });
  } catch (e) { next(e); }
};
