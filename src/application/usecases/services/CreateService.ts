import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import prisma from '../../../infrastructure/prisma/client';

type ProductItem = { productId: string; quantity: number; unitPrice: number };
type Input = {
  workshopId: string;
  motorcycleId: string;
  mechanicId: string;
  type: string;
  description?: string;
  laborCost?: number;
  kmAtService?: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: string;
  products?: ProductItem[];
};

export class CreateService {
  constructor(
    private readonly serviceRepo: ServiceRepository,
    private readonly motorcycleRepo: MotorcycleRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: Input) {
    const motorcycle = await this.motorcycleRepo.findById(input.motorcycleId);
    if (!motorcycle) throw new DomainError('Moto no encontrada', 404);

    const productsTotal = (input.products ?? []).reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0,
    );
    const laborCost = input.laborCost ?? 0;
    const totalCost = laborCost + productsTotal;

    const service = await this.serviceRepo.create({
      workshopId: input.workshopId,
      motorcycleId: input.motorcycleId,
      mechanicId: input.mechanicId,
      type: input.type,
      description: input.description,
      laborCost,
      totalCost,
      kmAtService: input.kmAtService ?? motorcycle.kmCurrent,
      nextMaintenanceKm: input.nextMaintenanceKm,
      nextMaintenanceDate: input.nextMaintenanceDate ? new Date(input.nextMaintenanceDate) : undefined,
      status: 'open',
      serviceDate: new Date(),
    });

    if (input.products?.length) {
      await (prisma as any).serviceProduct.createMany({
        data: input.products.map(p => ({ serviceId: service.id, ...p })),
      });
      for (const p of input.products) {
        await this.productRepo.decrementStock(p.productId, p.quantity);
      }
    }

    if (input.kmAtService && input.kmAtService > motorcycle.kmCurrent) {
      await this.motorcycleRepo.update(input.motorcycleId, { kmCurrent: input.kmAtService });
    }

    return service;
  }
}
