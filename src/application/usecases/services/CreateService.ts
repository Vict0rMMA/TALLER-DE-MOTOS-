import { Service } from '../../../domain/entities/Service';
import { DomainError } from '../../../domain/errors/DomainError';
import prisma from '../../../infrastructure/prisma/client';

type ProductItem = { productId: string; quantity: number; unitPrice: number };
type Input = {
  workshopId: string;
  userId: string;
  motorcycleId: string;
  mechanicId?: string;
  type: string;
  description?: string;
  laborCost?: number;
  kmAtService?: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: string;
  products?: ProductItem[];
};

export class CreateService {
  async execute(input: Input): Promise<Service> {
    // La moto no tiene workshopId propio: pertenece al taller a través del cliente.
    const motorcycle = await (prisma as any).motorcycle.findFirst({
      where: { id: input.motorcycleId, customer: { workshopId: input.workshopId } },
      select: { id: true, kmCurrent: true },
    });
    if (!motorcycle) throw new DomainError('Moto no encontrada', 404);

    if (input.mechanicId) {
      const mechanic = await (prisma as any).user.findFirst({
        where: { id: input.mechanicId, workshopId: input.workshopId },
        select: { id: true },
      });
      if (!mechanic) throw new DomainError('Mecánico no encontrado', 404);
    }

    // Agrupa líneas repetidas del mismo repuesto para que la validación de stock
    // mire la cantidad total pedida y no cada línea por separado.
    const items = new Map<string, number>();
    for (const p of input.products ?? []) {
      items.set(p.productId, (items.get(p.productId) ?? 0) + p.quantity);
    }

    if (items.size) {
      const found = await (prisma as any).product.findMany({
        where: { id: { in: [...items.keys()] }, workshopId: input.workshopId },
        select: { id: true, name: true, stock: true },
      });
      if (found.length !== items.size) throw new DomainError('Repuesto no encontrado', 404);
      for (const p of found) {
        const needed = items.get(p.id)!;
        if (p.stock < needed) {
          throw new DomainError(
            `Stock insuficiente de "${p.name}". Disponible: ${p.stock}, requerido: ${needed}`,
            422,
          );
        }
      }
    }

    const productsTotal = (input.products ?? []).reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0,
    );
    const laborCost = input.laborCost ?? 0;
    const totalCost = laborCost + productsTotal;
    const kmAtService = input.kmAtService ?? motorcycle.kmCurrent;

    // Todo o nada: el servicio, sus repuestos, el descuento de stock y el
    // movimiento de inventario viven en la misma transacción. Antes, un fallo a
    // mitad del bucle dejaba un servicio cobrando repuestos sin descontar.
    const row = await (prisma as any).$transaction(async (tx: any) => {
      const service = await tx.service.create({
        data: {
          workshopId: input.workshopId,
          motorcycleId: input.motorcycleId,
          mechanicId: input.mechanicId ?? null,
          type: input.type,
          description: input.description,
          laborCost,
          totalCost,
          kmAtService,
          nextMaintenanceKm: input.nextMaintenanceKm,
          nextMaintenanceDate: input.nextMaintenanceDate
            ? new Date(input.nextMaintenanceDate)
            : undefined,
          status: 'open',
          serviceDate: new Date(),
        },
      });

      if (input.products?.length) {
        await tx.serviceProduct.createMany({
          data: input.products.map((p) => ({
            serviceId: service.id,
            productId: p.productId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
        });

        for (const [productId, quantity] of items) {
          // El guard `stock: { gte: quantity }` va dentro del UPDATE para que dos
          // servicios simultáneos no puedan dejar el stock en negativo.
          const { count } = await tx.product.updateMany({
            where: { id: productId, workshopId: input.workshopId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (count !== 1) throw new DomainError('Stock insuficiente', 422);

          // Sin esto el consumo real no queda en el historial y Top Productos
          // y la predicción de demanda trabajan sobre datos incompletos.
          await tx.stockMovement.create({
            data: {
              productId,
              userId: input.userId,
              type: 'sale',
              quantity,
              reason: `Servicio ${service.id}`,
            },
          });
        }
      }

      if (kmAtService > motorcycle.kmCurrent) {
        await tx.motorcycle.update({
          where: { id: input.motorcycleId },
          data: { kmCurrent: kmAtService },
        });
      }

      return service;
    });

    return {
      id: row.id,
      workshopId: row.workshopId,
      motorcycleId: row.motorcycleId,
      mechanicId: row.mechanicId ?? undefined,
      type: row.type,
      description: row.description ?? undefined,
      laborCost: Number(row.laborCost),
      totalCost: Number(row.totalCost),
      kmAtService: row.kmAtService,
      nextMaintenanceKm: row.nextMaintenanceKm ?? undefined,
      nextMaintenanceDate: row.nextMaintenanceDate ?? undefined,
      status: row.status,
      serviceDate: row.serviceDate,
      closedAt: row.closedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
