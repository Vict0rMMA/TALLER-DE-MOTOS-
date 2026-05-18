import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';

type Input = { id: string; workshopId: string; laborCost?: number };

export class CloseService {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(input: Input) {
    const service = await this.serviceRepo.findById(input.id, input.workshopId);
    if (!service) throw new DomainError('Servicio no encontrado', 404);
    if (service.status === 'closed') throw new DomainError('El servicio ya está cerrado', 422);

    if (input.laborCost !== undefined) {
      const productsTotal = service.products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
      await this.serviceRepo.update(input.id, input.workshopId, {
        laborCost: input.laborCost,
        totalCost: input.laborCost + productsTotal,
      });
    }

    return this.serviceRepo.close(input.id, input.workshopId, new Date());
  }
}
